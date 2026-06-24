import type { CourseLengthId, DifficultyId, GeneratorVersion, OverlapDifficultyId, VisibilityLevelId } from "./types";

export const GAMEPLAY_DEFAULTS = {
  generatorVersion: "organic-v5" as GeneratorVersion,
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
  maxPathAttempts: 64,
  scoreMax: 1000,
};

// Course controls the organic stroke burden. These values are not hard "must hit"
// length/crossing quotas; the generator scores candidates by measured length,
// broad loops, crossings, turns, and panel occupancy, then picks the best valid
// curve for the requested stage.
export const ORGANIC_CURVE_PROFILES: Record<
  CourseLengthId,
  {
    rank: number;
    softLengthRangePx: { min: number; max: number };
    safetyMaxLengthPx: number;
    minTurnRadiusPx: number;
    anchorCount: number;
    turnPressure: number;
    occupancyWeight: number;
  }
> = {
  short: {
    rank: 1,
    softLengthRangePx: { min: 700, max: 1000 },
    safetyMaxLengthPx: 1500,
    minTurnRadiusPx: 2.5,
    anchorCount: 8,
    turnPressure: 0.08,
    occupancyWeight: 0.8,
  },
  basic: {
    rank: 2,
    softLengthRangePx: { min: 880, max: 1280 },
    safetyMaxLengthPx: 1700,
    minTurnRadiusPx: 2.5,
    anchorCount: 10,
    turnPressure: 0.18,
    occupancyWeight: 0.95,
  },
  long: {
    rank: 3,
    softLengthRangePx: { min: 1100, max: 1500 },
    safetyMaxLengthPx: 1950,
    minTurnRadiusPx: 2,
    anchorCount: 13,
    turnPressure: 0.32,
    occupancyWeight: 1.12,
  },
  longRun: {
    rank: 4,
    softLengthRangePx: { min: 1320, max: 1800 },
    safetyMaxLengthPx: 3000,
    minTurnRadiusPx: 2,
    anchorCount: 16,
    turnPressure: 0.5,
    occupancyWeight: 1.25,
  },
  marathon: {
    rank: 5,
    softLengthRangePx: { min: 1580, max: 2200 },
    safetyMaxLengthPx: 3600,
    minTurnRadiusPx: 2,
    anchorCount: 20,
    turnPressure: 0.72,
    occupancyWeight: 1.38,
  },
};

export const ORGANIC_OVERLAP_PROFILES: Record<
  OverlapDifficultyId,
  {
    complexityBoost: number;
    minTurnRadiusScale: number;
    turnPressureBoost: number;
  }
> = {
  light: { complexityBoost: 0, minTurnRadiusScale: 1.08, turnPressureBoost: -0.1 },
  normal: { complexityBoost: 0.18, minTurnRadiusScale: 1.02, turnPressureBoost: -0.04 },
  complex: { complexityBoost: 0.34, minTurnRadiusScale: 0.96, turnPressureBoost: 0 },
  hard: { complexityBoost: 0.52, minTurnRadiusScale: 0.9, turnPressureBoost: 0.1 },
  master: { complexityBoost: 0.72, minTurnRadiusScale: 0.82, turnPressureBoost: 0.2 },
};

export const VISIBILITY_LEVELS: Record<
  VisibilityLevelId,
  {
    pathWidthPx: number;
    failDistancePx: number;
    revealRadiusPx: number;
    touchFocusRadiusPx: number;
    forwardPreviewT: number;
    idleLimitMs: number;
    minTurnRadiusPx: number;
    maxTurnAngleDeg: number;
    warningIncreaseRatePerSecond: number;
    warningRecoverRatePerSecond: number;
  }
> = {
  easy: {
    pathWidthPx: 38,
    failDistancePx: 60,
    revealRadiusPx: 248,
    touchFocusRadiusPx: 140,
    forwardPreviewT: 0.018,
    idleLimitMs: 1800,
    minTurnRadiusPx: 120,
    maxTurnAngleDeg: 55,
    warningIncreaseRatePerSecond: 34,
    warningRecoverRatePerSecond: 42,
  },
  normal: {
    pathWidthPx: 28,
    revealRadiusPx: 176,
    failDistancePx: 44,
    touchFocusRadiusPx: 108,
    forwardPreviewT: 0.011,
    idleLimitMs: 1350,
    minTurnRadiusPx: 90,
    maxTurnAngleDeg: 65,
    warningIncreaseRatePerSecond: 45,
    warningRecoverRatePerSecond: 32,
  },
  hard: {
    pathWidthPx: 18,
    failDistancePx: 30,
    revealRadiusPx: 124,
    touchFocusRadiusPx: 84,
    forwardPreviewT: 0.006,
    idleLimitMs: 850,
    minTurnRadiusPx: 68,
    maxTurnAngleDeg: 75,
    warningIncreaseRatePerSecond: 56,
    warningRecoverRatePerSecond: 26,
  },
};

export const DIFFICULTIES: Record<
  DifficultyId,
  {
    pathWidthPx: number;
    failDistancePx: number;
    revealRadiusPx: number;
    touchFocusRadiusPx: number;
    forwardPreviewT: number;
    idleLimitMs: number;
    minTurnRadiusPx: number;
    maxTurnAngleDeg: number;
    warningIncreaseRatePerSecond: number;
    warningRecoverRatePerSecond: number;
  }
> = {
  ...VISIBILITY_LEVELS,
  expert: {
    pathWidthPx: 16,
    failDistancePx: 30,
    revealRadiusPx: 136,
    touchFocusRadiusPx: 88,
    forwardPreviewT: 0.007,
    idleLimitMs: 750,
    minTurnRadiusPx: 52,
    maxTurnAngleDeg: 82,
    warningIncreaseRatePerSecond: 68,
    warningRecoverRatePerSecond: 20,
  },
};

export const VISIBILITY_DEFAULTS = {
  revealRadiusPx: 128,
  touchFocusRadius: 116,
  activeBacktrackT: 0.024,
  passedTrailT: 0.064,
  forwardPreviewT: 0.014,
  forwardPreviewRenderMultiplier: 2,
  pathStrokeWidth: 2.8,
  revealedPathOpacity: 0.86,
  hiddenPathOpacity: 0,
  passedTrailOpacity: 0.09,
  destinationOpacity: 0.36,
  forwardPreviewOpacity: 0.07,
};
