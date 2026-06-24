import { DIFFICULTIES, OVERLAP_SHAPE_PROFILES, PATH_LENGTH_RANGES_PX } from "./config";
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
type CurveProfile = {
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  lengthRangePx: { min: number; max: number };
  minTurnRadiusPx: number;
  selfClearancePx: number;
};
type Candidate = {
  points: PathPoint[];
  totalLength: number;
  start: Point;
  end: Point;
  swings: number;
  selfIntersectionCount: number;
  minTurnRadiusMeasured: number;
  minClearanceMeasured: number;
  occupancy: { widthRatio: number; heightRatio: number };
  valid: boolean;
  inRange: boolean;
  usedFallback: boolean;
};

const KIND = "self-avoiding-curvature-v4" as const;
const SAMPLE_SPACING_PX = 3.5;
const BUILD_SPACING_PX = 5;
const ABSOLUTE_MAX_LENGTH_PX = 2000;
const MAX_ATTEMPTS = 48;

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
  const margin = safeMargin(viewport);
  return { minX: margin, minY: margin, maxX: viewport.width - margin, maxY: viewport.height - margin };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Random start/end on opposite-ish safe edges, kept far apart.
function pickStartEnd(rng: () => number, box: SafeBox): { start: Point; end: Point } {
  const horizontal = rng() < 0.5;
  const startLow = rng() < 0.5;
  const startAlong = startLow ? lerp(0.05, 0.4, rng()) : lerp(0.6, 0.95, rng());
  const endAlong = startLow ? lerp(0.6, 0.95, rng()) : lerp(0.05, 0.4, rng());
  const startInset = rng() * 12;
  const endInset = rng() * 12;

  if (horizontal) {
    const startLeft = rng() < 0.5;
    return {
      start: { x: startLeft ? box.minX + startInset : box.maxX - startInset, y: lerp(box.minY + 12, box.maxY - 12, startAlong) },
      end: { x: startLeft ? box.maxX - endInset : box.minX + endInset, y: lerp(box.minY + 12, box.maxY - 12, endAlong) },
    };
  }

  const startTop = rng() < 0.5;
  return {
    start: { x: lerp(box.minX + 12, box.maxX - 12, startAlong), y: startTop ? box.minY + startInset : box.maxY - startInset },
    end: { x: lerp(box.minX + 12, box.maxX - 12, endAlong), y: startTop ? box.maxY - endInset : box.minY + endInset },
  };
}

// Build a single smooth meander from start to end. The curve advances along the
// start->end axis (so it can never fold back over itself) while swinging sideways
// like a randomized wave. Swing count + amplitude are chosen so the wave hits the
// wanted length while keeping its curvature under the min-turn-radius limit, which
// is what guarantees big, round arcs instead of tight curls. Nothing here is a
// fixed template: axis, length, swing count, amplitude envelope, drift and bow are
// all seed-random, and the curve is not forced through any exact coordinate.
function buildMeander(rng: () => number, box: SafeBox, profile: CurveProfile, targetLengthPx: number): { points: Point[]; swings: number } {
  const { start, end } = pickStartEnd(rng, box);
  const axisX = end.x - start.x;
  const axisY = end.y - start.y;
  const forwardSpan = Math.hypot(axisX, axisY) || 1;
  const ux = axisX / forwardSpan;
  const uy = axisY / forwardSpan;
  const vx = -uy;
  const vy = ux;
  const minR = profile.minTurnRadiusPx;

  // Measured sideways room from the axis line to the box boundary (worst case
  // along the path), so the wave provably fits without being clamped — clamping
  // is what produced flat spots and sharp corners.
  const perpHalf = Math.max(24, perpendicularRoom(start, end, vx, vy, box) - 6);
  // Reserve part of the room for a gentle whole-curve bow, leave the rest for the
  // swing so hump + bow can never leave the box.
  const bowAmp = (rng() - 0.5) * perpHalf * 0.3;
  const humpCap = Math.max(18, perpHalf - Math.abs(bowAmp) - 4);

  // Pick the half-swing count m (k*forwardSpan = pi*m, so the wave returns to the
  // axis exactly at both ends). For each m find the amplitude that hits the length,
  // capped by the min-radius limit and the box. Keep the m whose achievable length
  // is closest to target.
  const extra = Math.max(0, targetLengthPx - forwardSpan);
  let bestM = 1;
  let bestAmp = 0;
  let bestErr = Number.POSITIVE_INFINITY;
  for (let m = 1; m <= 16; m += 1) {
    const k = (Math.PI * m) / forwardSpan;
    const ampForLength = Math.sqrt((4 * forwardSpan * extra) / (Math.PI * Math.PI * m * m || 1));
    const ampRadiusCap = 1 / (k * k * minR); // amplitude where peak curvature == 1/minR
    const amp = Math.min(ampForLength, ampRadiusCap, humpCap);
    if (amp < 16 && m > 1) continue;
    const achievable = forwardSpan + (amp * amp * Math.PI * Math.PI * m * m) / (4 * forwardSpan);
    const err = Math.abs(achievable - targetLengthPx);
    if (err < bestErr) {
      bestErr = err;
      bestM = m;
      bestAmp = amp;
    }
  }

  const k = (Math.PI * bestM) / forwardSpan;
  const swings = bestM / 2;
  // Gentle organic variation that still vanishes at both ends.
  const envFreq = lerp(0.6, 1.4, rng());
  const envPhase = rng() * Math.PI * 2;
  const envDepth = lerp(0.12, 0.28, rng());
  const bowPhase = rng() * Math.PI;
  const flip = rng() < 0.5 ? 1 : -1;

  const sampleCount = Math.max(48, Math.ceil(forwardSpan / BUILD_SPACING_PX));
  const points: Point[] = [];
  for (let i = 0; i <= sampleCount; i += 1) {
    const t = i / sampleCount;
    const along = t * forwardSpan;
    const window = Math.sin(Math.PI * t); // 0 at both ends -> endpoints stay exact
    const envelope = 1 - envDepth + envDepth * Math.sin(Math.PI * 2 * t * envFreq + envPhase);
    const hump = flip * bestAmp * envelope * Math.sin(k * along);
    const bow = bowAmp * window * Math.sin(Math.PI * t + bowPhase);
    const lateral = hump + bow;
    points.push({
      x: clamp(start.x + ux * along + vx * lateral, box.minX, box.maxX),
      y: clamp(start.y + uy * along + vy * lateral, box.minY, box.maxY),
    });
  }
  points[0] = { x: start.x, y: start.y };
  points[points.length - 1] = { x: end.x, y: end.y };

  return { points, swings };
}

function rayToBox(px: number, py: number, dx: number, dy: number, box: SafeBox): number {
  let tHit = Number.POSITIVE_INFINITY;
  if (dx > 1e-6) tHit = Math.min(tHit, (box.maxX - px) / dx);
  else if (dx < -1e-6) tHit = Math.min(tHit, (box.minX - px) / dx);
  if (dy > 1e-6) tHit = Math.min(tHit, (box.maxY - py) / dy);
  else if (dy < -1e-6) tHit = Math.min(tHit, (box.minY - py) / dy);
  return tHit;
}

// Worst-case sideways room from the start->end axis to the box boundary.
function perpendicularRoom(start: Point, end: Point, vx: number, vy: number, box: SafeBox): number {
  let room = Number.POSITIVE_INFINITY;
  for (let s = 1; s <= 9; s += 1) {
    const t = s / 10;
    const px = start.x + (end.x - start.x) * t;
    const py = start.y + (end.y - start.y) * t;
    room = Math.min(room, rayToBox(px, py, vx, vy, box), rayToBox(px, py, -vx, -vy, box));
  }
  return Math.max(0, room);
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

// Smallest distance between two non-adjacent points, via a uniform grid.
function measureMinClearance(points: Point[], clearancePx: number, exclusion: number): number {
  const cell = Math.max(clearancePx, 20);
  const buckets = new Map<number, number[]>();
  const key = (x: number, y: number): number => Math.floor(x / cell) * 100003 + Math.floor(y / cell);
  let min = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const cx = Math.floor(points[i].x / cell);
    const cy = Math.floor(points[i].y / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx += 1) {
      for (let gy = cy - 1; gy <= cy + 1; gy += 1) {
        const bucket = buckets.get(gx * 100003 + gy);
        if (!bucket) continue;
        for (const j of bucket) {
          if (i - j <= exclusion) continue;
          const d = distance(points[i], points[j]);
          if (d < min) min = d;
        }
      }
    }
    const k = key(points[i].x, points[i].y);
    const own = buckets.get(k);
    if (own) own.push(i);
    else buckets.set(k, [i]);
  }
  return min;
}

function occupancyOf(points: Point[], box: SafeBox): { widthRatio: number; heightRatio: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  return {
    widthRatio: (maxX - minX) / Math.max(1, box.maxX - box.minX),
    heightRatio: (maxY - minY) / Math.max(1, box.maxY - box.minY),
  };
}

function evaluateCandidate(rawPoints: Point[], swings: number, box: SafeBox, profile: CurveProfile): Candidate {
  const resampled = resamplePolyline(rawPoints, SAMPLE_SPACING_PX);
  const annotated = annotate(resampled);
  const totalLength = annotated[annotated.length - 1]?.distance ?? 0;
  const selfIntersectionCount = countSelfIntersections(resampled);
  const minTurnRadiusMeasured = measureMinTurnRadius(resampled);
  const exclusion = Math.ceil((profile.selfClearancePx * 1.7) / SAMPLE_SPACING_PX);
  const minClearanceMeasured = measureMinClearance(resampled, profile.selfClearancePx, exclusion);

  const valid =
    totalLength > 0 &&
    totalLength <= ABSOLUTE_MAX_LENGTH_PX &&
    selfIntersectionCount === 0 &&
    minTurnRadiusMeasured >= profile.minTurnRadiusPx * 0.82 &&
    minClearanceMeasured >= profile.selfClearancePx * 0.85;
  const inRange = totalLength >= profile.lengthRangePx.min && totalLength <= profile.lengthRangePx.max;

  return {
    points: annotated,
    totalLength,
    start: { x: annotated[0].x, y: annotated[0].y },
    end: { x: annotated[annotated.length - 1].x, y: annotated[annotated.length - 1].y },
    swings,
    selfIntersectionCount,
    minTurnRadiusMeasured,
    minClearanceMeasured,
    occupancy: occupancyOf(resampled, box),
    valid,
    inRange,
    usedFallback: false,
  };
}

function resolveProfile(courseLengthId: CourseLengthId, overlapDifficultyId: OverlapDifficultyId): CurveProfile {
  const shape = OVERLAP_SHAPE_PROFILES[overlapDifficultyId];
  return {
    courseLengthId,
    overlapDifficultyId,
    lengthRangePx: PATH_LENGTH_RANGES_PX[courseLengthId],
    minTurnRadiusPx: shape.minTurnRadiusPx,
    selfClearancePx: shape.selfClearancePx,
  };
}

function pickBestCandidate(seed: string, profile: CurveProfile, box: SafeBox, attempts: number): Candidate {
  // Length in a phone-narrow box is capped once we keep the arcs large and
  // non-crossing, so we treat the course range as a target and return the valid
  // curve closest to it rather than forcing an exact length.
  const targetMid = (profile.lengthRangePx.min + profile.lengthRangePx.max) / 2;
  let bestValid: Candidate | null = null;
  let bestAny: Candidate | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const rng = createRng(`${seed}:${KIND}:${profile.courseLengthId}:${profile.overlapDifficultyId}:${attempt}`);
    const targetLength = lerp(profile.lengthRangePx.min, profile.lengthRangePx.max, rng());
    const meander = buildMeander(rng, box, profile, targetLength);
    const candidate = evaluateCandidate(meander.points, meander.swings, box, profile);

    if (!bestAny) bestAny = candidate;

    if (candidate.valid) {
      if (!bestValid || Math.abs(candidate.totalLength - targetMid) < Math.abs(bestValid.totalLength - targetMid)) {
        bestValid = candidate;
      }
    }
  }

  // A valid curve that lands a little short of the course target is still a real
  // curve, not a fallback; only a missing valid curve counts as fallback.
  if (bestValid) return bestValid;
  if (bestAny) return { ...bestAny, usedFallback: true };

  const rng = createRng(`${seed}:${KIND}:degenerate`);
  const { start, end } = pickStartEnd(rng, box);
  const simple = annotate(resamplePolyline([start, end], SAMPLE_SPACING_PX));
  return {
    points: simple,
    totalLength: simple[simple.length - 1]?.distance ?? 0,
    start,
    end,
    swings: 0,
    selfIntersectionCount: 0,
    minTurnRadiusMeasured: Number.POSITIVE_INFINITY,
    minClearanceMeasured: Number.POSITIVE_INFINITY,
    occupancy: occupancyOf([start, end], box),
    valid: false,
    inRange: false,
    usedFallback: true,
  };
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
  const complexityScore = totalLength / Math.max(1, Math.min(input.viewport.width, input.viewport.height));

  const curve: AnalyticCurveDefinition = {
    kind: KIND,
    seed: input.seed,
    generatorVersion: "analytic-v2",
    courseLengthId,
    overlapDifficultyId,
    start: candidate.start,
    end: candidate.end,
    targetLengthRangePx: profile.lengthRangePx,
    minTurnRadiusPx: profile.minTurnRadiusPx,
    selfClearancePx: profile.selfClearancePx,
    attractorCount: candidate.swings,
    sampleSpacingPx: SAMPLE_SPACING_PX,
    sourceSampleCount: points.length,
    attemptIndex: 0,
    usedFallback: candidate.usedFallback,
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
