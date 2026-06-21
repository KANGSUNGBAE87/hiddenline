import type { CourseLengthId, DifficultyId, GeneratorVersion, LineDifficultyId, OverlapDifficultyId, VisibilityLevelId } from "./types";

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

export const LINE_DIFFICULTIES: Record<
  LineDifficultyId,
  {
    labelWeight: number;
    amplitudeMultiplier: number;
    secondaryMultiplier: number;
    tertiaryMultiplier: number;
    quaternaryMultiplier: number;
    sampleCount: number;
    targetComplexity: number;
    minComplexity: number;
  }
> = {
  easy: {
    labelWeight: 1,
    amplitudeMultiplier: 0.72,
    secondaryMultiplier: 0.58,
    tertiaryMultiplier: 0.35,
    quaternaryMultiplier: 0,
    sampleCount: 112,
    targetComplexity: 0.34,
    minComplexity: 0.2,
  },
  normal: {
    labelWeight: 2,
    amplitudeMultiplier: 1,
    secondaryMultiplier: 1,
    tertiaryMultiplier: 1,
    quaternaryMultiplier: 0.28,
    sampleCount: 128,
    targetComplexity: 0.52,
    minComplexity: 0.36,
  },
  hard: {
    labelWeight: 3,
    amplitudeMultiplier: 1.34,
    secondaryMultiplier: 1.42,
    tertiaryMultiplier: 1.82,
    quaternaryMultiplier: 0.68,
    sampleCount: 152,
    targetComplexity: 0.76,
    minComplexity: 0.58,
  },
};

export const COURSE_LENGTHS: Record<
  CourseLengthId,
  {
    targetNormalizedLength: number;
    minNormalizedLength: number;
    maxNormalizedLength: number;
    sampleCount: number;
  }
> = {
  short: {
    targetNormalizedLength: 1.54,
    minNormalizedLength: 1.42,
    maxNormalizedLength: 1.74,
    sampleCount: 360,
  },
  basic: {
    targetNormalizedLength: 2.05,
    minNormalizedLength: 1.86,
    maxNormalizedLength: 2.25,
    sampleCount: 480,
  },
  long: {
    targetNormalizedLength: 2.85,
    minNormalizedLength: 2.55,
    maxNormalizedLength: 3.15,
    sampleCount: 560,
  },
  longRun: {
    targetNormalizedLength: 3.9,
    minNormalizedLength: 3.45,
    maxNormalizedLength: 4.35,
    sampleCount: 720,
  },
  marathon: {
    targetNormalizedLength: 5.12,
    minNormalizedLength: 4.65,
    maxNormalizedLength: 5.65,
    sampleCount: 960,
  },
};

export const OVERLAP_DIFFICULTIES: Record<
  OverlapDifficultyId,
  {
    minSelfIntersections: number;
    maxSelfIntersections: number;
    minTurnRadiusPx: number;
  }
> = {
  light: {
    minSelfIntersections: 0,
    maxSelfIntersections: 0,
    minTurnRadiusPx: 0.05,
  },
  normal: {
    minSelfIntersections: 1,
    maxSelfIntersections: 2,
    minTurnRadiusPx: 0.05,
  },
  complex: {
    minSelfIntersections: 3,
    maxSelfIntersections: 4,
    minTurnRadiusPx: 0.05,
  },
  hard: {
    minSelfIntersections: 5,
    maxSelfIntersections: 6,
    minTurnRadiusPx: 0.05,
  },
  master: {
    minSelfIntersections: 7,
    maxSelfIntersections: 12,
    minTurnRadiusPx: 0.05,
  },
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
  pathStrokeWidth: 5.6,
  revealedPathOpacity: 0.86,
  hiddenPathOpacity: 0,
  passedTrailOpacity: 0.09,
  destinationOpacity: 0.36,
  forwardPreviewOpacity: 0.07,
};
