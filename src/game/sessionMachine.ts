import { GAMEPLAY_DEFAULTS } from "./config";
import { distance } from "./pathGeometry";
import { getCoverageRatio, judgeProgressSample } from "./progressJudge";
import { calculateOfficialScore } from "./scoring";
import type { FailReason, GeneratedPath, Point, RunMetrics } from "./types";

export type SessionStatus = "ready" | "tracing" | "warning" | "success" | "failed";

export type SessionSnapshot = {
  status: SessionStatus;
  progressT: number;
  progressMax: number;
  warningMeter: number;
  failureReason: FailReason | null;
  startedAtMs: number | null;
  endedAtMs: number | null;
  metrics: RunMetrics;
  lastTouch: Point | null;
  coverageRatio: number;
  score: number | null;
};

type Sample = {
  point: Point;
  timeMs: number;
  distancePx: number;
};

function emptyMetrics(): RunMetrics {
  return {
    accuracy: 0,
    smoothness: 1,
    durationMs: null,
    warningPeak: 0,
    warningCount: 0,
  };
}

function calculateMetrics(
  samples: Sample[],
  startedAtMs: number | null,
  endedAtMs: number | null,
  warningPeak: number,
  warningCount: number,
  failDistancePx: number,
): RunMetrics {
  const accuracy =
    samples.length === 0
      ? 0
      : samples.reduce((total, sample) => total + (1 - Math.min(1, sample.distancePx / failDistancePx)), 0) /
        samples.length;
  const turns: number[] = [];

  for (let index = 2; index < samples.length; index += 1) {
    const a = samples[index - 2].point;
    const b = samples[index - 1].point;
    const c = samples[index].point;
    const first = Math.atan2(b.y - a.y, b.x - a.x);
    const second = Math.atan2(c.y - b.y, c.x - b.x);
    const delta = Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)));
    turns.push(delta);
  }

  const averageTurn = turns.length === 0 ? 0 : turns.reduce((total, value) => total + value, 0) / turns.length;
  const smoothness = 1 - Math.min(1, averageTurn / (Math.PI / 2));

  return {
    accuracy,
    smoothness,
    durationMs: startedAtMs === null || endedAtMs === null ? null : Math.max(0, endedAtMs - startedAtMs),
    warningPeak,
    warningCount,
  };
}

export function createSessionMachine(path: GeneratedPath) {
  let status: SessionStatus = "ready";
  let progressT = 0;
  let progressMax = 0;
  let warningMeter = 0;
  let warningPeak = 0;
  let warningCount = 0;
  let failureReason: FailReason | null = null;
  let startedAtMs: number | null = null;
  let endedAtMs: number | null = null;
  let lastTouch: Point | null = null;
  let lastAcceptedAtMs = 0;
  let lastEventAtMs = 0;
  let liftStartedAtMs: number | null = null;
  let coveredSegments = new Set<number>();
  let samples: Sample[] = [];
  let score: number | null = null;

  function fail(reason: FailReason, timeMs: number) {
    if (status === "success" || status === "failed") return;
    status = "failed";
    failureReason = reason;
    endedAtMs = timeMs;
  }

  function maybeSucceed(timeMs: number) {
    const endpointDistance = lastTouch ? distance(lastTouch, path.end) : Infinity;
    const coverageRatio = getCoverageRatio(coveredSegments);
    if (
      progressT >= GAMEPLAY_DEFAULTS.finishThresholdT &&
      endpointDistance <= GAMEPLAY_DEFAULTS.endpointTolerancePx &&
      coverageRatio >= GAMEPLAY_DEFAULTS.requiredCoverageRatio &&
      warningMeter < 85
    ) {
      status = "success";
      endedAtMs = timeMs;
      const metrics = calculateMetrics(samples, startedAtMs, endedAtMs, warningPeak, warningCount, path.rules.failDistancePx);
      score = calculateOfficialScore({
        completed: true,
        accuracy: metrics.accuracy,
        smoothness: metrics.smoothness,
        durationMs: metrics.durationMs ?? 1,
        targetDurationMs: Math.max(1, path.totalLength / 0.1),
        warningPeak,
        warningCount,
        progressMax,
      });
    }
  }

  function getSnapshot(): SessionSnapshot {
    const metrics = calculateMetrics(samples, startedAtMs, endedAtMs, warningPeak, warningCount, path.rules.failDistancePx);
    return {
      status,
      progressT,
      progressMax,
      warningMeter,
      failureReason,
      startedAtMs,
      endedAtMs,
      metrics,
      lastTouch,
      coverageRatio: getCoverageRatio(coveredSegments),
      score,
    };
  }

  function pointerDown(point: Point, timeMs: number) {
    if (status === "success" || status === "failed") return;

    if (status === "ready") {
      if (distance(point, path.start) > GAMEPLAY_DEFAULTS.startGateRadiusPx) {
        lastTouch = point;
        return;
      }
      status = "tracing";
      startedAtMs = timeMs;
      lastAcceptedAtMs = timeMs;
      coveredSegments = new Set([0]);
    }

    liftStartedAtMs = null;
    lastTouch = point;
    lastEventAtMs = timeMs;
  }

  function pointerMove(point: Point, timeMs: number) {
    if (status === "ready" || status === "success" || status === "failed") return;

    const judgment = judgeProgressSample({
      point,
      path,
      previousProgressT: progressT,
      coveredSegments,
      previousTimeMs: lastAcceptedAtMs,
      timeMs,
    });
    const dt = Math.max(0, (timeMs - lastEventAtMs) / 1000);

    lastTouch = point;
    lastEventAtMs = timeMs;
    liftStartedAtMs = null;

    if (judgment.warningLevel === "fail") {
      warningMeter = GAMEPLAY_DEFAULTS.warningMeterMax;
      warningPeak = warningMeter;
      fail("off_path", timeMs);
      return;
    }

    if (judgment.suspiciousJump) {
      warningMeter = Math.min(GAMEPLAY_DEFAULTS.warningMeterMax, warningMeter + 20);
      warningCount += 1;
      if (warningCount >= 3) {
        fail("skip_detected", timeMs);
        return;
      }
    } else if (judgment.warningLevel === "warning") {
      warningMeter = Math.min(
        GAMEPLAY_DEFAULTS.warningMeterMax,
        warningMeter + path.rules.warningIncreaseRatePerSecond * Math.max(0.016, dt),
      );
    } else {
      warningMeter = Math.max(0, warningMeter - path.rules.warningRecoverRatePerSecond * Math.max(0.016, dt));
    }

    warningPeak = Math.max(warningPeak, warningMeter);

    if (warningMeter >= GAMEPLAY_DEFAULTS.warningMeterMax) {
      fail(judgment.suspiciousJump ? "skip_detected" : "off_path", timeMs);
      return;
    }

    status = warningMeter > 0 || judgment.warningLevel === "warning" || judgment.suspiciousJump ? "warning" : "tracing";

    if (judgment.accepted) {
      progressT = judgment.progressT;
      progressMax = Math.max(progressMax, progressT);
      coveredSegments = judgment.coveredSegments;
      lastAcceptedAtMs = timeMs;
      samples.push({ point, timeMs, distancePx: judgment.distancePx });
      maybeSucceed(timeMs);
    }
  }

  function pointerUp(timeMs: number) {
    if (status === "tracing" || status === "warning") {
      liftStartedAtMs = timeMs;
      lastEventAtMs = timeMs;
      status = "warning";
    }
  }

  function pointerCancel(timeMs: number) {
    fail("pointer_cancel", timeMs);
  }

  function tick(timeMs: number) {
    if (status === "success" || status === "failed" || status === "ready") return;

    if (liftStartedAtMs !== null) {
      const liftedMs = timeMs - liftStartedAtMs;
      warningMeter = Math.min(GAMEPLAY_DEFAULTS.warningMeterMax, warningMeter + (liftedMs / GAMEPLAY_DEFAULTS.liftGraceMs) * 12);
      warningPeak = Math.max(warningPeak, warningMeter);
      if (liftedMs > GAMEPLAY_DEFAULTS.liftGraceMs) {
        fail("lifted", timeMs);
      }
      return;
    }

    if (timeMs - lastAcceptedAtMs > path.rules.idleLimitMs) {
      fail("stalled", timeMs);
    }
  }

  function reset() {
    status = "ready";
    progressT = 0;
    progressMax = 0;
    warningMeter = 0;
    warningPeak = 0;
    warningCount = 0;
    failureReason = null;
    startedAtMs = null;
    endedAtMs = null;
    lastTouch = null;
    lastAcceptedAtMs = 0;
    lastEventAtMs = 0;
    liftStartedAtMs = null;
    coveredSegments = new Set();
    samples = [];
    score = null;
  }

  return {
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    tick,
    reset,
    getSnapshot,
  };
}
