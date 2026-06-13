import { GAMEPLAY_DEFAULTS } from "./config";
import { clamp, projectPointToPath } from "./pathGeometry";
import type { GeneratedPath, Point } from "./types";

export type WarningLevel = "safe" | "warning" | "fail";

export type ProgressJudgment = {
  accepted: boolean;
  progressT: number;
  projectedProgressT: number;
  distancePx: number;
  warningLevel: WarningLevel;
  suspiciousJump: boolean;
  coveredSegments: Set<number>;
};

export type ProgressJudgmentInput = {
  point: Point;
  path: GeneratedPath;
  previousProgressT: number;
  coveredSegments: Set<number>;
  previousTimeMs: number;
  timeMs: number;
};

function classifyDistance(distancePx: number): WarningLevel {
  if (distancePx <= GAMEPLAY_DEFAULTS.pathWidthPx) return "safe";
  if (distancePx <= GAMEPLAY_DEFAULTS.failDistancePx) return "warning";
  return "fail";
}

function markCoverage(coveredSegments: Set<number>, fromT: number, toT: number): Set<number> {
  const next = new Set(coveredSegments);
  const count = GAMEPLAY_DEFAULTS.coverageSegmentCount;
  const start = clamp(Math.floor(Math.min(fromT, toT) * count), 0, count - 1);
  const end = clamp(Math.floor(Math.max(fromT, toT) * count), 0, count - 1);

  for (let segment = start; segment <= end; segment += 1) {
    next.add(segment);
  }

  return next;
}

export function getCoverageRatio(coveredSegments: Set<number>): number {
  return clamp(coveredSegments.size / GAMEPLAY_DEFAULTS.coverageSegmentCount, 0, 1);
}

export function judgeProgressSample(input: ProgressJudgmentInput): ProgressJudgment {
  const projection = projectPointToPath(input.point, input.path.points);
  const warningLevel = classifyDistance(projection.distance);
  const progressDelta = projection.progressT - input.previousProgressT;
  const dtSeconds = Math.max(0.016, (input.timeMs - input.previousTimeMs) / 1000);
  const allowedJump = Math.max(
    GAMEPLAY_DEFAULTS.maxProgressJumpPerFrame,
    GAMEPLAY_DEFAULTS.maxProgressJumpPerSecond * dtSeconds,
  );
  const suspiciousJump = progressDelta > allowedJump;
  const tooFarBack = progressDelta < -GAMEPLAY_DEFAULTS.allowedBacktrackT;
  const accepted = warningLevel !== "fail" && !suspiciousJump && !tooFarBack;
  const progressT = accepted ? Math.max(input.previousProgressT, projection.progressT) : input.previousProgressT;

  return {
    accepted,
    progressT,
    projectedProgressT: projection.progressT,
    distancePx: projection.distance,
    warningLevel,
    suspiciousJump,
    coveredSegments: accepted ? markCoverage(input.coveredSegments, input.previousProgressT, progressT) : new Set(input.coveredSegments),
  };
}
