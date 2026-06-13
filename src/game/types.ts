export type DifficultyId = "easy" | "normal" | "hard" | "expert";
export type GeneratorVersion = "daily-v1";
export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };

export type PathPoint = Point & {
  t: number;
  distance: number;
};

export type GeneratedPath = {
  seed: string;
  generatorVersion: GeneratorVersion;
  difficulty: DifficultyId;
  viewport: Viewport;
  start: Point;
  end: Point;
  points: PathPoint[];
  totalLength: number;
  usedFallback: boolean;
};

export type DailyContext = {
  localDateKey: string;
  timezoneOffset: number;
  seed: string;
  generatorVersion: GeneratorVersion;
  difficulty: "normal";
};

export type FailReason =
  | "lifted"
  | "off_path"
  | "skip_detected"
  | "stalled"
  | "offscreen"
  | "invalid_run"
  | "pointer_cancel";

export type RunMetrics = {
  accuracy: number;
  smoothness: number;
  durationMs: number | null;
  warningPeak: number;
  warningCount: number;
};
