import { GAMEPLAY_DEFAULTS } from "./config";
import { clamp } from "./pathGeometry";

export type ScoreInput = {
  accuracy: number;
  smoothness: number;
  durationMs: number;
  targetDurationMs: number;
  warningPenalty?: number;
};

export type OfficialScoreInput = ScoreInput & {
  completed: boolean;
};

export function calculateScore(input: ScoreInput): number {
  const accuracy = clamp(input.accuracy, 0, 1);
  const smoothness = clamp(input.smoothness, 0, 1);
  const timeScore = clamp(input.targetDurationMs / Math.max(1, input.durationMs), 0, 1);
  const warningPenalty = Math.max(0, input.warningPenalty ?? 0);
  const raw =
    GAMEPLAY_DEFAULTS.scoreMax * (accuracy * 0.6 + smoothness * 0.25 + timeScore * 0.15) - warningPenalty;

  return Math.round(clamp(raw, 0, GAMEPLAY_DEFAULTS.scoreMax));
}

export function calculateOfficialScore(input: OfficialScoreInput): number | null {
  if (!input.completed) return null;
  return calculateScore(input);
}
