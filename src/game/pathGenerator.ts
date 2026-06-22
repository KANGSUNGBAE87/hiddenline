import { DIFFICULTIES, GAMEPLAY_DEFAULTS } from "./config";
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
  PathLayout,
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

type DraftPoint = Point;
type RawCurvePoint = Point & { u: number; distance: number };
type SerpentineBlueprint = {
  layout: PathLayout;
  laneCount: number;
  radiusPx: number;
  xInsetPx: number;
  yBias: number;
  flipX: boolean;
  flipY: boolean;
  targetLengthRangePx: { min: number; max: number };
};
type AnalyticCandidate = {
  curve: AnalyticCurveDefinition;
  points: PathPoint[];
  totalLength: number;
  selfIntersectionCount: number;
  usedFallback: boolean;
};

const SAMPLE_SPACING_PX = 3.5;
const RAW_SPACING_PX = 2;
const MIN_SAMPLE_COUNT = 128;
const MAX_SAMPLE_COUNT = 768;
const MAX_TURN_ANGLE_RAD = 0.58;
const ABSOLUTE_MAX_LENGTH_PX = 2000;

const COURSE_LENGTH_RANGES_PX: Record<CourseLengthId, { min: number; max: number }> = {
  short: { min: 600, max: 900 },
  basic: { min: 850, max: 1200 },
  long: { min: 1000, max: 1450 },
  longRun: { min: 1300, max: 1750 },
  marathon: { min: 1650, max: ABSOLUTE_MAX_LENGTH_PX },
};

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

const overlapRank: Record<OverlapDifficultyId, number> = {
  light: 0,
  normal: 1,
  complex: 2,
  hard: 3,
  master: 4,
};

const courseLayout: Record<CourseLengthId, { layout: PathLayout; laneCount: number; baseRadiusPx: number; radiusLiftPx: number; xInsetBasePx: number }> = {
  short: { layout: "single-flow", laneCount: 1, baseRadiusPx: 0, radiusLiftPx: 0, xInsetBasePx: 0 },
  basic: { layout: "two-lane-serpentine", laneCount: 3, baseRadiusPx: 52, radiusLiftPx: 1.4, xInsetBasePx: 4 },
  long: { layout: "two-lane-serpentine", laneCount: 3, baseRadiusPx: 72, radiusLiftPx: 1.8, xInsetBasePx: 4 },
  longRun: { layout: "two-lane-serpentine", laneCount: 5, baseRadiusPx: 54, radiusLiftPx: 1.3, xInsetBasePx: 10 },
  marathon: { layout: "three-lane-serpentine", laneCount: 5, baseRadiusPx: 74, radiusLiftPx: 1.5, xInsetBasePx: 0 },
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

function allInsideSafeBox(points: Point[], viewport: Viewport, margin: number): boolean {
  return points.every(
    (point) =>
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= margin - 0.01 &&
      point.x <= viewport.width - margin + 0.01 &&
      point.y >= margin - 0.01 &&
      point.y <= viewport.height - margin + 0.01,
  );
}

function appendPoint(points: DraftPoint[], point: Point): void {
  const previous = points.at(-1);
  if (previous && distance(previous, point) < 0.001) return;
  points.push(point);
}

function appendLine(points: DraftPoint[], to: Point): void {
  const from = points.at(-1);
  if (!from) {
    appendPoint(points, to);
    return;
  }

  const length = distance(from, to);
  const steps = Math.max(1, Math.ceil(length / RAW_SPACING_PX));

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    appendPoint(points, {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
}

function appendArc(points: DraftPoint[], center: Point, radiusPx: number, startAngle: number, endAngle: number): void {
  const delta = endAngle - startAngle;
  const arcLength = Math.abs(delta) * radiusPx;
  const steps = Math.max(8, Math.ceil(arcLength / RAW_SPACING_PX));

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const angle = startAngle + delta * t;
    appendPoint(points, {
      x: center.x + Math.cos(angle) * radiusPx,
      y: center.y + Math.sin(angle) * radiusPx,
    });
  }
}

function withDistances(points: DraftPoint[]): RawCurvePoint[] {
  let traveled = 0;
  const raw = points.map((point, index) => {
    if (index > 0) traveled += distance(points[index - 1], point);
    return { ...point, distance: traveled, u: 0 };
  });

  const totalLength = raw.at(-1)?.distance ?? 0;
  return raw.map((point) => ({ ...point, u: totalLength <= 0 ? 0 : point.distance / totalLength }));
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

function createBlueprint(
  seed: string,
  viewport: Viewport,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): SerpentineBlueprint {
  const rng = createRng(`${seed}:serpentine-spline-v1:${courseLengthId}:${overlapDifficultyId}`);
  const layout = courseLayout[courseLengthId];
  const margin = safeMargin(viewport);
  const safeHeight = Math.max(1, viewport.height - margin * 2);
  const rank = overlapRank[overlapDifficultyId];
  const turnCount = Math.max(0, layout.laneCount - 1);
  const heightCap = turnCount === 0 ? 0 : Math.max(42, (safeHeight - 28) / (turnCount * 2));
  const radiusPx = turnCount === 0 ? 0 : clamp(layout.baseRadiusPx + rank * layout.radiusLiftPx, 52.5, heightCap);

  return {
    layout: layout.layout,
    laneCount: layout.laneCount,
    radiusPx,
    xInsetPx: turnCount === 0 ? 0 : layout.xInsetBasePx + Math.round(rng() * 3),
    yBias: 0.38 + rng() * 0.24,
    flipX: rng() < 0.5,
    flipY: rng() < 0.5,
    targetLengthRangePx: COURSE_LENGTH_RANGES_PX[courseLengthId],
  };
}

function transformPoint(point: Point, viewport: Viewport, blueprint: SerpentineBlueprint): Point {
  return {
    x: blueprint.flipX ? viewport.width - point.x : point.x,
    y: blueprint.flipY ? viewport.height - point.y : point.y,
  };
}

function createSingleFlowDraft(seed: string, viewport: Viewport, margin: number, blueprint: SerpentineBlueprint): DraftPoint[] {
  const rng = createRng(`${seed}:serpentine-single-flow`);
  const safeWidth = viewport.width - margin * 2;
  const safeHeight = viewport.height - margin * 2;
  const startX = margin + safeWidth * (0.28 + rng() * 0.16);
  const endX = margin + safeWidth * (0.56 + rng() * 0.16);
  const bow = safeWidth * (0.08 + rng() * 0.04) * (rng() < 0.5 ? -1 : 1);
  const points: DraftPoint[] = [];
  const steps = Math.max(64, Math.ceil(safeHeight / RAW_SPACING_PX));

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const envelope = Math.sin(Math.PI * t) ** 2;
    const x = clamp(startX + (endX - startX) * t + bow * envelope, margin, viewport.width - margin);
    const y = margin + safeHeight * t;
    appendPoint(points, transformPoint({ x, y }, viewport, blueprint));
  }

  return points;
}

function createHorizontalSerpentineDraft(viewport: Viewport, margin: number, blueprint: SerpentineBlueprint): DraftPoint[] {
  const left = margin + blueprint.xInsetPx;
  const right = viewport.width - margin - blueprint.xInsetPx;
  const radiusPx = blueprint.radiusPx;
  const turnCount = blueprint.laneCount - 1;
  const laneSpan = turnCount * radiusPx * 2;
  const safeHeight = viewport.height - margin * 2;
  const freeHeight = Math.max(0, safeHeight - laneSpan);
  const topLaneY = margin + freeHeight * blueprint.yBias;
  const points: DraftPoint[] = [];

  appendPoint(points, { x: left, y: topLaneY });

  for (let lane = 0; lane < blueprint.laneCount; lane += 1) {
    const y = topLaneY + lane * radiusPx * 2;
    const movingRight = lane % 2 === 0;
    const finalLane = lane === blueprint.laneCount - 1;

    if (movingRight) {
      appendLine(points, { x: finalLane ? right : right - radiusPx, y });
      if (!finalLane) appendArc(points, { x: right - radiusPx, y: y + radiusPx }, radiusPx, -Math.PI / 2, Math.PI / 2);
    } else {
      appendLine(points, { x: finalLane ? left : left + radiusPx, y });
      if (!finalLane) appendArc(points, { x: left + radiusPx, y: y + radiusPx }, radiusPx, -Math.PI / 2, -Math.PI * 1.5);
    }
  }

  const transformed = points.map((point) => transformPoint(point, viewport, blueprint));
  return blueprint.flipX ? transformed.reverse() : transformed;
}

function createDraftPoints(seed: string, viewport: Viewport, margin: number, blueprint: SerpentineBlueprint): DraftPoint[] {
  if (blueprint.layout === "single-flow") return createSingleFlowDraft(seed, viewport, margin, blueprint);
  return createHorizontalSerpentineDraft(viewport, margin, blueprint);
}

function createCandidate(
  seed: string,
  viewport: Viewport,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
): AnalyticCandidate {
  const margin = safeMargin(viewport);
  const blueprint = createBlueprint(seed, viewport, courseLengthId, overlapDifficultyId);
  const draft = createDraftPoints(seed, viewport, margin, blueprint);
  const raw = withDistances(draft);
  const points = resampleRawByArcLength(raw, SAMPLE_SPACING_PX);
  const selfIntersectionCount = countSelfIntersections(points);
  const totalLength = points[points.length - 1]?.distance ?? 0;
  const curve: AnalyticCurveDefinition = {
    kind: "serpentine-spline-v1",
    seed,
    generatorVersion: "analytic-v2",
    courseLengthId,
    complexityLevel: overlapDifficultyId,
    layout: blueprint.layout,
    start: { x: points[0].x, y: points[0].y },
    end: { x: points[points.length - 1].x, y: points[points.length - 1].y },
    targetLengthRangePx: blueprint.targetLengthRangePx,
    minTurnRadiusPx: blueprint.radiusPx || Number.POSITIVE_INFINITY,
    sampleSpacingPx: SAMPLE_SPACING_PX,
    sourceSampleCount: raw.length,
  };

  return {
    curve,
    points,
    totalLength,
    selfIntersectionCount,
    usedFallback: false,
  };
}

function isValidCandidate(candidate: AnalyticCandidate, viewport: Viewport): boolean {
  if (candidate.totalLength > ABSOLUTE_MAX_LENGTH_PX) return false;
  if (!allInsideSafeBox(candidate.points, viewport, safeMargin(viewport))) return false;
  if (candidate.selfIntersectionCount !== 0) return false;
  if (maxTurnAngle(candidate.points) > MAX_TURN_ANGLE_RAD) return false;
  if (candidate.curve.minTurnRadiusPx !== Number.POSITIVE_INFINITY && minTurnRadius(candidate.points) < candidate.curve.minTurnRadiusPx - 1) return false;

  return true;
}

export function generatePath(input: PathGenerationInput): GeneratedPath {
  const difficulty = input.difficulty ?? "normal";
  const lineDifficulty = input.lineDifficulty ?? (difficulty === "expert" ? "hard" : difficulty);
  const visibilityLevel = input.visibilityLevel ?? lineDifficulty;
  const rules = DIFFICULTIES[visibilityLevel];
  const generatorProfileId = input.generatorProfileId ?? "daily-main-normal-v1";
  const courseLengthId = input.courseLengthId ?? (input.lineType ? courseByLegacyLineType[input.lineType] : "basic");
  const overlapDifficultyId = input.overlapDifficultyId ?? overlapByLineDifficulty[lineDifficulty];
  const candidate = createCandidate(input.seed, input.viewport, courseLengthId, overlapDifficultyId);

  const usedFallback = candidate.usedFallback;

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
