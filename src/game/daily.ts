import { GAMEPLAY_DEFAULTS } from "./config";
import type { DailyContext } from "./types";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function createDailyContext(date = new Date()): DailyContext {
  const localDateKey = getLocalDateKey(date);

  return {
    localDateKey,
    timezoneOffset: date.getTimezoneOffset(),
    seed: `${GAMEPLAY_DEFAULTS.seedNamespace}:${localDateKey}:${GAMEPLAY_DEFAULTS.generatorVersion}`,
    generatorVersion: GAMEPLAY_DEFAULTS.generatorVersion,
    difficulty: GAMEPLAY_DEFAULTS.officialDailyDifficulty,
  };
}
