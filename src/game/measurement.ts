import { clamp } from "./pathGeometry";
import type { MeasurementBreakdown, RunMetrics } from "./types";

function measurement(value: number, weight: number, explanationKey: string) {
  const normalized = clamp(value, 0, 1);
  return {
    value: normalized,
    displayPercent: Math.round(normalized * 100),
    weight,
    explanationKey,
  };
}

export function createMeasurementBreakdown(metrics: RunMetrics, progressMax: number, targetDurationMs?: number): MeasurementBreakdown {
  const calmness = 1 - Math.min(1, (metrics.warningPeak + metrics.warningCount * 8) / 100);
  const durationMs = metrics.durationMs ?? targetDurationMs ?? 30_000;
  const paceTarget = targetDurationMs ?? 34_000;
  const pace = 1 - Math.min(1, Math.abs(durationMs - paceTarget) / paceTarget);

  return {
    accuracy: measurement(metrics.accuracy, 0.4, "measurement.accuracy.explanation"),
    smoothness: measurement(metrics.smoothness, 0.2, "measurement.smoothness.explanation"),
    calmness: measurement(calmness, 0.15, "measurement.calmness.explanation"),
    completion: measurement(progressMax, 0.15, "measurement.completion.explanation"),
    pace: measurement(pace, 0.1, "measurement.pace.explanation"),
  };
}

export function scoreFromMeasurement(breakdown: MeasurementBreakdown, scoreMax: number): number {
  const weighted =
    breakdown.accuracy.value * 0.4 +
    breakdown.smoothness.value * 0.2 +
    breakdown.calmness.value * 0.15 +
    breakdown.completion.value * 0.15 +
    breakdown.pace.value * 0.1;

  return Math.round(clamp(weighted, 0, 1) * scoreMax);
}
