import type {
  DailyContext,
  DailyLineContext,
  DailyPackContext,
  CourseLengthId,
  GeneratorProfileId,
  LineDifficultyId,
  LineType,
  OverlapDifficultyId,
  ScoringProfileId,
  VisibilityLevelId,
} from "./types";

export const lineTypesForDailyPackV1 = ["warmup", "main", "curve", "precision"] as const satisfies readonly LineType[];
export const lineDifficultyLevelsForDailyPackV1 = ["easy", "normal", "hard"] as const satisfies readonly LineDifficultyId[];
export const courseLengthIdsForDailyV2 = ["short", "basic", "long", "longRun", "marathon"] as const satisfies readonly CourseLengthId[];
export const overlapDifficultyIdsForDailyV2 = ["light", "normal", "complex", "hard", "master"] as const satisfies readonly OverlapDifficultyId[];

type LineDefinition = {
  generatorProfileId: GeneratorProfileId;
  scoringProfileId: ScoringProfileId;
  official: boolean;
  displayNameKey: string;
  descriptionKey: string;
  badgeKey: string;
};

const legacyCourseByLineType: Record<LineType, CourseLengthId> = {
  warmup: "short",
  main: "basic",
  curve: "longRun",
  precision: "marathon",
};

const legacyOverlapByLineDifficulty: Record<LineDifficultyId, OverlapDifficultyId> = {
  easy: "normal",
  normal: "complex",
  hard: "hard",
};

const lineDifficultyByOverlap: Record<OverlapDifficultyId, LineDifficultyId> = {
  light: "easy",
  normal: "easy",
  complex: "normal",
  hard: "hard",
  master: "hard",
};

export const DAILY_LINE_DEFINITIONS: Record<(typeof lineTypesForDailyPackV1)[number], LineDefinition> = {
  warmup: {
    generatorProfileId: "gentle-warmup-v1",
    scoringProfileId: "practice-no-official-v1",
    official: false,
    displayNameKey: "line.warmup.name",
    descriptionKey: "line.warmup.description",
    badgeKey: "line.warmup.badge",
  },
  main: {
    generatorProfileId: "daily-main-normal-v1",
    scoringProfileId: "official-balanced-v2",
    official: true,
    displayNameKey: "line.main.name",
    descriptionKey: "line.main.description",
    badgeKey: "line.main.badge",
  },
  curve: {
    generatorProfileId: "curve-control-v1",
    scoringProfileId: "curve-control-v1",
    official: false,
    displayNameKey: "line.curve.name",
    descriptionKey: "line.curve.description",
    badgeKey: "line.curve.badge",
  },
  precision: {
    generatorProfileId: "precision-focus-v1",
    scoringProfileId: "precision-accuracy-v1",
    official: false,
    displayNameKey: "line.precision.name",
    descriptionKey: "line.precision.description",
    badgeKey: "line.precision.badge",
  },
};

export function createDailyPackContext(daily: DailyContext): DailyPackContext {
  const dailyPackId = `${daily.localDateKey}:daily-pack-v1`;
  const lines = lineTypesForDailyPackV1.flatMap((lineType) => {
    const definition = DAILY_LINE_DEFINITIONS[lineType];

    return lineDifficultyLevelsForDailyPackV1.map((lineDifficulty): DailyLineContext => ({
      ...daily,
      dailyPackId,
      lineType,
      courseLengthId: legacyCourseByLineType[lineType],
      overlapDifficultyId: legacyOverlapByLineDifficulty[lineDifficulty],
      seed: `hiddenline-daily-pack:${daily.localDateKey}:${lineType}:${lineDifficulty}:${daily.generatorVersion}`,
      generatorProfileId: definition.generatorProfileId,
      scoringProfileId: definition.scoringProfileId,
      difficulty: lineDifficulty,
      lineDifficulty,
      visibilityLevel: "normal",
      official: definition.official,
      displayNameKey: definition.displayNameKey,
      descriptionKey: definition.descriptionKey,
      badgeKey: definition.badgeKey,
    }));
  });

  return {
    localDateKey: daily.localDateKey,
    timezoneOffset: daily.timezoneOffset,
    dailyPackId,
    generatorVersion: daily.generatorVersion,
    lines,
  };
}

export function getDailyCourseContext(
  pack: DailyPackContext,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId = "complex",
  visibilityLevel: VisibilityLevelId = "normal",
): DailyLineContext {
  const lineDifficulty = lineDifficultyByOverlap[overlapDifficultyId];

  return {
    localDateKey: pack.localDateKey,
    timezoneOffset: pack.timezoneOffset,
    dailyPackId: pack.dailyPackId,
    lineType: "main",
    courseLengthId,
    overlapDifficultyId,
    seed: `hiddenline-daily-v2:${pack.localDateKey}:${courseLengthId}:${overlapDifficultyId}:${visibilityLevel}:${pack.generatorVersion}`,
    generatorVersion: pack.generatorVersion,
    generatorProfileId: "daily-main-normal-v1",
    scoringProfileId: "official-balanced-v2",
    difficulty: lineDifficulty,
    lineDifficulty,
    visibilityLevel,
    official: true,
    displayNameKey: "line.main.name",
    descriptionKey: "line.main.description",
    badgeKey: "line.main.badge",
  };
}

export function getDailyLineContext(
  pack: DailyPackContext,
  lineType: LineType,
  lineDifficulty: LineDifficultyId = "normal",
  visibilityLevel: DailyLineContext["visibilityLevel"] = "normal",
): DailyLineContext {
  const line =
    pack.lines.find((candidate) => candidate.lineType === lineType && candidate.lineDifficulty === lineDifficulty) ??
    pack.lines.find((candidate) => candidate.lineType === lineType && candidate.lineDifficulty === "normal") ??
    pack.lines.find((candidate) => candidate.lineType === "main" && candidate.lineDifficulty === "normal") ??
    pack.lines[0];

  return {
    ...line,
    visibilityLevel,
  };
}
