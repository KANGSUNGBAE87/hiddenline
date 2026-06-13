import { GAMEPLAY_DEFAULTS } from "./config";
import { annotatePolyline, clamp, distance, hasSelfIntersection, lerp, polylineLength } from "./pathGeometry";
import { createRng, stableHash } from "./random";
import type { DailyContext, DifficultyId, GeneratedPath, Point, Viewport } from "./types";

type PathGenerationInput = DailyContext & {
  viewport: Viewport;
  difficulty?: DifficultyId;
  maxAttempts?: number;
};

function createSampledCurve(seed: string, viewport: Viewport, attemptIndex: number, fallback = false): Point[] {
  const rng = createRng(`${seed}:${attemptIndex}:${fallback ? "fallback" : "candidate"}`);
  const margin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
  const width = Math.max(1, viewport.width - margin * 2);
  const height = Math.max(1, viewport.height - margin * 2);
  const sampleCount = 128;

  const start: Point = {
    x: margin,
    y: margin + rng() * height,
  };
  const end: Point = {
    x: viewport.width - margin,
    y: margin + rng() * height,
  };
  const phase = rng() * Math.PI * 2;
  const amplitude = fallback ? height * 0.2 : height * (0.12 + rng() * 0.18);
  const secondaryAmplitude = amplitude * (fallback ? 0.18 : 0.34);
  const bend = rng() > 0.5 ? 1 : -1;

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const x = lerp(start.x, end.x, t);
    const baseY = lerp(start.y, end.y, t);
    const wave =
      Math.sin(t * Math.PI * 2 + phase) * amplitude * bend +
      Math.sin(t * Math.PI * 4 + phase * 0.6) * secondaryAmplitude;
    const edgeEase = Math.sin(t * Math.PI);

    return {
      x,
      y: clamp(baseY + wave * edgeEase, margin, viewport.height - margin),
    };
  });
}

function isValid(points: Point[], viewport: Viewport): boolean {
  const strictMargin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
  const start = points[0];
  const end = points[points.length - 1];
  const minDistance = Math.min(viewport.width, viewport.height) * 0.45;

  if (distance(start, end) < minDistance) return false;
  if (polylineLength(points) <= minDistance) return false;
  if (hasSelfIntersection(points)) return false;

  return points.every(
    (point) =>
      point.x >= strictMargin &&
      point.x <= viewport.width - strictMargin &&
      point.y >= strictMargin &&
      point.y <= viewport.height - strictMargin,
  );
}

function createFallback(seed: string, viewport: Viewport): Point[] {
  const presetIndex = stableHash(seed) % 3;
  return createSampledCurve(seed, viewport, presetIndex, true);
}

export function generatePath(input: PathGenerationInput): GeneratedPath {
  const maxAttempts = input.maxAttempts ?? GAMEPLAY_DEFAULTS.maxPathAttempts;
  const difficulty = input.difficulty ?? "normal";
  let points: Point[] | null = null;
  let usedFallback = false;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createSampledCurve(input.seed, input.viewport, attempt);
    if (isValid(candidate, input.viewport)) {
      points = candidate;
      break;
    }
  }

  if (!points) {
    points = createFallback(input.seed, input.viewport);
    usedFallback = true;
  }

  const annotated = annotatePolyline(points);

  return {
    seed: input.seed,
    generatorVersion: input.generatorVersion,
    difficulty,
    viewport: input.viewport,
    start: annotated[0],
    end: annotated[annotated.length - 1],
    points: annotated,
    totalLength: annotated[annotated.length - 1]?.distance ?? 0,
    usedFallback,
  };
}
