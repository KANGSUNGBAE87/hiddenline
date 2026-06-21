import { GAMEPLAY_DEFAULTS } from "./config";
import { createMeasurementBreakdown, scoreFromMeasurement } from "./measurement";
import { clamp } from "./pathGeometry";

export type ScoreInput = {
  accuracy: number;
  smoothness: number;
  durationMs: number;
  targetDurationMs: number;
  warningPenalty?: number;
  warningPeak?: number;
  warningCount?: number;
  progressMax?: number;
};

export type OfficialScoreInput = ScoreInput & {
  completed: boolean;
};

export function calculateScore(input: ScoreInput): number {
  const warningPeak = input.warningPeak ?? clamp(input.warningPenalty ?? 0, 0, GAMEPLAY_DEFAULTS.warningMeterMax);
  const breakdown = createMeasurementBreakdown(
    {
      accuracy: input.accuracy,
      smoothness: input.smoothness,
      durationMs: input.durationMs,
      warningPeak,
      warningCount: input.warningCount ?? 0,
    },
    input.progressMax ?? 1,
    input.targetDurationMs,
  );

  return scoreFromMeasurement(breakdown, GAMEPLAY_DEFAULTS.scoreMax);
}

export function calculateOfficialScore(input: OfficialScoreInput): number | null {
  if (!input.completed) return null;
  return calculateScore(input);
}
