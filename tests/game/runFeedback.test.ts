import { describe, expect, test } from "vitest";
import { deriveRunFeedback } from "../../src/game/runFeedback";
import type { RunRecord } from "../../src/storage/schema";

function createRecord(overrides: Partial<RunRecord>): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "run-1",
    mode: "daily",
    localDateKey: "2026-06-13",
    timezoneOffset: -540,
    dailyPackId: "2026-06-13:daily-pack-v1",
    lineType: "main",
    seed: "hiddenline-daily:2026-06-13:daily-v1",
    generatorVersion: "daily-v1",
    generatorProfileId: "daily-main-normal-v1",
    scoringProfileId: "official-balanced-v2",
    difficulty: "normal",
    lineDifficulty: "normal",
    visibilityLevel: "normal",
    completed: false,
    status: "failed",
    score: null,
    progressMax: 0.42,
    accuracy: 0.62,
    smoothness: 0.7,
    durationMs: 14_000,
    failReason: "off_path",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("deriveRunFeedback", () => {
  test("turns an off-path failed run into one gentle curve coaching point", () => {
    const feedback = deriveRunFeedback(createRecord({ failReason: "off_path", progressMax: 0.68 }));

    expect(feedback.tone).toBe("learning");
    expect(feedback.title).toBe("feedback.learningTitle");
    expect(feedback.coachingLine).toBe("feedback.offPathCoaching");
    expect(feedback.chips).toEqual(["feedback.chipSlowCurve"]);
  });

  test("praises smooth completed runs before generic success", () => {
    const feedback = deriveRunFeedback(
      createRecord({
        completed: true,
        status: "success",
        score: 812,
        progressMax: 1,
        accuracy: 0.88,
        smoothness: 0.92,
        failReason: null,
      }),
    );

    expect(feedback.tone).toBe("success");
    expect(feedback.title).toBe("feedback.successTitle");
    expect(feedback.coachingLine).toBe("feedback.smoothSuccessCoaching");
    expect(feedback.chips).toEqual(["feedback.chipSmooth"]);
  });

  test("highlights a new best when score beats the previous best", () => {
    const previous = createRecord({
      id: "previous",
      completed: true,
      status: "success",
      score: 700,
      progressMax: 1,
      failReason: null,
    });
    const feedback = deriveRunFeedback(
      createRecord({
        id: "today",
        completed: true,
        status: "success",
        score: 742,
        progressMax: 1,
        accuracy: 0.9,
        smoothness: 0.86,
        failReason: null,
      }),
      previous,
    );

    expect(feedback.coachingLine).toBe("feedback.newBestCoaching");
    expect(feedback.chips).toEqual(["feedback.chipNewBest"]);
  });
});
