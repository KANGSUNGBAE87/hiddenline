import { describe, expect, test } from "vitest";
import { createDailyContext } from "../../src/game/daily";
import {
  createDailyPackContext,
  getDailyLineContext,
  lineDifficultyLevelsForDailyPackV1,
  lineTypesForDailyPackV1,
} from "../../src/game/dailyPack";

describe("daily pack context", () => {
  test("creates deterministic 4 line families by 3 line difficulties for the same local date", () => {
    const daily = createDailyContext(new Date("2026-06-13T12:00:00+09:00"));
    const first = createDailyPackContext(daily);
    const second = createDailyPackContext(daily);

    expect(first.dailyPackId).toBe("2026-06-13:daily-pack-v1");
    expect(lineDifficultyLevelsForDailyPackV1).toEqual(["easy", "normal", "hard"]);
    expect(first.lines).toHaveLength(lineTypesForDailyPackV1.length * lineDifficultyLevelsForDailyPackV1.length);
    expect(first.lines.map((line) => `${line.lineType}:${line.lineDifficulty}`)).toEqual([
      "warmup:easy",
      "warmup:normal",
      "warmup:hard",
      "main:easy",
      "main:normal",
      "main:hard",
      "curve:easy",
      "curve:normal",
      "curve:hard",
      "precision:easy",
      "precision:normal",
      "precision:hard",
    ]);
    expect(first).toEqual(second);
  });

  test("keeps main as the only official daily line", () => {
    const pack = createDailyPackContext(createDailyContext(new Date("2026-06-13T12:00:00+09:00")));

    expect(getDailyLineContext(pack, "warmup", "normal").official).toBe(false);
    expect(getDailyLineContext(pack, "main", "normal").official).toBe(true);
    expect(getDailyLineContext(pack, "curve", "normal").official).toBe(false);
    expect(getDailyLineContext(pack, "precision", "normal").official).toBe(false);
  });

  test("uses different seeds, profiles, line difficulties, and sight levels per local line variant", () => {
    const pack = createDailyPackContext(createDailyContext(new Date("2026-06-13T12:00:00+09:00")));
    const warmup = getDailyLineContext(pack, "warmup", "hard", "easy");
    const main = getDailyLineContext(pack, "main", "normal", "hard");
    const curve = getDailyLineContext(pack, "curve", "easy", "normal");
    const precision = getDailyLineContext(pack, "precision", "hard", "hard");

    expect(new Set(pack.lines.map((line) => line.seed)).size).toBe(12);
    expect(pack.lines.every((line) => line.seed.includes(`:${line.lineType}:${line.lineDifficulty}:`))).toBe(true);
    expect(warmup.generatorProfileId).toBe("gentle-warmup-v1");
    expect(main.generatorProfileId).toBe("daily-main-normal-v1");
    expect(curve.generatorProfileId).toBe("curve-control-v1");
    expect(precision.generatorProfileId).toBe("precision-focus-v1");
    expect(warmup.scoringProfileId).toBe("practice-no-official-v1");
    expect(main.scoringProfileId).toBe("official-balanced-v2");
    expect(curve.scoringProfileId).toBe("curve-control-v1");
    expect(precision.scoringProfileId).toBe("precision-accuracy-v1");
    expect(warmup.difficulty).toBe("hard");
    expect(warmup.lineDifficulty).toBe("hard");
    expect(warmup.visibilityLevel).toBe("easy");
    expect(main.difficulty).toBe("normal");
    expect(main.lineDifficulty).toBe("normal");
    expect(main.visibilityLevel).toBe("hard");
    expect(curve.difficulty).toBe("easy");
    expect(curve.lineDifficulty).toBe("easy");
    expect(curve.visibilityLevel).toBe("normal");
    expect(precision.difficulty).toBe("hard");
    expect(precision.lineDifficulty).toBe("hard");
    expect(precision.visibilityLevel).toBe("hard");
  });
});
