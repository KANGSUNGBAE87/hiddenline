export type PresetId = "intro" | "easy" | "standard" | "hard" | "expert";
export type CourseLengthId = "short" | "basic" | "long" | "longRun" | "marathon";
export type OverlapDifficultyId = "light" | "normal" | "complex" | "hard" | "master";
export type LineDifficultyId = "easy" | "normal" | "hard";
export type VisibilityLevelId = "easy" | "normal" | "hard";
export type DifficultyId = LineDifficultyId | "expert";
export type GeneratorVersion = "daily-v1" | "analytic-v2" | "organic-v5";
export type LineType = "warmup" | "main" | "curve" | "precision";
export type GeneratorProfileId = "gentle-warmup-v1" | "daily-main-normal-v1" | "curve-control-v1" | "precision-focus-v1";
export type ScoringProfileId =
  | "practice-no-official-v1"
  | "official-balanced-v2"
  | "curve-control-v1"
  | "precision-accuracy-v1";
export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };

export type PathPoint = Point & {
  t: number;
  distance: number;
  curvature?: number;
  u?: number;
};

// A single continuous organic curve. The path is generated as one smooth
// parametric spline and then sampled into the polyline used by rendering/judging.
export type AnalyticCurveDefinition = {
  kind: "organic-spline-v5";
  seed: string;
  generatorVersion: "organic-v5";
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  start: Point;
  end: Point;
  construction: "seeded-anchor-walk-chaikin-smooth";
  softLengthRangePx: { min: number; max: number };
  minTurnRadiusPx: number;
  anchorCount: number;
  turnPressure: number;
  sampleSpacingPx: number;
  pointCount: number;
  attemptIndex: number;
  usedFallback: boolean;
  measuredDifficultyScore: number;
  measuredMinTurnRadiusPx: number;
  occupancy: { widthRatio: number; heightRatio: number };
};

export type GeneratedPath = {
  seed: string;
  generatorVersion: GeneratorVersion;
  lineType?: LineType;
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  selfIntersectionCount: number;
  generatorProfileId?: GeneratorProfileId;
  difficulty: DifficultyId;
  lineDifficulty: LineDifficultyId;
  visibilityLevel: VisibilityLevelId;
  complexityScore: number;
  viewport: Viewport;
  start: Point;
  end: Point;
  curve?: AnalyticCurveDefinition;
  points: PathPoint[];
  totalLength: number;
  usedFallback: boolean;
  rules: {
    pathWidthPx: number;
    failDistancePx: number;
    revealRadiusPx: number;
    touchFocusRadiusPx: number;
    forwardPreviewT: number;
    idleLimitMs: number;
    warningIncreaseRatePerSecond: number;
    warningRecoverRatePerSecond: number;
  };
};

export type DailyContext = {
  localDateKey: string;
  timezoneOffset: number;
  seed: string;
  generatorVersion: GeneratorVersion;
  difficulty: DifficultyId;
};

export type DailyLineContext = DailyContext & {
  dailyPackId: string;
  lineType: LineType;
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  lineDifficulty: LineDifficultyId;
  visibilityLevel: VisibilityLevelId;
  generatorProfileId: GeneratorProfileId;
  scoringProfileId: ScoringProfileId;
  official: boolean;
  displayNameKey: string;
  descriptionKey: string;
  badgeKey: string;
};

export type DailyPackContext = {
  localDateKey: string;
  timezoneOffset: number;
  dailyPackId: string;
  generatorVersion: GeneratorVersion;
  lines: DailyLineContext[];
};

export type FailReason =
  | "lifted"
  | "off_path"
  | "skip_detected"
  | "stalled"
  | "offscreen"
  | "invalid_run"
  | "pointer_cancel"
  | "aborted";

export type RunMetrics = {
  accuracy: number;
  smoothness: number;
  durationMs: number | null;
  warningPeak: number;
  warningCount: number;
};

export type MeasurementKey = "accuracy" | "smoothness" | "calmness" | "completion" | "pace";

export type MeasurementValue = {
  value: number;
  displayPercent: number;
  weight?: number;
  explanationKey: string;
};

export type MeasurementBreakdown = Record<MeasurementKey, MeasurementValue>;
