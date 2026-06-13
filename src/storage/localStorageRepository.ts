import { RECORDS_STORAGE_KEY, type PersistedRecords, type RunRecord } from "./schema";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function parseRecords(raw: string | null): RunRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PersistedRecords;
    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
      return [];
    }
    return parsed.records.filter((record) => record?.schemaVersion === 1 && record.mode === "daily");
  } catch {
    return [];
  }
}

function isBestCandidate(record: RunRecord): boolean {
  return record.completed && record.status === "success" && typeof record.score === "number";
}

export class LocalStorageRepository {
  private readonly storage: StorageLike;

  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  getAllDailyRecords(): RunRecord[] {
    return parseRecords(this.storage.getItem(RECORDS_STORAGE_KEY));
  }

  saveRun(record: RunRecord): void {
    const records = this.getAllDailyRecords();
    const existingIndex = records.findIndex((item) => item.id === record.id);

    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    this.storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records } satisfies PersistedRecords));
  }

  getDailyBest(localDateKey: string): RunRecord | null {
    const candidates = this.getAllDailyRecords().filter(
      (record) => record.localDateKey === localDateKey && isBestCandidate(record),
    );

    return candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
  }

  getPreviousDailyBest(localDateKey: string): RunRecord | null {
    const previousCandidates = this.getAllDailyRecords().filter(
      (record) => record.localDateKey < localDateKey && isBestCandidate(record),
    );

    return previousCandidates.sort((a, b) => b.localDateKey.localeCompare(a.localDateKey) || (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
  }
}
