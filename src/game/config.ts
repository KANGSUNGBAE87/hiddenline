import type { DifficultyId, GeneratorVersion } from "./types";

export const GAMEPLAY_DEFAULTS = {
  generatorVersion: "daily-v1" as GeneratorVersion,
  seedNamespace: "hiddenline-daily",
  officialDailyDifficulty: "normal" as const,
  finishThresholdT: 0.98,
  endpointTolerancePx: 36,
  requiredCoverageRatio: 0.92,
  coverageSegmentCount: 64,
  maxProgressJumpPerFrame: 0.035,
  maxProgressJumpPerSecond: 0.18,
  allowedBacktrackT: 0.025,
  smoothingAlpha: 0.35,
  deadzonePx: 3,
  liftGraceMs: 220,
  warningMeterMax: 100,
  warningIncreaseRatePerSecond: 45,
  warningRecoverRatePerSecond: 32,
  pathWidthPx: 30,
  failDistancePx: 48,
  idleLimitMs: 1500,
  safeMarginPx: 48,
  startGateRadiusPx: 44,
  maxPathAttempts: 32,
  scoreMax: 1000,
};

export const DIFFICULTIES: Record<
  DifficultyId,
  {
    pathWidthPx: number;
    revealRadiusPx: number;
    idleLimitMs: number;
    minTurnRadiusPx: number;
    maxTurnAngleDeg: number;
  }
> = {
  easy: {
    pathWidthPx: 42,
    revealRadiusPx: 128,
    idleLimitMs: 2000,
    minTurnRadiusPx: 120,
    maxTurnAngleDeg: 55,
  },
  normal: {
    pathWidthPx: 30,
    revealRadiusPx: 104,
    idleLimitMs: 1500,
    minTurnRadiusPx: 90,
    maxTurnAngleDeg: 65,
  },
  hard: {
    pathWidthPx: 22,
    revealRadiusPx: 84,
    idleLimitMs: 1000,
    minTurnRadiusPx: 68,
    maxTurnAngleDeg: 75,
  },
  expert: {
    pathWidthPx: 16,
    revealRadiusPx: 68,
    idleLimitMs: 750,
    minTurnRadiusPx: 52,
    maxTurnAngleDeg: 82,
  },
};

export const VISIBILITY_DEFAULTS = {
  revealRadiusPx: 64,
  touchFocusRadius: 58,
  activeBacktrackT: 0.012,
  passedTrailT: 0.032,
  forwardPreviewT: 0.014,
  pathStrokeWidth: 2.8,
  revealedPathOpacity: 0.86,
  hiddenPathOpacity: 0,
  passedTrailOpacity: 0.09,
  destinationOpacity: 0.36,
  forwardPreviewOpacity: 0.07,
};
