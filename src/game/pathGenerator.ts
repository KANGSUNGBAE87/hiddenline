import { COURSE_LENGTHS, DIFFICULTIES, GAMEPLAY_DEFAULTS, LINE_DIFFICULTIES, OVERLAP_DIFFICULTIES } from "./config";
import { annotatePolyline, clamp, distance, hasSelfIntersection, lerp, polylineLength } from "./pathGeometry";
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

const profileSettings: Record<GeneratorProfileId, { primary: number; secondary: number; tertiary: number; lengthBias: number }> = {
  "gentle-warmup-v1": { primary: 0.12, secondary: 0.16, tertiary: 0.03, lengthBias: 0.92 },
  "daily-main-normal-v1": { primary: 0.22, secondary: 0.5, tertiary: 0.17, lengthBias: 1 },
  "curve-control-v1": { primary: 0.27, secondary: 0.58, tertiary: 0.22, lengthBias: 1 },
  "precision-focus-v1": { primary: 0.18, secondary: 0.72, tertiary: 0.42, lengthBias: 0.98 },
};

function shouldUseCrossingHardPath(generatorProfileId: GeneratorProfileId, lineDifficulty: LineDifficultyId): boolean {
  return lineDifficulty === "hard" && generatorProfileId !== "gentle-warmup-v1";
}

function softenPolyline(points: Point[], viewport: Viewport, margin: number, passes: number): Point[] {
  let softened = points;

  for (let pass = 0; pass < passes; pass += 1) {
    softened = softened.map((point, index) => {
      if (index === 0 || index === softened.length - 1) return point;

      const previous = softened[index - 1];
      const next = softened[index + 1];

      return {
        x: clamp(previous.x * 0.22 + point.x * 0.56 + next.x * 0.22, margin, viewport.width - margin),
        y: clamp(previous.y * 0.22 + point.y * 0.56 + next.y * 0.22, margin, viewport.height - margin),
      };
    });
  }

  return softened;
}

function fitYToSafeBand(points: Point[], viewport: Viewport, margin: number): Point[] {
  if (points.length === 0) return points;

  const padding = Math.max(6, Math.min(viewport.width, viewport.height) * 0.018);
  const minY = margin + padding;
  const maxY = viewport.height - margin - padding;
  const bandHeight = Math.max(1, maxY - minY);
  const values = points.map((point) => point.y);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawCenter = (rawMin + rawMax) / 2;
  const rawHeight = Math.max(1, rawMax - rawMin);
  const scale = Math.min(1, bandHeight / rawHeight);
  const scaledMin = rawCenter + (rawMin - rawCenter) * scale;
  const scaledMax = rawCenter + (rawMax - rawCenter) * scale;
  const shift =
    scaledMin < minY
      ? minY - scaledMin
      : scaledMax > maxY
        ? maxY - scaledMax
        : 0;

  return points.map((point) => ({
    ...point,
    y: clamp(rawCenter + (point.y - rawCenter) * scale + shift, minY, maxY),
  }));
}

function fitToSafeBox(points: Point[], viewport: Viewport, margin: number): Point[] {
  if (points.length === 0) return points;

  const padding = Math.max(6, Math.min(viewport.width, viewport.height) * 0.018);
  const minX = margin + padding;
  const maxX = viewport.width - margin - padding;
  const minY = margin + padding;
  const maxY = viewport.height - margin - padding;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const rawMinX = Math.min(...xs);
  const rawMaxX = Math.max(...xs);
  const rawMinY = Math.min(...ys);
  const rawMaxY = Math.max(...ys);
  const rawCenterX = (rawMinX + rawMaxX) / 2;
  const rawCenterY = (rawMinY + rawMaxY) / 2;
  const scale = Math.min(1, width / Math.max(1, rawMaxX - rawMinX), height / Math.max(1, rawMaxY - rawMinY));
  const scaledMinX = rawCenterX + (rawMinX - rawCenterX) * scale;
  const scaledMaxX = rawCenterX + (rawMaxX - rawCenterX) * scale;
  const scaledMinY = rawCenterY + (rawMinY - rawCenterY) * scale;
  const scaledMaxY = rawCenterY + (rawMaxY - rawCenterY) * scale;
  const shiftX = scaledMinX < minX ? minX - scaledMinX : scaledMaxX > maxX ? maxX - scaledMaxX : 0;
  const shiftY = scaledMinY < minY ? minY - scaledMinY : scaledMaxY > maxY ? maxY - scaledMaxY : 0;

  return points.map((point) => ({
    x: clamp(rawCenterX + (point.x - rawCenterX) * scale + shiftX, minX, maxX),
    y: clamp(rawCenterY + (point.y - rawCenterY) * scale + shiftY, minY, maxY),
  }));
}

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
    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) minRadius = Math.min(minRadius, (ab * bc * ca) / (2 * doubleArea));
  }

  return minRadius;
}

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
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
        y: margin + height * (0.08 + rng() * 0.84),
      };
    }

    return {
      x: margin + width * (0.08 + rng() * 0.84),
      y: edge === "top" ? margin : viewport.height - margin,
    };
  };

  return { start: pointOnEdge(startEdge), end: pointOnEdge(endEdge), axis: horizontal ? "horizontal" : "vertical" };
}

function applyEndpointAnchors(points: Point[], start: Point, end: Point): Point[] {
  if (points.length <= 1) return points;

  const first = points[0];
  const last = points[points.length - 1];
  const startDelta = { x: start.x - first.x, y: start.y - first.y };
  const endDelta = { x: end.x - last.x, y: end.y - last.y };

  return points.map((point, index) => {
    const t = index / (points.length - 1);
    const startWeight = 1 - smoothStep(clamp(t / 0.42, 0, 1));
    const endWeight = smoothStep(clamp((t - 0.58) / 0.42, 0, 1));

    return {
      x: point.x + startDelta.x * startWeight + endDelta.x * endWeight,
      y: point.y + startDelta.y * startWeight + endDelta.y * endWeight,
    };
  });
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

function finalizeBoundaryPath(points: Point[], viewport: Viewport, margin: number, start: Point, end: Point): Point[] {
  if (points.length <= 1) return points;

  const interiorMargin = margin + Math.max(4, Math.min(viewport.width, viewport.height) * 0.012);
  const fitted = fitToSafeBox(points, viewport, margin);
  const anchored = applyEndpointAnchors(fitted, start, end);
  const clamped = anchored.map((point, index) => {
    if (index === 0) return start;
    if (index === anchored.length - 1) return end;

    return {
      x: clamp(point.x, margin, viewport.width - margin),
      y: clamp(point.y, interiorMargin, viewport.height - interiorMargin),
    };
  });
  const guardCount = Math.min(Math.max(6, Math.round(clamped.length * 0.045)), Math.floor((clamped.length - 1) / 3));
  const ramped = clamped.map((point) => ({ ...point }));

  if (guardCount > 1) {
    const startTarget = clamped[guardCount];
    const endTarget = clamped[clamped.length - 1 - guardCount];

    for (let index = 0; index <= guardCount; index += 1) {
      const t = index / guardCount;
      const endIndex = clamped.length - 1 - index;

      ramped[index] = {
        x: lerp(start.x, startTarget.x, t),
        y: lerp(start.y, startTarget.y, t),
      };
      ramped[endIndex] = {
        x: lerp(end.x, endTarget.x, t),
        y: lerp(end.y, endTarget.y, t),
      };
    }
  }

  const smoothed = softenPolyline(ramped, viewport, margin, 2);

  return smoothed.map((point, index) => {
    if (index === 0) return start;
    if (index === smoothed.length - 1) return end;

    return {
      x: clamp(point.x, margin, viewport.width - margin),
      y: clamp(point.y, interiorMargin, viewport.height - interiorMargin),
    };
  });
}

function addSmoothLengthWiggle(
  rng: () => number,
  points: Point[],
  viewport: Viewport,
  margin: number,
  targetNormalizedLength: number,
): Point[] {
  const currentLength = normalizedLength(points, viewport);
  if (currentLength >= targetNormalizedLength * 0.96 || points.length < 4) return points;

  const phase = rng() * Math.PI * 2;
  const frequency = Math.max(4, Math.min(22, targetNormalizedLength * 3.8 + rng() * 2));
  const maxAmplitude = Math.min(viewport.width, viewport.height) * 0.18;
  let best: { points: Point[]; delta: number } | null = null;
  let low = 0;
  let high = maxAmplitude;

  const create = (amplitude: number): Point[] => points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;

    const previous = points[index - 1];
    const next = points[index + 1];
    const tangent = { x: next.x - previous.x, y: next.y - previous.y };
    const tangentLength = Math.max(1, Math.hypot(tangent.x, tangent.y));
    const normal = { x: -tangent.y / tangentLength, y: tangent.x / tangentLength };
    const t = index / (points.length - 1);
    const edgeEase = Math.sin(t * Math.PI);
    const offset = Math.sin(t * Math.PI * frequency + phase) * amplitude * edgeEase;

    return {
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset,
    };
  });

  for (let pass = 0; pass < 14; pass += 1) {
    const amplitude = (low + high) / 2;
    const candidate = create(amplitude);
    const inside = allInsideSafeBox(candidate, viewport, margin);
    const length = normalizedLength(candidate, viewport);
    const delta = Math.abs(length - targetNormalizedLength);

    if (inside && (!best || delta < best.delta)) best = { points: candidate, delta };
    if (!inside || length > targetNormalizedLength) high = amplitude;
    else low = amplitude;
  }

  return best?.points ?? points;
}

const overlapShapeCandidates: Record<OverlapDifficultyId, Array<{ xFrequency: number; yFrequency: number; spanMultiplier: number }>> = {
  light: [
    { xFrequency: 0, yFrequency: 0, spanMultiplier: 1 },
  ],
  normal: [
    { xFrequency: 1, yFrequency: 2, spanMultiplier: 1 },
    { xFrequency: 1, yFrequency: 2, spanMultiplier: 1.25 },
  ],
  complex: [
    { xFrequency: 1, yFrequency: 3, spanMultiplier: 1 },
    { xFrequency: 1, yFrequency: 2, spanMultiplier: 1.5 },
  ],
  hard: [
    { xFrequency: 5, yFrequency: 14, spanMultiplier: 1 },
    { xFrequency: 6, yFrequency: 17, spanMultiplier: 1 },
    { xFrequency: 4, yFrequency: 11, spanMultiplier: 1 },
    { xFrequency: 3, yFrequency: 10, spanMultiplier: 1 },
    { xFrequency: 1, yFrequency: 4, spanMultiplier: 1.08 },
    { xFrequency: 1, yFrequency: 5, spanMultiplier: 1.04 },
    { xFrequency: 1, yFrequency: 3, spanMultiplier: 1.5 },
  ],
  master: [
    { xFrequency: 8, yFrequency: 23, spanMultiplier: 1 },
    { xFrequency: 7, yFrequency: 20, spanMultiplier: 1 },
    { xFrequency: 6, yFrequency: 17, spanMultiplier: 1 },
    { xFrequency: 4, yFrequency: 13, spanMultiplier: 1 },
    { xFrequency: 3, yFrequency: 10, spanMultiplier: 1 },
    { xFrequency: 2, yFrequency: 7, spanMultiplier: 1 },
    { xFrequency: 1, yFrequency: 5, spanMultiplier: 1.25 },
    { xFrequency: 1, yFrequency: 7, spanMultiplier: 1 },
  ],
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

function normalizedLength(points: Point[], viewport: Viewport): number {
  return polylineLength(points) / Math.max(1, Math.min(viewport.width, viewport.height));
}

function sampleOpenBoundaryCurve(
  rng: () => number,
  viewport: Viewport,
  margin: number,
  sampleCount: number,
  endpoints: EndpointPair,
  courseLengthId: CourseLengthId,
): Point[] {
  const course = COURSE_LENGTHS[courseLengthId];
  const { start, end, axis } = endpoints;
  const frequency = Math.max(2.8, Math.min(32, course.targetNormalizedLength * 5.2));
  const phase = (rng() - 0.5) * Math.PI * 0.22;
  const secondaryPhase = rng() * Math.PI * 2;
  const maxAmplitude = Math.min(viewport.width, viewport.height) * 0.46;
  let best: { points: Point[]; delta: number } | null = null;
  let low = 0;
  let high = maxAmplitude;

  const create = (amplitude: number): Point[] => Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const edgeEase = Math.sin(t * Math.PI);
    const wave =
      Math.sin(t * Math.PI * frequency + phase) * amplitude +
      Math.sin(t * Math.PI * frequency * 0.5 + secondaryPhase) * amplitude * 0.18;
    const offset = wave * edgeEase;

    if (axis === "horizontal") {
      return {
        x: lerp(start.x, end.x, t),
        y: lerp(start.y, end.y, t) + offset,
      };
    }

    return {
      x: lerp(start.x, end.x, t) + offset,
      y: lerp(start.y, end.y, t),
    };
  });

  for (let pass = 0; pass < 18; pass += 1) {
    const amplitude = (low + high) / 2;
    const points = create(amplitude);
    const inside = allInsideSafeBox(points, viewport, margin);
    const length = normalizedLength(points, viewport);
    const delta = Math.abs(length - course.targetNormalizedLength);

    if (inside && (!best || delta < best.delta)) best = { points, delta };
    if (!inside || length > course.targetNormalizedLength) high = amplitude;
    else low = amplitude;
  }

  return finalizeBoundaryPath(best?.points ?? create(0), viewport, margin, start, end);
}

function sampleContinuousFormula(
  rng: () => number,
  viewport: Viewport,
  margin: number,
  sampleCount: number,
  shape: { xFrequency: number; yFrequency: number; spanMultiplier: number },
  scale: number,
  start: Point,
  end: Point,
  targetNormalizedLength: number,
): Point[] {
  const width = Math.max(1, viewport.width - margin * 2);
  const height = Math.max(1, viewport.height - margin * 2);
  const center = { x: viewport.width / 2, y: viewport.height / 2 };
  const phaseX = 0;
  const phaseY = 0;
  const phaseDrift = (rng() - 0.5) * Math.PI * 0.35;
  const direction = 1;
  const drift = width * (0.018 + rng() * 0.028);
  const ampX = width * (0.36 + rng() * 0.06) * scale;
  const ampY = height * (0.34 + rng() * 0.07) * scale;
  const tilt = (rng() - 0.5) * 0.24;
  const span = Math.PI * 2 * shape.spanMultiplier * (0.985 + rng() * 0.03);

  const points = Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const theta = (t - 0.25) * span;
    const centeredT = t - 0.5;
    const waveX = Math.sin(shape.xFrequency * theta + phaseX);
    const waveY = Math.sin(shape.yFrequency * theta * direction + phaseY);
    const slowBreath = Math.sin(theta * 0.5 + phaseDrift) * 0.08;

    return {
      x: center.x + waveX * ampX + centeredT * drift,
      y: center.y + waveY * ampY + centeredT * width * tilt + slowBreath * ampY,
    };
  });

  const anchored = finalizeBoundaryPath(points, viewport, margin, start, end);
  return finalizeBoundaryPath(addSmoothLengthWiggle(rng, anchored, viewport, margin, targetNormalizedLength), viewport, margin, start, end);
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

  if (overlapDifficultyId === "light") {
    return sampleOpenBoundaryCurve(rng, viewport, margin, course.sampleCount, endpoints, courseLengthId);
  }

  const shapes = overlapShapeCandidates[overlapDifficultyId];
  const shape = shapes[attemptIndex % shapes.length] ?? shapes[0];
  const target = course.targetNormalizedLength;
  let best: { points: Point[]; delta: number } | null = null;
  let low = 0.12;
  let high = 1.24;

  for (let pass = 0; pass < 14; pass += 1) {
    const scale = (low + high) / 2;
    const points = sampleContinuousFormula(rng, viewport, margin, course.sampleCount, shape, scale, endpoints.start, endpoints.end, target);
    const length = normalizedLength(points, viewport);
    const delta = Math.abs(length - target);

    if (!best || delta < best.delta) best = { points, delta };
    if (length < target) low = scale;
    else high = scale;
  }

  return best?.points ?? sampleContinuousFormula(rng, viewport, margin, course.sampleCount, shape, 0.58, endpoints.start, endpoints.end, target);
}

function createHardCrossingCurve(
  rng: () => number,
  viewport: Viewport,
  start: Point,
  end: Point,
  margin: number,
  width: number,
  height: number,
  generatorProfileId: GeneratorProfileId,
  sampleCount: number,
): Point[] {
  const direction = rng() > 0.5 ? 1 : -1;
  const centerX = margin + width * (0.48 + (rng() - 0.5) * 0.12);
  const isCurve = generatorProfileId === "curve-control-v1";
  const isPrecision = generatorProfileId === "precision-focus-v1";
  const radiusX = width * (isCurve ? 0.22 + rng() * 0.03 : isPrecision ? 0.18 + rng() * 0.025 : 0.16 + rng() * 0.025);
  const radiusY = height * (isCurve ? 0.2 + rng() * 0.03 : isPrecision ? 0.15 + rng() * 0.025 : 0.13 + rng() * 0.02);
  const leadCount = Math.max(18, Math.round(sampleCount * (isCurve ? 0.16 : 0.18)));
  const exitCount = Math.max(18, Math.round(sampleCount * (isPrecision ? 0.2 : 0.18)));
  const loopCount = Math.max(72, sampleCount - leadCount - exitCount);
  const loopYScale = isCurve ? 2.05 : isPrecision ? 1.72 : 1.86;
  const loopYOffset = radiusY * loopYScale * 0.5;
  const yPadding = Math.max(6, Math.min(viewport.width, viewport.height) * 0.018);
  const minCenterY = margin + yPadding + loopYOffset;
  const maxCenterY = viewport.height - margin - yPadding - loopYOffset;
  const centerY = clamp(margin + height * (0.36 + rng() * 0.28), minCenterY, maxCenterY);
  const thetaStart = Math.PI * 0.16;
  const thetaEnd = Math.PI * 1.84;
  const loopPoint = (theta: number): Point => ({
    x: clamp(centerX + Math.cos(theta) * radiusX, margin, viewport.width - margin),
    y: centerY + direction * Math.sin(theta) * Math.cos(theta) * radiusY * loopYScale,
  });
  const loopStart = loopPoint(thetaStart);
  const loopEnd = loopPoint(thetaEnd);
  const bridge = (from: Point, to: Point, t: number): Point => {
    const easedT = smoothStep(t);

    return {
      x: clamp(lerp(from.x, to.x, easedT), margin, viewport.width - margin),
      y: clamp(lerp(from.y, to.y, easedT), margin, viewport.height - margin),
    };
  };
  const lead = Array.from({ length: leadCount }, (_, index) => bridge(start, loopStart, index / leadCount));
  const loop = Array.from({ length: loopCount }, (_, index) => {
    const theta = lerp(thetaStart, thetaEnd, index / (loopCount - 1));

    return loopPoint(theta);
  });
  const exit = Array.from({ length: exitCount }, (_, index) => bridge(loopEnd, end, (index + 1) / exitCount));

  return softenPolyline(fitYToSafeBand([...lead, ...loop, ...exit], viewport, margin), viewport, margin, isPrecision ? 5 : 4);
}

function createSampledCurve(
  seed: string,
  viewport: Viewport,
  attemptIndex: number,
  generatorProfileId: GeneratorProfileId,
  lineDifficulty: LineDifficultyId,
  courseLengthId: CourseLengthId,
  overlapDifficultyId: OverlapDifficultyId,
  fallback = false,
): Point[] {
  if (!fallback) return createContinuousCurve(seed, viewport, attemptIndex, courseLengthId, overlapDifficultyId);

  const rng = createRng(`${seed}:${attemptIndex}:${fallback ? "fallback" : "candidate"}`);
  const margin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(viewport.width, viewport.height) * 0.18));
  const width = Math.max(1, viewport.width - margin * 2);
  const height = Math.max(1, viewport.height - margin * 2);
  const profile = profileSettings[generatorProfileId];
  const shape = LINE_DIFFICULTIES[lineDifficulty];
  const sampleCount = shape.sampleCount;

  const start: Point = {
    x: margin,
    y: margin + rng() * height,
  };
  const end: Point = {
    x: Math.min(viewport.width - margin, margin + width * profile.lengthBias),
    y: margin + rng() * height,
  };

  if (shouldUseCrossingHardPath(generatorProfileId, lineDifficulty)) {
    return createHardCrossingCurve(rng, viewport, start, end, margin, width, height, generatorProfileId, sampleCount);
  }

  const phase = rng() * Math.PI * 2;
  const amplitude = (fallback ? height * 0.2 : height * (profile.primary + rng() * 0.09)) * shape.amplitudeMultiplier;
  const secondaryAmplitude = amplitude * (fallback ? 0.18 : profile.secondary * shape.secondaryMultiplier);
  const tertiaryAmplitude = amplitude * profile.tertiary * shape.tertiaryMultiplier;
  const quaternaryAmplitude = amplitude * 0.2 * shape.quaternaryMultiplier;
  const bend = rng() > 0.5 ? 1 : -1;
  const secondaryPhase = rng() * Math.PI * 2;
  const tertiaryPhase = rng() * Math.PI * 2;
  const quaternaryPhase = rng() * Math.PI * 2;

  const points = Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const x = lerp(start.x, end.x, t);
    const baseY = lerp(start.y, end.y, t);
    const wave =
      Math.sin(t * Math.PI * 2 + phase) * amplitude * bend +
      Math.sin(t * Math.PI * 4 + secondaryPhase) * secondaryAmplitude +
      Math.sin(t * Math.PI * 6 + tertiaryPhase) * tertiaryAmplitude +
      Math.sin(t * Math.PI * 8 + quaternaryPhase) * quaternaryAmplitude;
    const edgeEase = Math.sin(t * Math.PI);

    return {
      x,
      y: baseY + wave * edgeEase,
    };
  });

  return fitYToSafeBand(points, viewport, margin);
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
    const score = missingOverlap * 100 + lengthMiss * 12 + smoothMiss * 24 + Math.abs(length - course.targetNormalizedLength);

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
