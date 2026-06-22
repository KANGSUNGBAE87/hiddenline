import { COURSE_LENGTHS, DIFFICULTIES, GAMEPLAY_DEFAULTS, OVERLAP_DIFFICULTIES } from "./config";
import { annotatePolyline, clamp, distance, polylineLength } from "./pathGeometry";
import { createRng, deriveSeed64 } from "./random";
import type {
  CourseLengthId,
  DailyContext,
  DifficultyId,
  GeneratedPath,
  GeneratorProfileId,
  LineDifficultyId,
  OverlapDifficultyId,
  Point,
  Viewport,
  VisibilityLevelId,
} from "./types";

type PathGenerationInput = Omit<DailyContext, "difficulty"> & {
  viewport: Viewport;
  lineType?: GeneratedPath["lineType"];
  courseLengthId?: CourseLengthId;
  overlapDifficultyId?: OverlapDifficultyId;
  generatorProfileId?: GeneratorProfileId;
  difficulty?: DifficultyId;
  lineDifficulty?: LineDifficultyId;
  visibilityLevel?: VisibilityLevelId;
  maxAttempts?: number;
};

function maxTurnAngle(points: Point[]): number {
  let maxAngle = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const first = { x: current.x - previous.x, y: current.y - previous.y };
    const second = { x: next.x - current.x, y: next.y - current.y };
    const firstLength = Math.hypot(first.x, first.y);
    const secondLength = Math.hypot(second.x, second.y);

    if (firstLength < 1 || secondLength < 1) continue;

    const dot = first.x * second.x + first.y * second.y;
    const ratio = clamp(dot / (firstLength * secondLength), -1, 1);
    maxAngle = Math.max(maxAngle, Math.acos(ratio));
  }

  return maxAngle;
}

function hasInteriorYClip(points: Point[], viewport: Viewport, margin: number): boolean {
  return points.some((point, index) => {
    const isEndpoint = index === 0 || index === points.length - 1;
    return !isEndpoint && (point.y <= margin + 0.01 || point.y >= viewport.height - margin - 0.01);
  });
}

function countSelfIntersections(points: Point[]): number {
  let count = 0;

  const orientation = (a: Point, b: Point, c: Point): number => (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  const intersects = (a: Point, b: Point, c: Point, d: Point): boolean => {
    const o1 = orientation(a, b, c);
    const o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a);
    const o4 = orientation(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
  };

  for (let first = 0; first < points.length - 1; first += 1) {
    for (let second = first + 2; second < points.length - 1; second += 1) {
      if (first === 0 && second === points.length - 2) continue;
      if (intersects(points[first], points[first + 1], points[second], points[second + 1])) count += 1;
    }
  }

  return count;
}

function minTurnRadius(points: Point[]): number {
  let minRadius = Number.POSITIVE_INFINITY;

  for (let index = 1; index < points.length - 1; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const c = points[index + 1];
    const ab = distance(a, b);
    const bc = distance(b, c);
    const ca = distance(c, a);
    if (ab < 0.8 || bc < 0.8) continue;

    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) minRadius = Math.min(minRadius, (ab * bc * ca) / (2 * doubleArea));
  }

  return minRadius;
}

type SafeEdge = "left" | "right" | "top" | "bottom";
type EndpointPair = { start: Point; end: Point; axis: "horizontal" | "vertical" };

function createBoundaryEndpointPair(rng: () => number, viewport: Viewport, margin: number): EndpointPair {
  const width = Math.max(1, viewport.width - margin * 2);
  const height = Math.max(1, viewport.height - margin * 2);
  const horizontal = rng() < 0.5;
  const startOnLowSide = rng() < 0.5;
  const startEdge: SafeEdge = horizontal
    ? startOnLowSide ? "left" : "right"
    : startOnLowSide ? "top" : "bottom";
  const endEdge: SafeEdge =
    startEdge === "left" ? "right" :
      startEdge === "right" ? "left" :
        startEdge === "top" ? "bottom" : "top";
  const pointOnEdge = (edge: SafeEdge): Point => {
    if (edge === "left" || edge === "right") {
      return {
        x: edge === "left" ? margin : viewport.width - margin,
        y: margin + height * (0.18 + rng() * 0.64),
      };
    }

    return {
      x: margin + width * (0.18 + rng() * 0.64),
      y: edge === "top" ? margin : viewport.height - margin,
    };
  };

  return { start: pointOnEdge(startEdge), end: pointOnEdge(endEdge), axis: horizontal ? "horizontal" : "vertical" };
}

function allInsideSafeBox(points: Point[], viewport: Viewport, margin: number): boolean {
  return points.every(
    (point) =>
      point.x >= margin &&
      point.x <= viewport.width - margin &&
      point.y >= margin &&
      point.y <= viewport.height - margin,
  );
}

const overlapByLineDifficulty: Record<LineDifficultyId, OverlapDifficultyId> = {
  easy: "normal",
  normal: "complex",
  hard: "hard",
};

const courseByLegacyLineType: Record<NonNullable<GeneratedPath["lineType"]>, CourseLengthId> = {
  warmup: "short",
  main: "basic",
  curve: "longRun",
  precision: "marathon",
};

function normalizedLength(points: Point[], viewport: Viewport): number {
  return polylineLength(points) / Math.max(1, Math.min(viewport.width, viewport.height));
}

const largeLoopFormulaCandidates: Record<
  OverlapDifficultyId,
  Array<{ loopFrequency: number; snakeMultiplier: number; loopAmplitude: number; loopSquash: number }>
> = {
  light: [
    { loopFrequency: 0, snakeMultiplier: 0.78, loopAmplitude: 0, loopSquash: 0 },
    { loopFrequency: 0, snakeMultiplier: 0.86, loopAmplitude: 0, loopSquash: 0 },
  ],
  normal: [
    { loopFrequency: 1, snakeMultiplier: 0.78, loopAmplitude: 0.17, loopSquash: 0.82 },
    { loopFrequency: 1.15, snakeMultiplier: 0.84, loopAmplitude: 0.18, loopSquash: 0.78 },
    { loopFrequency: 1.35, snakeMultiplier: 0.72, loopAmplitude: 0.16, loopSquash: 0.86 },
  ],
  complex: [
    { loopFrequency: 2.3, snakeMultiplier: 0.78, loopAmplitude: 0.17, loopSquash: 0.82 },
    { loopFrequency: 2.5, snakeMultiplier: 0.72, loopAmplitude: 0.18, loopSquash: 0.8 },
    { loopFrequency: 2.1, snakeMultiplier: 0.88, loopAmplitude: 0.16, loopSquash: 0.86 },
  ],
  hard: [
    { loopFrequency: 4, snakeMultiplier: 0.72, loopAmplitude: 0.24, loopSquash: 0.82 },
    { loopFrequency: 4.4, snakeMultiplier: 0.78, loopAmplitude: 0.25, loopSquash: 0.78 },
    { loopFrequency: 4.8, snakeMultiplier: 0.68, loopAmplitude: 0.22, loopSquash: 0.84 },
  ],
  master: [
    { loopFrequency: 4.8, snakeMultiplier: 0.72, loopAmplitude: 0.22, loopSquash: 0.82 },
    { loopFrequency: 5.2, snakeMultiplier: 0.68, loopAmplitude: 0.24, loopSquash: 0.78 },
    { loopFrequency: 5.6, snakeMultiplier: 0.64, loopAmplitude: 0.2, loopSquash: 0.86 },
  ],
};

function sampleLargeLoopBoundaryCurve(
  rng: () => number,
  viewport: Viewport,
  margin: number,
  sampleCount: number,
  endpoints: EndpointPair,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  attemptIndex: number,
): Point[] {
  const course = COURSE_LENGTHS[courseLengthId];
  const { start, end } = endpoints;
  const chord = Math.max(1, distance(start, end));
  const tangent = { x: (end.x - start.x) / chord, y: (end.y - start.y) / chord };
  const normal = { x: -tangent.y, y: tangent.x };
  const formulas = largeLoopFormulaCandidates[overlapDifficultyId];
  const formula = formulas[attemptIndex % formulas.length] ?? formulas[0];
  const minDimension = Math.min(viewport.width, viewport.height);
  const snakeFrequency = Math.max(0.95, course.targetNormalizedLength * formula.snakeMultiplier * (0.96 + rng() * 0.08));
  const snakePhase = (rng() - 0.5) * Math.PI * 0.34;
  const loopPhase = (rng() - 0.5) * Math.PI * 0.22;
  const snakeAmplitude = minDimension * (0.32 + rng() * 0.18);
  const loopAmplitude = minDimension * formula.loopAmplitude * (0.92 + rng() * 0.16);
  let best: { points: Point[]; delta: number } | null = null;
  let low = 0.16;
  let high = 1.42;

  const create = (scale: number): Point[] => Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const envelope = Math.sin(t * Math.PI);
    const snake = Math.sin(t * Math.PI * 2 * snakeFrequency + snakePhase) * snakeAmplitude * scale * envelope;
    const loopAngle = t * Math.PI * 2 * formula.loopFrequency + loopPhase;
    const loopLongitudinal = Math.cos(loopAngle) * loopAmplitude * scale * envelope;
    const loopLateral = Math.sin(loopAngle) * loopAmplitude * formula.loopSquash * scale * envelope;
    const along = chord * t + loopLongitudinal;
    const lateral = snake + loopLateral;

    return {
      x: start.x + tangent.x * along + normal.x * lateral,
      y: start.y + tangent.y * along + normal.y * lateral,
    };
  });

  for (let pass = 0; pass < 18; pass += 1) {
    const scale = (low + high) / 2;
    const points = create(scale);
    const inside = allInsideSafeBox(points, viewport, margin);
    const length = normalizedLength(points, viewport);
    const delta = Math.abs(length - course.targetNormalizedLength);

    if (inside && (!best || delta < best.delta)) best = { points, delta };
    if (!inside || length > course.targetNormalizedLength) high = scale;
    else low = scale;
  }

  return best?.points ?? create(0);
}

function createContinuousCurve(
  seed: string,
  viewport: Viewport,
  attemptIndex: number,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): Point[] {
  const rng = createRng(`${seed}:${attemptIndex}:continuous-v2`);
  const margin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
  const course = COURSE_LENGTHS[courseLengthId];
  const endpoints = createBoundaryEndpointPair(rng, viewport, margin);

  return sampleLargeLoopBoundaryCurve(
    rng,
    viewport,
    margin,
    course.sampleCount,
    endpoints,
    courseLengthId,
    overlapDifficultyId,
    attemptIndex,
  );
}

function createSampledCurve(
  seed: string,
  viewport: Viewport,
  attemptIndex: number,
  _generatorProfileId: GeneratorProfileId,
  _lineDifficulty: LineDifficultyId,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  _fallback = false,
): Point[] {
  return createContinuousCurve(seed, viewport, attemptIndex, courseLengthId, overlapDifficultyId);
}

function isValid(
  points: Point[],
  viewport: Viewport,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): boolean {
  const strictMargin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
  const start = points[0];
  const end = points[points.length - 1];
  const minDistance = Math.min(viewport.width, viewport.height) * 0.24;
  const course = COURSE_LENGTHS[courseLengthId];
  const overlap = OVERLAP_DIFFICULTIES[overlapDifficultyId];
  const selfIntersectionCount = countSelfIntersections(points);
  const length = normalizedLength(points, viewport);

  if (distance(start, end) < minDistance) return false;
  if (length < course.minNormalizedLength || length > course.maxNormalizedLength) return false;
  if (selfIntersectionCount < overlap.minSelfIntersections || selfIntersectionCount > overlap.maxSelfIntersections) return false;
  if (hasInteriorYClip(points, viewport, strictMargin)) return false;
  if (maxTurnAngle(points) >= 1.05) return false;
  if (minTurnRadius(points) < overlap.minTurnRadiusPx) return false;

  return points.every(
    (point) =>
      point.x >= strictMargin &&
      point.x <= viewport.width - strictMargin &&
      point.y >= strictMargin &&
      point.y <= viewport.height - strictMargin,
  );
}

function createFallback(
  seed: string,
  viewport: Viewport,
  generatorProfileId: GeneratorProfileId,
  lineDifficulty: LineDifficultyId,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): Point[] {
  const overlap = OVERLAP_DIFFICULTIES[overlapDifficultyId];
  const course = COURSE_LENGTHS[courseLengthId];
  const startIndex = Number(deriveSeed64(seed) % 11n);
  let best: { points: Point[]; score: number } | null = null;

  for (let offset = 0; offset < 96; offset += 1) {
    const points = createContinuousCurve(seed, viewport, startIndex + offset, courseLengthId, overlapDifficultyId);
    if (isValid(points, viewport, courseLengthId, overlapDifficultyId)) return points;

    const intersections = countSelfIntersections(points);
    const length = normalizedLength(points, viewport);
    const missingOverlap =
      intersections < overlap.minSelfIntersections
        ? overlap.minSelfIntersections - intersections
        : intersections > overlap.maxSelfIntersections
          ? intersections - overlap.maxSelfIntersections
          : 0;
    const lengthMiss =
      length < course.minNormalizedLength
        ? course.minNormalizedLength - length
        : length > course.maxNormalizedLength
          ? length - course.maxNormalizedLength
          : 0;
    const smoothMiss = Math.max(0, maxTurnAngle(points) - 1.05);
    const score = missingOverlap * 1000 + lengthMiss * 12 + smoothMiss * 24 + Math.abs(length - course.targetNormalizedLength);

    if (!best || score < best.score) best = { points, score };
  }

  return best?.points ?? createContinuousCurve(seed, viewport, startIndex, courseLengthId, overlapDifficultyId);
}

export function generatePath(input: PathGenerationInput): GeneratedPath {
  const maxAttempts = input.maxAttempts ?? GAMEPLAY_DEFAULTS.maxPathAttempts;
  const difficulty = input.difficulty ?? "normal";
  const lineDifficulty = input.lineDifficulty ?? (difficulty === "expert" ? "hard" : difficulty);
  const visibilityLevel = input.visibilityLevel ?? lineDifficulty;
  const rules = DIFFICULTIES[visibilityLevel];
  const generatorProfileId = input.generatorProfileId ?? "daily-main-normal-v1";
  const courseLengthId = input.courseLengthId ?? (input.lineType ? courseByLegacyLineType[input.lineType] : "basic");
  const overlapDifficultyId = input.overlapDifficultyId ?? overlapByLineDifficulty[lineDifficulty];
  let points: Point[] | null = null;
  let usedFallback = false;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createSampledCurve(input.seed, input.viewport, attempt, generatorProfileId, lineDifficulty, courseLengthId, overlapDifficultyId);
    if (isValid(candidate, input.viewport, courseLengthId, overlapDifficultyId)) {
      points = candidate;
      break;
    }
  }

  if (!points) {
    points = createFallback(input.seed, input.viewport, generatorProfileId, lineDifficulty, courseLengthId, overlapDifficultyId);
    usedFallback = true;
  }

  const annotated = annotatePolyline(points);
  const totalLength = annotated[annotated.length - 1]?.distance ?? 0;
  const complexityScore = totalLength / Math.max(1, Math.min(input.viewport.width, input.viewport.height));

  return {
    seed: input.seed,
    generatorVersion: input.generatorVersion,
    lineType: input.lineType,
    courseLengthId,
    overlapDifficultyId,
    selfIntersectionCount: countSelfIntersections(annotated),
    generatorProfileId,
    difficulty,
    lineDifficulty,
    visibilityLevel,
    complexityScore,
    viewport: input.viewport,
    start: annotated[0],
    end: annotated[annotated.length - 1],
    points: annotated,
    totalLength,
    usedFallback,
    rules: {
      pathWidthPx: rules.pathWidthPx,
      failDistancePx: rules.failDistancePx,
      revealRadiusPx: rules.revealRadiusPx,
      touchFocusRadiusPx: rules.touchFocusRadiusPx,
      forwardPreviewT: rules.forwardPreviewT,
      idleLimitMs: rules.idleLimitMs,
      warningIncreaseRatePerSecond: rules.warningIncreaseRatePerSecond,
      warningRecoverRatePerSecond: rules.warningRecoverRatePerSecond,
    },
  };
}
