import type { FailReason, GeneratorVersion } from "../game/types";

export type RunRecord = {
  schemaVersion: 1;
  id: string;
  mode: "daily";
  localDateKey: string;
  timezoneOffset: number;
  seed: string;
  generatorVersion: GeneratorVersion;
  difficulty: "normal";
  completed: boolean;
  status: "success" | "failed";
  score: number | null;
  progressMax: number;
  accuracy: number;
  smoothness: number;
  durationMs: number | null;
  failReason: FailReason | null;
  createdAt: string;
  updatedAt: string;
};

export type PersistedRecords = {
  schemaVersion: 1;
  records: RunRecord[];
};

export const RECORDS_STORAGE_KEY = "hiddenline.records.v1";
