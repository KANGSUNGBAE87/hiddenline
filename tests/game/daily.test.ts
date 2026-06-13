import { describe, expect, test } from "vitest";
import { createDailyContext } from "../../src/game/daily";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";

describe("daily context", () => {
  test("same local date and generatorVersion produce the same daily seed", () => {
    const first = createDailyContext(new Date(2026, 5, 13, 8, 0, 0));
    const second = createDailyContext(new Date(2026, 5, 13, 22, 0, 0));

    expect(first.localDateKey).toBe("2026-06-13");
    expect(second.localDateKey).toBe("2026-06-13");
    expect(first.seed).toBe(second.seed);
    expect(first.generatorVersion).toBe(GAMEPLAY_DEFAULTS.generatorVersion);
  });

  test("different local dates produce different seed", () => {
    const today = createDailyContext(new Date(2026, 5, 13));
    const tomorrow = createDailyContext(new Date(2026, 5, 14));

    expect(today.seed).not.toBe(tomorrow.seed);
  });

  test("daily difficulty is normal", () => {
    expect(createDailyContext(new Date(2026, 5, 13)).difficulty).toBe("normal");
  });
});
