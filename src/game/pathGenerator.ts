import { DIFFICULTIES, ORGANIC_CURVE_PROFILES, ORGANIC_OVERLAP_PROFILES } from "./config";
import { clamp, distance } from "./pathGeometry";
import { createRng } from "./random";
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

type SafeBox = { minX: number; minY: number; maxX: number; maxY: number };
type OrganicProfile = (typeof ORGANIC_CURVE_PROFILES)[CourseLengthId] & {
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  minTurnRadiusPx: number;
  turnPressure: number;
  complexityBoost: number;
};
type Candidate = {
  rawPoints: Point[];
  points: PathPoint[];
  totalLength: number;
  start: Point;
  end: Point;
  anchorCount: number;
  selfIntersectionCount: number;
  minTurnRadiusMeasured: number;
  maxHeadingDelta: number;
  occupancy: { widthRatio: number; heightRatio: number };
  measuredDifficultyScore: number;
  valid: boolean;
  usedFallback: boolean;
  attemptIndex: number;
};

const KIND = "organic-spline-v5" as const;
const SAMPLE_SPACING_PX = 3.5;
const MAX_ATTEMPTS = 32;

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

function safeMargin(viewport: Viewport): number {
  return Math.min(48, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
}

function makeBox(viewport: Viewport): SafeBox {
  const margin = safeMargin(viewport) + Math.min(10, Math.min(viewport.width, viewport.height) * 0.025);
  return { minX: margin, minY: margin, maxX: viewport.width - margin, maxY: viewport.height - margin };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pickStartEnd(rng: () => number, box: SafeBox): { start: Point; end: Point } {
  const horizontal = rng() < 0.5;
  const startLow = rng() < 0.5;
  const startAlong = startLow ? lerp(0.08, 0.36, rng()) : lerp(0.64, 0.92, rng());
  const endAlong = startLow ? lerp(0.64, 0.92, rng()) : lerp(0.08, 0.36, rng());
  const startInset = rng() * 10;
  const endInset = rng() * 10;

  if (horizontal) {
    const startLeft = rng() < 0.5;
    return {
      start: { x: startLeft ? box.minX + startInset : box.maxX - startInset, y: lerp(box.minY + 16, box.maxY - 16, startAlong) },
      end: { x: startLeft ? box.maxX - endInset : box.minX + endInset, y: lerp(box.minY + 16, box.maxY - 16, endAlong) },
    };
  }

  const startTop = rng() < 0.5;
  return {
    start: { x: lerp(box.minX + 16, box.maxX - 16, startAlong), y: startTop ? box.minY + startInset : box.maxY - startInset },
    end: { x: lerp(box.minX + 16, box.maxX - 16, endAlong), y: startTop ? box.maxY - endInset : box.minY + endInset },
  };
}

function resolveProfile(courseLengthId: CourseLengthId, overlapDifficultyId: OverlapDifficultyId): OrganicProfile {
  const base = ORGANIC_CURVE_PROFILES[courseLengthId];
  const overlap = ORGANIC_OVERLAP_PROFILES[overlapDifficultyId];
  return {
    ...base,
    courseLengthId,
    overlapDifficultyId,
    minTurnRadiusPx: base.minTurnRadiusPx * overlap.minTurnRadiusScale,
    turnPressure: clamp(base.turnPressure + overlap.turnPressureBoost, 0, 1),
    complexityBoost: overlap.complexityBoost,
  };
}

function buildOrganicAnchors(rng: () => number, box: SafeBox, profile: OrganicProfile): Point[] {
  const { start, end } = pickStartEnd(rng, box);
  const center = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };
  const anchorCount = Math.max(7, profile.anchorCount + Math.floor(lerp(-2, 3, rng())));
  const targetLength = lerp(profile.softLengthRangePx.min, profile.softLengthRangePx.max, rng());
  const baseStep = targetLength / Math.max(1, anchorCount - 1);
  const maxRandomTurn = lerp(0.28, 0.74, profile.turnPressure) + profile.complexityBoost * 0.08;
  const anchors: Point[] = [start];
  let current = start;
  let heading = Math.atan2(end.y - start.y, end.x - start.x) + lerp(-1.2, 1.2, rng()) * (0.35 + profile.turnPressure * 0.28);

  for (let index = 1; index < anchorCount - 1; index += 1) {
    const progress = index / (anchorCount - 1);
    const toEnd = Math.atan2(end.y - current.y, end.x - current.x);
    const toCenter = Math.atan2(center.y - current.y, center.x - current.x);
    const endPull = Math.max(0, progress - 0.56) * 0.58;
    const centerPull = edgePressure(current, box) * 0.72;
    heading = blendAngles(heading, toCenter, centerPull);
    heading = blendAngles(heading, toEnd, endPull);
    heading += lerp(-maxRandomTurn, maxRandomTurn, rng());

    let step = baseStep * lerp(0.72, 1.18, rng());
    let next = { x: current.x + Math.cos(heading) * step, y: current.y + Math.sin(heading) * step };
    for (let retry = 0; retry < 8 && !pointInside(next, box); retry += 1) {
      const avoid = Math.atan2(center.y - current.y, center.x - current.x);
      heading = blendAngles(heading, avoid, 0.65) + lerp(-0.38, 0.38, rng());
      step *= 0.86;
      next = { x: current.x + Math.cos(heading) * step, y: current.y + Math.sin(heading) * step };
    }
    if (!pointInside(next, box)) {
      next = {
        x: clamp(next.x, box.minX + 6, box.maxX - 6),
        y: clamp(next.y, box.minY + 6, box.maxY - 6),
      };
    }
    anchors.push(next);
    current = next;
  }

  anchors.push(end);
  return anchors;
}

function angleDelta(a: number, b: number): number {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

function blendAngles(from: number, to: number, amount: number): number {
  return from + angleDelta(from, to) * clamp(amount, 0, 1);
}

function pointInside(point: Point, box: SafeBox): boolean {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}

function edgePressure(point: Point, box: SafeBox): number {
  const inset = Math.min(point.x - box.minX, box.maxX - point.x, point.y - box.minY, box.maxY - point.y);
  return clamp((56 - inset) / 56, 0, 1);
}

function smoothPoints(points: Point[], passes: number): Point[] {
  let current = points.slice();
  for (let pass = 0; pass < passes; pass += 1) {
    const next = current.map((point, index) => {
      if (index === 0 || index === current.length - 1) return point;
      const previous = current[index - 1];
      const following = current[index + 1];
      return {
        x: previous.x * 0.22 + point.x * 0.56 + following.x * 0.22,
        y: previous.y * 0.22 + point.y * 0.56 + following.y * 0.22,
      };
    });
    current = next;
  }
  return current;
}

function chaikinSmooth(points: Point[], iterations: number): Point[] {
  let current = points.slice();
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next: Point[] = [current[0]];
    for (let index = 0; index < current.length - 1; index += 1) {
      const a = current[index];
      const b = current[index + 1];
      next.push({ x: a.x * 0.72 + b.x * 0.28, y: a.y * 0.72 + b.y * 0.28 });
      next.push({ x: a.x * 0.28 + b.x * 0.72, y: a.y * 0.28 + b.y * 0.72 });
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

function resamplePolyline(points: Point[], spacingPx: number): Point[] {
  if (points.length < 2) return points.slice();
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) cumulative.push(cumulative[index - 1] + distance(points[index - 1], points[index]));
  const total = cumulative[cumulative.length - 1];
  if (total <= 0) return [points[0]];

  const sampleCount = Math.max(2, Math.round(total / spacingPx) + 1);
  const out: Point[] = [];
  let segment = 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const target = (index / (sampleCount - 1)) * total;
    while (segment < points.length - 1 && cumulative[segment] < target) segment += 1;
    const a = points[segment - 1];
    const b = points[segment];
    const span = cumulative[segment] - cumulative[segment - 1] || 1;
    const localT = clamp((target - cumulative[segment - 1]) / span, 0, 1);
    out.push({ x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT });
  }
  return out;
}

function annotate(points: Point[]): PathPoint[] {
  let traveled = 0;
  const distances = points.map((point, index) => {
    if (index > 0) traveled += distance(points[index - 1], point);
    return traveled;
  });
  const totalLength = distances[distances.length - 1] || 0;

  return points.map((point, index) => {
    const annotated: PathPoint = {
      x: point.x,
      y: point.y,
      distance: distances[index],
      t: totalLength === 0 ? 0 : distances[index] / totalLength,
      u: totalLength === 0 ? 0 : distances[index] / totalLength,
    };
    if (index > 0 && index < points.length - 1) {
      const a = points[index - 1];
      const c = points[index + 1];
      const ab = distance(a, point);
      const bc = distance(point, c);
      const ca = distance(c, a);
      const doubleArea = Math.abs((point.x - a.x) * (c.y - a.y) - (point.y - a.y) * (c.x - a.x));
      annotated.curvature = ab < 0.5 || bc < 0.5 || doubleArea <= 0.001 ? 0 : (2 * doubleArea) / (ab * bc * ca);
    } else {
      annotated.curvature = 0;
    }
    return annotated;
  });
}

function countSelfIntersections(points: Point[]): number {
  const orientation = (a: Point, b: Point, c: Point): number => (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  const intersects = (a: Point, b: Point, c: Point, d: Point): boolean => {
    const o1 = orientation(a, b, c);
    const o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a);
    const o4 = orientation(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
  };

  let count = 0;
  for (let first = 0; first < points.length - 1; first += 1) {
    for (let second = first + 2; second < points.length - 1; second += 1) {
      if (first === 0 && second === points.length - 2) continue;
      if (intersects(points[first], points[first + 1], points[second], points[second + 1])) count += 1;
    }
  }
  return count;
}

function measureMinTurnRadius(points: Point[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length - 1; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const c = points[index + 1];
    const ab = distance(a, b);
    const bc = distance(b, c);
    if (ab < 0.8 || bc < 0.8) continue;
    const ca = distance(c, a);
    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) min = Math.min(min, (ab * bc * ca) / (2 * doubleArea));
  }
  return min;
}

function maxHeadingDelta(points: Point[]): number {
  let maxDelta = 0;
  for (let index = 2; index < points.length; index += 1) {
    const previous = Math.atan2(points[index - 1].y - points[index - 2].y, points[index - 1].x - points[index - 2].x);
    const next = Math.atan2(points[index].y - points[index - 1].y, points[index].x - points[index - 1].x);
    const delta = Math.abs(Math.atan2(Math.sin(next - previous), Math.cos(next - previous)));
    maxDelta = Math.max(maxDelta, delta);
  }
  return maxDelta;
}

function occupancyOf(points: Point[], box: SafeBox): { widthRatio: number; heightRatio: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  return {
    widthRatio: (maxX - minX) / Math.max(1, box.maxX - box.minX),
    heightRatio: (maxY - minY) / Math.max(1, box.maxY - box.minY),
  };
}

function fitPointsInsideBox(points: Point[], box: SafeBox): Point[] {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const availableWidth = box.maxX - box.minX;
  const availableHeight = box.maxY - box.minY;
  const scale = Math.min(1, availableWidth / width, availableHeight / height);
  const sourceCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const targetCenter = {
    x: clamp(sourceCenter.x, box.minX + (width * scale) / 2, box.maxX - (width * scale) / 2),
    y: clamp(sourceCenter.y, box.minY + (height * scale) / 2, box.maxY - (height * scale) / 2),
  };

  return points.map((point) => ({
    x: targetCenter.x + (point.x - sourceCenter.x) * scale,
    y: targetCenter.y + (point.y - sourceCenter.y) * scale,
  }));
}

function staysInside(points: Point[], box: SafeBox): boolean {
  return points.every((point) => point.x >= box.minX - 0.01 && point.x <= box.maxX + 0.01 && point.y >= box.minY - 0.01 && point.y <= box.maxY + 0.01);
}

function difficultyScore(candidate: Omit<Candidate, "measuredDifficultyScore" | "valid" | "usedFallback">, profile: OrganicProfile): number {
  const occupancy = (candidate.occupancy.widthRatio + candidate.occupancy.heightRatio) / 2;
  const turnBurden = Number.isFinite(candidate.minTurnRadiusMeasured) ? 1 / Math.max(24, candidate.minTurnRadiusMeasured) : 0;
  return (
    profile.rank * 10 +
    profile.complexityBoost * 3 +
    candidate.totalLength / 160 +
    candidate.selfIntersectionCount * 1.35 +
    occupancy * profile.occupancyWeight * 3.2 +
    turnBurden * 180
  );
}

function evaluateCandidate(rawPoints: Point[], anchorCount: number, box: SafeBox, profile: OrganicProfile, attemptIndex: number): Candidate {
  const resampled = resamplePolyline(rawPoints, SAMPLE_SPACING_PX);
  const annotated = annotate(resampled);
  const totalLength = annotated[annotated.length - 1]?.distance ?? 0;
  const selfIntersectionCount = countSelfIntersections(resampled);
  const minTurnRadiusMeasured = measureMinTurnRadius(resampled);
  const heading = maxHeadingDelta(resampled);
  const occupancy = occupancyOf(resampled, box);
  const base = {
    rawPoints,
    points: annotated,
    totalLength,
    start: { x: annotated[0].x, y: annotated[0].y },
    end: { x: annotated[annotated.length - 1].x, y: annotated[annotated.length - 1].y },
    anchorCount,
    selfIntersectionCount,
    minTurnRadiusMeasured,
    maxHeadingDelta: heading,
    occupancy,
    attemptIndex,
  };
  const valid =
    totalLength > profile.softLengthRangePx.min * 0.58 &&
    totalLength <= profile.safetyMaxLengthPx &&
    staysInside(resampled, box) &&
    minTurnRadiusMeasured >= profile.minTurnRadiusPx * 0.58 &&
    heading < 0.48;
  return {
    ...base,
    measuredDifficultyScore: difficultyScore(base, profile),
    valid,
    usedFallback: false,
  };
}

function targetLengthScore(totalLength: number, profile: OrganicProfile): number {
  const mid = (profile.softLengthRangePx.min + profile.softLengthRangePx.max) / 2;
  const width = Math.max(1, profile.softLengthRangePx.max - profile.softLengthRangePx.min);
  return 1 - Math.min(1, Math.abs(totalLength - mid) / width);
}

function candidatePickScore(candidate: Candidate, profile: OrganicProfile): number {
  const occupancy = (candidate.occupancy.widthRatio + candidate.occupancy.heightRatio) / 2;
  const smoothPenalty = Math.max(0, candidate.maxHeadingDelta - 0.24) * 14;
  return targetLengthScore(candidate.totalLength, profile) * 8 + occupancy * profile.occupancyWeight * 3 + candidate.measuredDifficultyScore / 12 - smoothPenalty;
}

function createCandidate(seed: string, profile: OrganicProfile, box: SafeBox, attemptIndex: number): Candidate {
  const rng = createRng(`${seed}:${KIND}:${profile.courseLengthId}:${profile.overlapDifficultyId}:${attemptIndex}`);
  const anchors = buildOrganicAnchors(rng, box, profile);
  const rawPoints = chaikinSmooth(anchors, 4 + Math.min(2, profile.rank));
  const smoothed = smoothPoints(rawPoints, 7 + profile.rank * 3);
  const candidatePoints = staysInside(smoothed, box) ? smoothed : fitPointsInsideBox(smoothed, box);
  return evaluateCandidate(candidatePoints, anchors.length, box, profile, attemptIndex);
}

function createFallback(seed: string, profile: OrganicProfile, box: SafeBox): Candidate {
  const rng = createRng(`${seed}:${KIND}:fallback:${profile.courseLengthId}`);
  const { start, end } = pickStartEnd(rng, box);
  const mid: Point = {
    x: (start.x + end.x) / 2 + (rng() - 0.5) * (box.maxX - box.minX) * 0.25,
    y: (start.y + end.y) / 2 + (rng() - 0.5) * (box.maxY - box.minY) * 0.25,
  };
  const rawPoints = smoothPoints(chaikinSmooth([start, mid, end], 5), 6);
  return { ...evaluateCandidate(rawPoints, 3, box, profile, 0), usedFallback: true };
}

function pickBestCandidate(seed: string, profile: OrganicProfile, box: SafeBox, attempts: number): Candidate {
  let bestValid: Candidate | null = null;
  let bestAny: Candidate | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = createCandidate(seed, profile, box, attempt);
    if (!bestAny || candidatePickScore(candidate, profile) > candidatePickScore(bestAny, profile)) bestAny = candidate;
    if (candidate.valid && (!bestValid || candidatePickScore(candidate, profile) > candidatePickScore(bestValid, profile))) bestValid = candidate;
  }
  return bestValid ?? (bestAny ? { ...bestAny, usedFallback: true } : createFallback(seed, profile, box));
}

export function generatePath(input: PathGenerationInput): GeneratedPath {
  const difficulty = input.difficulty ?? "normal";
  const lineDifficulty = input.lineDifficulty ?? (difficulty === "expert" ? "hard" : difficulty);
  const visibilityLevel = input.visibilityLevel ?? lineDifficulty;
  const rules = DIFFICULTIES[visibilityLevel];
  const generatorProfileId = input.generatorProfileId ?? "daily-main-normal-v1";
  const courseLengthId = input.courseLengthId ?? (input.lineType ? courseByLegacyLineType[input.lineType] : "basic");
  const overlapDifficultyId = input.overlapDifficultyId ?? overlapByLineDifficulty[lineDifficulty];
  const attempts = Math.max(1, input.maxAttempts ?? MAX_ATTEMPTS);

  const box = makeBox(input.viewport);
  const profile = resolveProfile(courseLengthId, overlapDifficultyId);
  const candidate = pickBestCandidate(input.seed, profile, box, attempts);
  const points = candidate.points;
  const totalLength = candidate.totalLength;
  const complexityScore = candidate.measuredDifficultyScore;

  const curve: AnalyticCurveDefinition = {
    kind: KIND,
    seed: input.seed,
    generatorVersion: "organic-v5",
    courseLengthId,
    overlapDifficultyId,
    start: candidate.start,
    end: candidate.end,
    construction: "seeded-anchor-walk-chaikin-smooth",
    softLengthRangePx: profile.softLengthRangePx,
    minTurnRadiusPx: profile.minTurnRadiusPx,
    anchorCount: candidate.anchorCount,
    turnPressure: profile.turnPressure,
    sampleSpacingPx: SAMPLE_SPACING_PX,
    pointCount: points.length,
    attemptIndex: candidate.attemptIndex,
    usedFallback: candidate.usedFallback,
    measuredDifficultyScore: candidate.measuredDifficultyScore,
    measuredMinTurnRadiusPx: candidate.minTurnRadiusMeasured,
    occupancy: candidate.occupancy,
  };

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
    curve,
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
