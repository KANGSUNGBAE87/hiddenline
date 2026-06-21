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

function classifyDistance(distancePx: number, path: GeneratedPath): WarningLevel {
  if (distancePx <= path.rules.pathWidthPx) return "safe";
  if (distancePx <= path.rules.failDistancePx) return "warning";
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
  const dtSeconds = Math.max(0.016, (input.timeMs - input.previousTimeMs) / 1000);
  const allowedJump = Math.max(
    GAMEPLAY_DEFAULTS.maxProgressJumpPerFrame,
    GAMEPLAY_DEFAULTS.maxProgressJumpPerSecond * dtSeconds,
  );
  const projectionWindow = {
    minT: input.previousProgressT - GAMEPLAY_DEFAULTS.allowedBacktrackT,
    maxT: input.previousProgressT + Math.max(allowedJump, input.path.rules.forwardPreviewT * 3, 0.04),
  };
  const projection = projectPointToPath(input.point, input.path.points, projectionWindow);
  const fullProjection = projectPointToPath(input.point, input.path.points);
  const warningLevel = classifyDistance(projection.distance, input.path);
  const progressDelta = projection.progressT - input.previousProgressT;
  const fullProgressDelta = fullProjection.progressT - input.previousProgressT;
  const suspiciousJump =
    warningLevel === "fail" &&
    fullProjection.distance <= input.path.rules.failDistancePx &&
    fullProgressDelta > allowedJump &&
    fullProjection.progressT > projectionWindow.maxT;
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
