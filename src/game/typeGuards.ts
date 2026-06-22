import type {
  CourseLengthId,
  DifficultyId,
  GeneratorProfileId,
  GeneratorVersion,
  LineDifficultyId,
  LineType,
  OverlapDifficultyId,
  ScoringProfileId,
  VisibilityLevelId,
} from "./types";

const lineTypes = ["warmup", "main", "curve", "precision"] as const;
const courseLengths = ["short", "basic", "long", "longRun", "marathon"] as const;
const overlapDifficulties = ["light", "normal", "complex", "hard", "master"] as const;
const generatorVersions = ["daily-v1", "analytic-v2"] as const;
const generatorProfiles = ["gentle-warmup-v1", "daily-main-normal-v1", "curve-control-v1", "precision-focus-v1"] as const;
const scoringProfiles = ["practice-no-official-v1", "official-balanced-v2", "curve-control-v1", "precision-accuracy-v1"] as const;
const lineDifficulties = ["easy", "normal", "hard"] as const;
const visibilityLevels = ["easy", "normal", "hard"] as const;
const difficulties = ["easy", "normal", "hard", "expert"] as const;

function oneOf<TValue extends string>(values: readonly TValue[], value: unknown): value is TValue {
  return typeof value === "string" && values.includes(value as TValue);
}

export function isLineType(value: unknown): value is LineType {
  return oneOf(lineTypes, value);
}

export function isCourseLengthId(value: unknown): value is CourseLengthId {
  return oneOf(courseLengths, value);
}

export function isOverlapDifficultyId(value: unknown): value is OverlapDifficultyId {
  return oneOf(overlapDifficulties, value);
}

export function isGeneratorVersion(value: unknown): value is GeneratorVersion {
  return oneOf(generatorVersions, value);
}

export function isGeneratorProfileId(value: unknown): value is GeneratorProfileId {
  return oneOf(generatorProfiles, value);
}

export function isScoringProfileId(value: unknown): value is ScoringProfileId {
  return oneOf(scoringProfiles, value);
}

export function isDifficultyId(value: unknown): value is DifficultyId {
  return oneOf(difficulties, value);
}

export function isLineDifficultyId(value: unknown): value is LineDifficultyId {
  return oneOf(lineDifficulties, value);
}

export function isVisibilityLevelId(value: unknown): value is VisibilityLevelId {
  return oneOf(visibilityLevels, value);
}
