import {
  RECORDS_STORAGE_KEY,
  SESSION_EVENTS_STORAGE_KEY,
  SESSION_STATE_STORAGE_KEY,
  type PersistedEvents,
  type PersistedRecords,
  type PersistedSessionState,
  type PresetId,
  type RunRecord,
  type SessionEvent,
} from "./schema";
import type { CourseLengthId, LineDifficultyId, LineType, OverlapDifficultyId, VisibilityLevelId } from "../game/types";
import {
  isCourseLengthId,
  isDifficultyId,
  isGeneratorProfileId,
  isLineDifficultyId,
  isLineType,
  isOverlapDifficultyId,
  isScoringProfileId,
  isVisibilityLevelId,
} from "../game/typeGuards";

const courseByLineType: Record<LineType, CourseLengthId> = {
  warmup: "short",
  main: "basic",
  curve: "longRun",
  precision: "marathon",
};

const overlapByLineDifficulty: Record<LineDifficultyId, OverlapDifficultyId> = {
  easy: "normal",
  normal: "complex",
  hard: "hard",
};

function resolveCourseLength(record: RunRecord): CourseLengthId {
  return isCourseLengthId(record.courseLengthId) ? record.courseLengthId : courseByLineType[record.lineType];
}

function resolveOverlapDifficulty(record: RunRecord): OverlapDifficultyId {
  return isOverlapDifficultyId(record.overlapDifficultyId)
    ? record.overlapDifficultyId
    : overlapByLineDifficulty[record.lineDifficulty];
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function normalizeRecord(record: RunRecord | Record<string, unknown>): RunRecord | null {
  if (record?.schemaVersion !== 1 || record.mode !== "daily") return null;
  const localDateKey = String(record.localDateKey ?? "");
  const lineType = isLineType(record.lineType) ? record.lineType : "main";
  const difficulty = isDifficultyId(record.difficulty) ? record.difficulty : "normal";
  const lineDifficulty = isLineDifficultyId(record.lineDifficulty)
    ? record.lineDifficulty
    : difficulty === "easy" || difficulty === "normal" || difficulty === "hard"
      ? difficulty
      : "normal";

  return {
    ...(record as RunRecord),
    dailyPackId: String(record.dailyPackId ?? `${localDateKey}:daily-pack-v1`),
    lineType,
    courseLengthId: isCourseLengthId(record.courseLengthId) ? record.courseLengthId : courseByLineType[lineType],
    overlapDifficultyId: isOverlapDifficultyId(record.overlapDifficultyId) ? record.overlapDifficultyId : overlapByLineDifficulty[lineDifficulty],
    difficulty,
    lineDifficulty,
    visibilityLevel: isVisibilityLevelId(record.visibilityLevel) ? record.visibilityLevel : "normal",
    generatorProfileId: isGeneratorProfileId(record.generatorProfileId) ? record.generatorProfileId : "daily-main-normal-v1",
    scoringProfileId: isScoringProfileId(record.scoringProfileId) ? record.scoringProfileId : "official-balanced-v2",
  };
}

function parseRecords(raw: string | null): RunRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersistedRecords;
    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.records)) return [];
    return parsed.records.map(normalizeRecord).filter((record): record is RunRecord => record !== null);
  } catch {
    return [];
  }
}

function parseEvents(raw: string | null): SessionEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersistedEvents;
    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.events)) return [];
    return parsed.events;
  } catch {
    return [];
  }
}

function parseSessionState(raw: string | null): PersistedSessionState {
  if (!raw) return { schemaVersion: 1, lastPresetId: null, lastCourseLengthId: null, lastOverlapDifficultyId: null, lastVisibilityLevel: null, lastSessionId: null, lastSessionDateKey: null, lastSessionOutcome: null };
  try {
    const parsed = JSON.parse(raw) as PersistedSessionState;
    if (parsed?.schemaVersion !== 1) throw new Error("bad schema");
    return {
      schemaVersion: 1,
      lastPresetId: parsed.lastPresetId ?? null,
      lastCourseLengthId: isCourseLengthId(parsed.lastCourseLengthId) ? parsed.lastCourseLengthId : null,
      lastOverlapDifficultyId: isOverlapDifficultyId(parsed.lastOverlapDifficultyId) ? parsed.lastOverlapDifficultyId : null,
      lastVisibilityLevel: isVisibilityLevelId(parsed.lastVisibilityLevel) ? parsed.lastVisibilityLevel : null,
      lastSessionId: parsed.lastSessionId ?? null,
      lastSessionDateKey: parsed.lastSessionDateKey ?? null,
      lastSessionOutcome: parsed.lastSessionOutcome ?? null,
    };
  } catch {
    return { schemaVersion: 1, lastPresetId: null, lastCourseLengthId: null, lastOverlapDifficultyId: null, lastVisibilityLevel: null, lastSessionId: null, lastSessionDateKey: null, lastSessionOutcome: null };
  }
}

function resolveBestQuery(
  first: CourseLengthId | LineType,
  second: OverlapDifficultyId | LineDifficultyId,
  visibilityLevel: VisibilityLevelId,
): { courseLengthId: CourseLengthId; overlapDifficultyId: OverlapDifficultyId; visibilityLevel: VisibilityLevelId } {
  if (isLineType(first)) {
    const lineDifficulty = isLineDifficultyId(second) ? second : "normal";
    return {
      courseLengthId: courseByLineType[first],
      overlapDifficultyId: overlapByLineDifficulty[lineDifficulty],
      visibilityLevel,
    };
  }

  return {
    courseLengthId: first,
    overlapDifficultyId: isOverlapDifficultyId(second) ? second : "complex",
    visibilityLevel,
  };
}

function isBestCandidate(record: RunRecord, courseLengthId: CourseLengthId, overlapDifficultyId: OverlapDifficultyId, visibilityLevel: VisibilityLevelId): boolean {
  return resolveCourseLength(record) === courseLengthId &&
    resolveOverlapDifficulty(record) === overlapDifficultyId &&
    record.visibilityLevel === visibilityLevel &&
    record.completed &&
    record.status === "success" &&
    typeof record.score === "number";
}

export class LocalStorageRepository {
  constructor(private readonly storage: StorageLike) {}

  getAllDailyRecords(): RunRecord[] { return parseRecords(this.storage.getItem(RECORDS_STORAGE_KEY)); }
  saveRun(record: RunRecord): void {
    const records = this.getAllDailyRecords();
    const idx = records.findIndex((item) => item.id === record.id);
    if (idx >= 0) records[idx] = record; else records.push(record);
    this.storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records } satisfies PersistedRecords));
  }
  getSessionEvents(): SessionEvent[] { return parseEvents(this.storage.getItem(SESSION_EVENTS_STORAGE_KEY)); }
  appendEvent(event: SessionEvent): void {
    const events = this.getSessionEvents();
    events.push(event);
    this.storage.setItem(SESSION_EVENTS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, events } satisfies PersistedEvents));
  }
  getSessionState(): PersistedSessionState { return parseSessionState(this.storage.getItem(SESSION_STATE_STORAGE_KEY)); }
  setSessionState(next: PersistedSessionState): void { this.storage.setItem(SESSION_STATE_STORAGE_KEY, JSON.stringify(next satisfies PersistedSessionState)); }
  setLastPresetId(lastPresetId: PresetId | null): void { this.setSessionState({ ...this.getSessionState(), lastPresetId }); }
  getDailyBest(localDateKey: string, courseLengthId?: CourseLengthId, overlapDifficultyId?: OverlapDifficultyId, visibilityLevel?: VisibilityLevelId): RunRecord | null;
  getDailyBest(localDateKey: string, lineType?: LineType, lineDifficulty?: LineDifficultyId, visibilityLevel?: VisibilityLevelId): RunRecord | null;
  getDailyBest(
    localDateKey: string,
    first: CourseLengthId | LineType = "basic",
    second: OverlapDifficultyId | LineDifficultyId = "complex",
    visibilityLevel: VisibilityLevelId = "normal",
  ): RunRecord | null {
    const query = resolveBestQuery(first, second, visibilityLevel);
    const candidates = this.getAllDailyRecords().filter((record) => record.localDateKey === localDateKey && isBestCandidate(record, query.courseLengthId, query.overlapDifficultyId, query.visibilityLevel));
    return candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
  }
  getPreviousDailyBest(localDateKey: string, courseLengthId?: CourseLengthId, overlapDifficultyId?: OverlapDifficultyId, visibilityLevel?: VisibilityLevelId): RunRecord | null;
  getPreviousDailyBest(localDateKey: string, lineType?: LineType, lineDifficulty?: LineDifficultyId, visibilityLevel?: VisibilityLevelId): RunRecord | null;
  getPreviousDailyBest(
    localDateKey: string,
    first: CourseLengthId | LineType = "basic",
    second: OverlapDifficultyId | LineDifficultyId = "complex",
    visibilityLevel: VisibilityLevelId = "normal",
  ): RunRecord | null {
    const query = resolveBestQuery(first, second, visibilityLevel);
    const previousCandidates = this.getAllDailyRecords().filter((record) => record.localDateKey < localDateKey && isBestCandidate(record, query.courseLengthId, query.overlapDifficultyId, query.visibilityLevel));
    return previousCandidates.sort((a, b) => b.localDateKey.localeCompare(a.localDateKey) || (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
  }
  getDailyPackRecords(localDateKey: string): RunRecord[] { return this.getAllDailyRecords().filter((record) => record.localDateKey === localDateKey); }
}
