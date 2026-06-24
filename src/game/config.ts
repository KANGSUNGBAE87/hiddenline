import type { CourseLengthId, DifficultyId, GeneratorVersion, OverlapDifficultyId, VisibilityLevelId } from "./types";

export const GAMEPLAY_DEFAULTS = {
  generatorVersion: "analytic-v2" as GeneratorVersion,
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

// Course length nudges the arc-length target of the curve (CSS px). Keeping the
// arcs large and non-crossing in a phone-narrow play box caps the clean length at
// roughly 800px, so these ranges are deliberately modest and overlapping: the
// course mainly shifts the target within the achievable band, not the hard max.
// 2000px remains the absolute generator ceiling.
export const PATH_LENGTH_RANGES_PX: Record<CourseLengthId, { min: number; max: number }> = {
  short: { min: 480, max: 780 },
  basic: { min: 520, max: 840 },
  long: { min: 560, max: 900 },
  longRun: { min: 600, max: 960 },
  marathon: { min: 640, max: 1000 },
};

// Overlap difficulty controls curve "tightness": larger minTurnRadius keeps the
// circles big ("원이 작지 않게"); smaller clearance lets the curve pass closer to
// itself without crossing. attractorCount drives how much the curve roams.
export const OVERLAP_SHAPE_PROFILES: Record<
  OverlapDifficultyId,
  {
    minTurnRadiusPx: number;
    selfClearancePx: number;
    attractorCount: { min: number; max: number };
  }
> = {
  light: { minTurnRadiusPx: 105, selfClearancePx: 64, attractorCount: { min: 2, max: 3 } },
  normal: { minTurnRadiusPx: 90, selfClearancePx: 58, attractorCount: { min: 2, max: 4 } },
  complex: { minTurnRadiusPx: 76, selfClearancePx: 50, attractorCount: { min: 3, max: 5 } },
  hard: { minTurnRadiusPx: 64, selfClearancePx: 44, attractorCount: { min: 4, max: 6 } },
  master: { minTurnRadiusPx: 56, selfClearancePx: 40, attractorCount: { min: 5, max: 7 } },
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
