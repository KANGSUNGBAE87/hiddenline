import { describe, expect, test } from "vitest";
import { LocalStorageRepository, type StorageLike } from "../../src/storage/localStorageRepository";
import { RECORDS_STORAGE_KEY, type RunRecord } from "../../src/storage/schema";

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "record",
    mode: "daily",
    localDateKey: "2026-06-13",
    timezoneOffset: -540,
    dailyPackId: "2026-06-13:daily-pack-v1",
    lineType: "main",
    seed: "hiddenline-daily-pack:2026-06-13:main:daily-v1",
    generatorVersion: "daily-v1",
    generatorProfileId: "daily-main-normal-v1",
    scoringProfileId: "official-balanced-v2",
    difficulty: "normal",
    lineDifficulty: "normal",
    visibilityLevel: "normal",
    completed: true,
    status: "success",
    score: 820,
    progressMax: 1,
    accuracy: 0.92,
    smoothness: 0.87,
    durationMs: 31_000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("daily pack records", () => {
  test("main official best ignores warmup and curve records", () => {
    const storage = createStorage();
    const repository = new LocalStorageRepository(storage);
    repository.saveRun(createRecord({ id: "warmup", lineType: "warmup", score: 990, scoringProfileId: "practice-no-official-v1" }));
    repository.saveRun(createRecord({ id: "curve", lineType: "curve", score: 980, scoringProfileId: "curve-control-v1" }));
    repository.saveRun(createRecord({ id: "main", lineType: "main", score: 720 }));

    expect(repository.getDailyBest("2026-06-13")?.id).toBe("main");
    expect(repository.getDailyBest("2026-06-13", "warmup")?.id).toBe("warmup");
    expect(repository.getDailyBest("2026-06-13", "curve")?.id).toBe("curve");
  });

  test("daily pack records include only local daily pack lines", () => {
    const storage = createStorage();
    const repository = new LocalStorageRepository(storage);
    repository.saveRun(createRecord({ id: "main", lineType: "main" }));
    repository.saveRun(createRecord({ id: "precision", lineType: "precision", generatorProfileId: "precision-focus-v1", scoringProfileId: "precision-accuracy-v1" }));

    expect(repository.getDailyPackRecords("2026-06-13").map((record) => record.id)).toEqual(["main", "precision"]);
  });

  test("legacy daily records without lineType parse as main", () => {
    const storage = createStorage();
    const legacy = {
      schemaVersion: 1,
      records: [
        {
          schemaVersion: 1,
          id: "legacy-main",
          mode: "daily",
          localDateKey: "2026-06-12",
          timezoneOffset: -540,
          seed: "hiddenline-daily:2026-06-12:daily-v1",
          generatorVersion: "daily-v1",
          difficulty: "normal",
          completed: true,
          status: "success",
          score: 740,
          progressMax: 1,
          accuracy: 0.9,
          smoothness: 0.84,
          durationMs: 34_000,
          failReason: null,
          createdAt: "2026-06-12T00:00:00.000Z",
          updatedAt: "2026-06-12T00:00:00.000Z",
        },
      ],
    };
    storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(legacy));

    const repository = new LocalStorageRepository(storage);
    const [record] = repository.getAllDailyRecords();

    expect(record.lineType).toBe("main");
    expect(record.dailyPackId).toBe("2026-06-12:daily-pack-v1");
    expect(record.difficulty).toBe("normal");
    expect(record.lineDifficulty).toBe("normal");
    expect(record.visibilityLevel).toBe("normal");
    expect(repository.getDailyBest("2026-06-12")?.id).toBe("legacy-main");
  });

  test("corrupted enum fields are normalized to safe defaults", () => {
    const storage = createStorage();
    storage.setItem(
      RECORDS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        records: [
          createRecord({
            lineType: "bad-line" as RunRecord["lineType"],
            difficulty: "bad-difficulty" as RunRecord["difficulty"],
            lineDifficulty: "bad-line-difficulty" as RunRecord["lineDifficulty"],
            visibilityLevel: "bad-visibility" as RunRecord["visibilityLevel"],
            generatorProfileId: "bad-profile" as RunRecord["generatorProfileId"],
            scoringProfileId: "bad-score" as RunRecord["scoringProfileId"],
          }),
        ],
      }),
    );

    const [record] = new LocalStorageRepository(storage).getAllDailyRecords();
    expect(record.lineType).toBe("main");
    expect(record.difficulty).toBe("normal");
    expect(record.lineDifficulty).toBe("normal");
    expect(record.visibilityLevel).toBe("normal");
    expect(record.generatorProfileId).toBe("daily-main-normal-v1");
    expect(record.scoringProfileId).toBe("official-balanced-v2");
  });
});
