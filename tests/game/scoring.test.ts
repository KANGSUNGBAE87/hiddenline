import { describe, expect, test } from "vitest";
import { calculateScore, calculateOfficialScore } from "../../src/game/scoring";

describe("scoring", () => {
  test("score clamps 0-1000", () => {
    expect(calculateScore({ accuracy: 2, smoothness: 2, durationMs: 100, targetDurationMs: 1000 })).toBe(1000);
    expect(calculateScore({ accuracy: -1, smoothness: -1, durationMs: 1_000_000, targetDurationMs: 100 })).toBe(0);
  });

  test("failed run returns no official score", () => {
    expect(
      calculateOfficialScore({
        completed: false,
        accuracy: 1,
        smoothness: 1,
        durationMs: 1000,
        targetDurationMs: 1000,
      }),
    ).toBeNull();
  });

  test("low accuracy reduces score more than slow time", () => {
    const lowAccuracy = calculateScore({ accuracy: 0.5, smoothness: 1, durationMs: 1000, targetDurationMs: 1000 });
    const slow = calculateScore({ accuracy: 1, smoothness: 1, durationMs: 2000, targetDurationMs: 1000 });

    expect(lowAccuracy).toBeLessThan(slow);
  });

  test("warning penalty lowers a completed score", () => {
    const clean = calculateScore({ accuracy: 0.9, smoothness: 0.9, durationMs: 1000, targetDurationMs: 1000 });
    const warned = calculateScore({
      accuracy: 0.9,
      smoothness: 0.9,
      durationMs: 1000,
      targetDurationMs: 1000,
      warningPenalty: 120,
    });

    expect(warned).toBeLessThan(clean);
  });
});
