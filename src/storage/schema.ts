import type {
  CourseLengthId,
  FailReason,
  DifficultyId,
  GeneratorProfileId,
  GeneratorVersion,
  LineDifficultyId,
  LineType,
  MeasurementBreakdown,
  OverlapDifficultyId,
  ScoringProfileId,
  VisibilityLevelId,
} from "../game/types";

export type RunRecord = {
  schemaVersion: 1;
  id: string;
  mode: "daily";
  localDateKey: string;
  timezoneOffset: number;
  dailyPackId: string;
  lineType: LineType;
  courseLengthId?: CourseLengthId;
  overlapDifficultyId?: OverlapDifficultyId;
  seed: string;
  generatorVersion: GeneratorVersion;
  generatorProfileId: GeneratorProfileId;
  scoringProfileId: ScoringProfileId;
  difficulty: DifficultyId;
  lineDifficulty: LineDifficultyId;
  visibilityLevel: VisibilityLevelId;
  completed: boolean;
  status: "success" | "failed";
  score: number | null;
  measurementBreakdown?: MeasurementBreakdown;
  progressMax: number;
  accuracy: number;
  smoothness: number;
  warningPeak?: number;
  warningCount?: number;
  durationMs: number | null;
  failReason: FailReason | null;
  createdAt: string;
  updatedAt: string;
};

export type PresetId = "intro" | "easy" | "standard" | "hard" | "expert";

export type SessionEvent = {
  id: string;
  type:
    | "app_opened"
    | "return_next_day"
    | "last_session_state_loaded"
    | "last_session_state_saved"
    | "preset_selected"
    | "course_length_selected"
    | "overlap_difficulty_selected"
    | "visibility_level_selected"
    | "run_started"
    | "warning_shown"
    | "run_failed"
    | "run_completed"
    | "result_viewed"
    | "retry_same_seed_started"
    | "adjacent_preset_selected"
    | "daily_entry_opened"
    | "daily_run_started"
    | "difficulty_feedback_prompted"
    | "difficulty_feedback_submitted"
    | "sharp_turn_complaint_logged"
    | "overlap_confusion_logged";
  createdAt: string;
  payload?: Record<string, unknown>;
};

export type SessionEventType = SessionEvent["type"];

export type PersistedRecords = {
  schemaVersion: 1;
  records: RunRecord[];
};

export type PersistedSessionState = {
  schemaVersion: 1;
  lastPresetId: PresetId | null;
  lastCourseLengthId?: CourseLengthId | null;
  lastOverlapDifficultyId?: OverlapDifficultyId | null;
  lastVisibilityLevel?: VisibilityLevelId | null;
  lastSessionId: string | null;
  lastSessionDateKey: string | null;
  lastSessionOutcome: string | null;
};

export type PersistedEvents = {
  schemaVersion: 1;
  events: SessionEvent[];
};

export const RECORDS_STORAGE_KEY = "hiddenline.records.v1";
export const SESSION_STATE_STORAGE_KEY = "hiddenline.session-state.v1";
export const SESSION_EVENTS_STORAGE_KEY = "hiddenline.session-events.v1";
