import { describe, expect, test } from "vitest";
import { LocalStorageRepository } from "../../src/storage/localStorageRepository";
import type { RunRecord } from "../../src/storage/schema";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function record(overrides: Partial<RunRecord>): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "run-1",
    mode: "daily",
    localDateKey: "2026-06-13",
    timezoneOffset: -540,
    seed: "hiddenline-daily:2026-06-13:daily-v1",
    generatorVersion: "daily-v1",
    difficulty: "normal",
    completed: true,
    status: "success",
    score: 700,
    progressMax: 1,
    accuracy: 0.9,
    smoothness: 0.9,
    durationMs: 20_000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("localStorage repository", () => {
  test("completed run overwrites best only if score is higher", () => {
    const repository = new LocalStorageRepository(createMemoryStorage());
    repository.saveRun(record({ id: "low", score: 620 }));
    repository.saveRun(record({ id: "lower", score: 500 }));
    repository.saveRun(record({ id: "high", score: 840 }));

    expect(repository.getDailyBest("2026-06-13")?.id).toBe("high");
  });

  test("failed run does not overwrite best", () => {
    const repository = new LocalStorageRepository(createMemoryStorage());
    repository.saveRun(record({ id: "best", score: 720 }));
    repository.saveRun(
      record({
        id: "failed",
        completed: false,
        status: "failed",
        score: null,
        progressMax: 0.99,
        failReason: "off_path",
      }),
    );

    expect(repository.getDailyBest("2026-06-13")?.id).toBe("best");
  });

  test("localStorage parse fallback starts empty", () => {
    const storage = createMemoryStorage();
    storage.setItem("hiddenline.records.v1", "not json");
    const repository = new LocalStorageRepository(storage);

    expect(repository.getAllDailyRecords()).toEqual([]);
  });

  test("reads previous local daily best by date key", () => {
    const repository = new LocalStorageRepository(createMemoryStorage());
    repository.saveRun(record({ id: "yesterday", localDateKey: "2026-06-12", score: 650 }));
    repository.saveRun(record({ id: "today", localDateKey: "2026-06-13", score: 750 }));

    expect(repository.getPreviousDailyBest("2026-06-13")?.id).toBe("yesterday");
  });
});
