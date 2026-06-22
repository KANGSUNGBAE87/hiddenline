import { COURSE_LENGTHS, DIFFICULTIES, GAMEPLAY_DEFAULTS, OVERLAP_DIFFICULTIES } from "./config";
import { clamp, distance } from "./pathGeometry";
import { createRng, deriveSeed64 } from "./random";
import type {
  AnalyticCurveDefinition,
  CourseLengthId,
  DailyContext,
  DifficultyId,
  GeneratedPath,
  GeneratorProfileId,
  LineDifficultyId,
  OverlapDifficultyId,
  PathPoint,
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

type SafeEdge = "left" | "right" | "top" | "bottom";
type EndpointPair = { start: Point; end: Point; axis: "horizontal" | "vertical" };
type RawCurvePoint = Point & { u: number; distance: number };
type AnalyticCandidate = {
  curve: AnalyticCurveDefinition;
  points: PathPoint[];
  totalLength: number;
  selfIntersectionCount: number;
  usedFallback: boolean;
};
type CurveBasis = Pick<
  AnalyticCurveDefinition,
  "coefficients" | "phases" | "frequencyScale" | "minTurnRadiusPx" | "sampleSpacingPx" | "sourceSampleCount"
>;

const TWO_PI = Math.PI * 2;
const SAMPLE_SPACING_PX = 0.5;
const MIN_SAMPLE_COUNT = 128;
const MAX_SAMPLE_COUNT = 5000;
const MAX_TURN_ANGLE_RAD = 0.58;

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

const courseFrequencyBase: Record<CourseLengthId, number> = {
  short: 1.05,
  basic: 1.42,
  long: 1.95,
  longRun: 2.55,
  marathon: 3.35,
};

const complexityProfiles: Record<
  OverlapDifficultyId,
  { harmonicCount: number; frequencyBonus: number; amplitudeMultiplier: number }
> = {
  light: { harmonicCount: 2, frequencyBonus: -0.16, amplitudeMultiplier: 0.86 },
  normal: { harmonicCount: 3, frequencyBonus: 0, amplitudeMultiplier: 0.96 },
  complex: { harmonicCount: 3, frequencyBonus: 0.26, amplitudeMultiplier: 1.05 },
  hard: { harmonicCount: 4, frequencyBonus: 0.48, amplitudeMultiplier: 1.14 },
  master: { harmonicCount: 5, frequencyBonus: 0.7, amplitudeMultiplier: 1.22 },
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

    if (firstLength < 0.5 || secondLength < 0.5) continue;

    const dot = first.x * second.x + first.y * second.y;
    const ratio = clamp(dot / (firstLength * secondLength), -1, 1);
    maxAngle = Math.max(maxAngle, Math.acos(ratio));
  }

  return maxAngle;
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
    if (ab < 0.5 || bc < 0.5) continue;

    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) minRadius = Math.min(minRadius, (ab * bc * ca) / (2 * doubleArea));
  }

  return minRadius;
}

function safeMargin(viewport: Viewport): number {
  return Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
}

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
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= margin &&
      point.x <= viewport.width - margin &&
      point.y >= margin &&
      point.y <= viewport.height - margin,
  );
}

function normalizeCoefficients(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.abs(value), 0);
  if (total < 0.001) return values.map((_, index) => (index === 0 ? 1 : 0));
  return values.map((value) => value / total);
}

function createCoefficients(rng: () => number, harmonicCount: number): number[] {
  const values = Array.from({ length: harmonicCount }, (_, index) => {
    const decay = 1 / Math.pow(index + 1, 0.52);
    return (rng() * 2 - 1) * decay;
  });

  if (values.every((value) => Math.abs(value) < 0.08)) {
    values[0] = 0.72;
    if (values.length > 1) values[1] = -0.28;
  }

  return normalizeCoefficients(values);
}

function createPhases(rng: () => number, harmonicCount: number): number[] {
  return Array.from({ length: harmonicCount }, () => rng() * TWO_PI);
}

function evaluateCurve(curve: AnalyticCurveDefinition, u: number): Point {
  const clampedU = clamp(u, 0, 1);
  const dx = curve.end.x - curve.start.x;
  const dy = curve.end.y - curve.start.y;
  const chord = Math.max(1, Math.hypot(dx, dy));
  const tangent = { x: dx / chord, y: dy / chord };
  const normal = { x: -tangent.y, y: tangent.x };
  const envelope = Math.sin(Math.PI * clampedU) ** 2;
  const wave = curve.coefficients.reduce((sum, coefficient, index) => {
    const harmonic = index + 1;
    return sum + coefficient * Math.sin(TWO_PI * harmonic * curve.frequencyScale * clampedU + curve.phases[index]);
  }, 0);
  const lateral = curve.amplitudePx * envelope * wave;
  const along = chord * clampedU;

  return {
    x: curve.start.x + tangent.x * along + normal.x * lateral,
    y: curve.start.y + tangent.y * along + normal.y * lateral,
  };
}

function sampleRawCurve(curve: AnalyticCurveDefinition): RawCurvePoint[] {
  const count = Math.max(2, curve.sourceSampleCount);
  const raw: RawCurvePoint[] = [];
  let traveled = 0;

  for (let index = 0; index < count; index += 1) {
    const u = index / (count - 1);
    const point = evaluateCurve(curve, u);
    if (index > 0) traveled += distance(raw[index - 1], point);
    raw.push({ ...point, u, distance: traveled });
  }

  return raw;
}

function interpolateRawPoint(start: RawCurvePoint, end: RawCurvePoint, targetDistance: number): RawCurvePoint {
  const span = end.distance - start.distance || 1;
  const localT = clamp((targetDistance - start.distance) / span, 0, 1);

  return {
    x: start.x + (end.x - start.x) * localT,
    y: start.y + (end.y - start.y) * localT,
    u: start.u + (end.u - start.u) * localT,
    distance: targetDistance,
  };
}

function addCurvature(points: PathPoint[]): PathPoint[] {
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return { ...point, curvature: 0 };

    const a = points[index - 1];
    const b = point;
    const c = points[index + 1];
    const ab = distance(a, b);
    const bc = distance(b, c);
    const ca = distance(c, a);
    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));

    if (ab < 0.5 || bc < 0.5 || doubleArea <= 0.001) return { ...point, curvature: 0 };

    const radius = (ab * bc * ca) / (2 * doubleArea);
    return { ...point, curvature: radius === 0 ? 0 : 1 / radius };
  });
}

function resampleRawByArcLength(raw: RawCurvePoint[], spacingPx: number): PathPoint[] {
  const totalLength = raw[raw.length - 1]?.distance ?? 0;
  const desiredCount = Math.round(totalLength / spacingPx) + 1;
  const sampleCount = clamp(desiredCount, MIN_SAMPLE_COUNT, MAX_SAMPLE_COUNT);
  const points: PathPoint[] = [];
  let rawIndex = 1;

  for (let index = 0; index < sampleCount; index += 1) {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    const targetDistance = totalLength * t;

    while (rawIndex < raw.length - 1 && raw[rawIndex].distance < targetDistance) rawIndex += 1;

    const previous = raw[Math.max(0, rawIndex - 1)];
    const next = raw[rawIndex] ?? raw[raw.length - 1];
    const point = targetDistance <= 0 ? raw[0] : targetDistance >= totalLength ? raw[raw.length - 1] : interpolateRawPoint(previous, next, targetDistance);

    points.push({
      x: point.x,
      y: point.y,
      u: point.u,
      distance: targetDistance,
      t,
    });
  }

  return addCurvature(points);
}

function rawLength(raw: RawCurvePoint[]): number {
  return raw[raw.length - 1]?.distance ?? 0;
}

function createCurveBasis(
  rng: () => number,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  attemptIndex: number,
): CurveBasis {
  const course = COURSE_LENGTHS[courseLengthId];
  const profile = complexityProfiles[overlapDifficultyId];
  const sourceSampleCount = Math.max(512, Math.min(1280, course.sampleCount * 2));
  const frequencyJitter = (rng() - 0.5) * 0.16;
  const attemptFrequencyLift = Math.floor(attemptIndex / 5) * 0.22;

  return {
    frequencyScale: Math.max(0.62, courseFrequencyBase[courseLengthId] + profile.frequencyBonus + attemptFrequencyLift + frequencyJitter),
    coefficients: createCoefficients(rng, profile.harmonicCount),
    phases: createPhases(rng, profile.harmonicCount),
    minTurnRadiusPx: OVERLAP_DIFFICULTIES[overlapDifficultyId].minTurnRadiusPx,
    sampleSpacingPx: SAMPLE_SPACING_PX,
    sourceSampleCount,
  };
}

function buildCurve(
  seed: string,
  endpoints: EndpointPair,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  basis: CurveBasis,
  amplitudePx: number,
): AnalyticCurveDefinition {
  return {
    kind: "analytic-harmonic-v1",
    seed,
    generatorVersion: "analytic-v2",
    courseLengthId,
    complexityLevel: overlapDifficultyId,
    start: endpoints.start,
    end: endpoints.end,
    amplitudePx,
    frequencyScale: basis.frequencyScale,
    coefficients: basis.coefficients,
    phases: basis.phases,
    minTurnRadiusPx: basis.minTurnRadiusPx,
    sampleSpacingPx: basis.sampleSpacingPx,
    sourceSampleCount: basis.sourceSampleCount,
  };
}

function tuneAmplitudeForTarget(
  seed: string,
  viewport: Viewport,
  endpoints: EndpointPair,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  attemptIndex: number,
): AnalyticCurveDefinition {
  const rng = createRng(`${seed}:${attemptIndex}:analytic-v2`);
  const profile = complexityProfiles[overlapDifficultyId];
  const basis = createCurveBasis(rng, courseLengthId, overlapDifficultyId, attemptIndex);
  const minDimension = Math.min(viewport.width, viewport.height);
  const margin = safeMargin(viewport);
  const targetLengthPx = COURSE_LENGTHS[courseLengthId].targetNormalizedLength * minDimension;
  const maxAmplitudePx = minDimension * 1.28 * profile.amplitudeMultiplier;
  let low = 0;
  let high = maxAmplitudePx;
  let bestCurve = buildCurve(seed, endpoints, courseLengthId, overlapDifficultyId, basis, 0);
  let bestScore = Number.POSITIVE_INFINITY;

  for (let pass = 0; pass < 16; pass += 1) {
    const amplitudePx = (low + high) / 2;
    const curve = buildCurve(seed, endpoints, courseLengthId, overlapDifficultyId, basis, amplitudePx);
    const raw = sampleRawCurve(curve);
    const inside = allInsideSafeBox(raw, viewport, margin);
    const length = rawLength(raw);
    const score = Math.abs(length - targetLengthPx) + (inside ? 0 : targetLengthPx * 2);

    if (inside && score < bestScore) {
      bestCurve = curve;
      bestScore = score;
    }

    if (!inside || length > targetLengthPx) high = amplitudePx;
    else low = amplitudePx;
  }

  return bestCurve;
}

function createAnalyticCandidate(
  seed: string,
  viewport: Viewport,
  attemptIndex: number,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): AnalyticCandidate {
  const margin = safeMargin(viewport);
  const endpointRng = createRng(`${seed}:${attemptIndex}:analytic-v2:endpoints`);
  const endpoints = createBoundaryEndpointPair(endpointRng, viewport, margin);
  const curve = tuneAmplitudeForTarget(seed, viewport, endpoints, courseLengthId, overlapDifficultyId, attemptIndex);
  const raw = sampleRawCurve(curve);
  const points = resampleRawByArcLength(raw, curve.sampleSpacingPx);
  const selfIntersectionCount = countSelfIntersections(points);

  return {
    curve,
    points,
    totalLength: points[points.length - 1]?.distance ?? 0,
    selfIntersectionCount,
    usedFallback: false,
  };
}

function isValidCandidate(candidate: AnalyticCandidate, viewport: Viewport, courseLengthId: CourseLengthId): boolean {
  const margin = safeMargin(viewport);
  const minDimension = Math.min(viewport.width, viewport.height);
  const course = COURSE_LENGTHS[courseLengthId];
  const normalizedLength = candidate.totalLength / Math.max(1, minDimension);

  if (normalizedLength < course.minNormalizedLength || normalizedLength > course.maxNormalizedLength) return false;
  if (!allInsideSafeBox(candidate.points, viewport, margin)) return false;
  if (candidate.selfIntersectionCount !== 0) return false;
  if (maxTurnAngle(candidate.points) > MAX_TURN_ANGLE_RAD) return false;
  if (minTurnRadius(candidate.points) < candidate.curve.minTurnRadiusPx) return false;

  return true;
}

function candidateScore(candidate: AnalyticCandidate, viewport: Viewport, courseLengthId: CourseLengthId): number {
  const course = COURSE_LENGTHS[courseLengthId];
  const minDimension = Math.min(viewport.width, viewport.height);
  const normalizedLength = candidate.totalLength / Math.max(1, minDimension);
  const targetMiss = Math.abs(normalizedLength - course.targetNormalizedLength);
  const lengthMiss =
    normalizedLength < course.minNormalizedLength
      ? course.minNormalizedLength - normalizedLength
      : normalizedLength > course.maxNormalizedLength
        ? normalizedLength - course.maxNormalizedLength
        : 0;
  const turnMiss = Math.max(0, maxTurnAngle(candidate.points) - MAX_TURN_ANGLE_RAD);
  const radiusMiss = Math.max(0, candidate.curve.minTurnRadiusPx - minTurnRadius(candidate.points));
  const intersectionMiss = candidate.selfIntersectionCount * 100;
  const insideMiss = allInsideSafeBox(candidate.points, viewport, safeMargin(viewport)) ? 0 : 100;

  return lengthMiss * 120 + targetMiss * 12 + turnMiss * 30 + radiusMiss * 8 + intersectionMiss + insideMiss;
}

function createFallback(
  seed: string,
  viewport: Viewport,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): AnalyticCandidate {
  const startIndex = Number(deriveSeed64(seed) % 17n);
  let best: AnalyticCandidate | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let offset = 0; offset < 48; offset += 1) {
    const candidate = createAnalyticCandidate(seed, viewport, startIndex + offset, courseLengthId, overlapDifficultyId);
    const score = candidateScore(candidate, viewport, courseLengthId);

    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best ? { ...best, usedFallback: true } : createAnalyticCandidate(seed, viewport, startIndex, courseLengthId, overlapDifficultyId);
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
  let candidate: AnalyticCandidate | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const next = createAnalyticCandidate(input.seed, input.viewport, attempt, courseLengthId, overlapDifficultyId);
    if (isValidCandidate(next, input.viewport, courseLengthId)) {
      candidate = next;
      break;
    }

    if (!candidate || candidateScore(next, input.viewport, courseLengthId) < candidateScore(candidate, input.viewport, courseLengthId)) {
      candidate = next;
    }
  }

  if (!candidate || !isValidCandidate(candidate, input.viewport, courseLengthId)) {
    candidate = createFallback(input.seed, input.viewport, courseLengthId, overlapDifficultyId);
  }

  const points = candidate.points;
  const totalLength = points[points.length - 1]?.distance ?? 0;
  const complexityScore = totalLength / Math.max(1, Math.min(input.viewport.width, input.viewport.height));

  return {
    seed: input.seed,
    generatorVersion: input.generatorVersion,
    lineType: input.lineType,
    courseLengthId,
    overlapDifficultyId,
    selfIntersectionCount: candidate.selfIntersectionCount,
    generatorProfileId,
    difficulty,
    lineDifficulty,
    visibilityLevel,
    complexityScore,
    viewport: input.viewport,
    start: points[0],
    end: points[points.length - 1],
    curve: candidate.curve,
    points,
    totalLength,
    usedFallback: candidate.usedFallback,
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
