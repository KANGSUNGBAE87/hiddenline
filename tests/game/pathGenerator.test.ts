import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS, OVERLAP_SHAPE_PROFILES, PATH_LENGTH_RANGES_PX } from "../../src/game/config";
import { createDailyContext } from "../../src/game/daily";
import { generatePath } from "../../src/game/pathGenerator";
import { hasSelfIntersection } from "../../src/game/pathGeometry";
import type { CourseLengthId, OverlapDifficultyId, Point } from "../../src/game/types";

const viewport = { width: 390, height: 560 };
const playViewport = { width: 390, height: 740 };

const COURSES: CourseLengthId[] = ["short", "basic", "long", "longRun", "marathon"];
const OVERLAPS: OverlapDifficultyId[] = ["light", "normal", "complex", "hard", "master"];

function checksumPoints(points: Point[]): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join("|");
}

function safeMargin(targetViewport = viewport): number {
  return Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(targetViewport.width, targetViewport.height) * 0.18));
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const orientation = (p: Point, q: Point, r: Point) => (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function countSelfIntersections(points: Point[]): number {
  let count = 0;
  for (let first = 0; first < points.length - 1; first += 1) {
    for (let second = first + 2; second < points.length - 1; second += 1) {
      if (first === 0 && second === points.length - 2) continue;
      if (segmentsIntersect(points[first], points[first + 1], points[second], points[second + 1])) count += 1;
    }
  }
  return count;
}

function minTurnRadius(points: Point[]): number {
  let radius = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length - 1; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const c = points[index + 1];
    const ab = Math.hypot(a.x - b.x, a.y - b.y);
    const bc = Math.hypot(b.x - c.x, b.y - c.y);
    if (ab < 0.8 || bc < 0.8) continue;
    const ca = Math.hypot(c.x - a.x, c.y - a.y);
    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) radius = Math.min(radius, (ab * bc * ca) / (2 * doubleArea));
  }
  return radius;
}

function minNonAdjacentClearance(points: Point[], exclusion: number): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + exclusion; j < points.length; j += 1) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (d < min) min = d;
    }
  }
  return min;
}

function maxHeadingChangeOverDistance(points: Point[], distancePx: number): number {
  let maxDelta = 0;
  for (let start = 1; start < points.length - 1; start += 1) {
    let end = start;
    while (end < points.length - 1) {
      const traveled = Math.hypot(points[end].x - points[start].x, points[end].y - points[start].y);
      if (traveled >= distancePx) break;
      end += 1;
    }
    if (end >= points.length - 1) break;
    const first = Math.atan2(points[start].y - points[start - 1].y, points[start].x - points[start - 1].x);
    const second = Math.atan2(points[end + 1].y - points[end].y, points[end + 1].x - points[end].x);
    const delta = Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)));
    maxDelta = Math.max(maxDelta, delta);
  }
  return maxDelta;
}

function maxSegmentLength(points: Point[]): number {
  let max = 0;
  for (let index = 1; index < points.length; index += 1) max = Math.max(max, Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  return max;
}

function isNearSafeBoundary(point: Point, targetViewport = viewport): boolean {
  const margin = safeMargin(targetViewport);
  const band = 20;
  return (
    Math.abs(point.x - margin) <= band ||
    Math.abs(point.x - (targetViewport.width - margin)) <= band ||
    Math.abs(point.y - margin) <= band ||
    Math.abs(point.y - (targetViewport.height - margin)) <= band
  );
}

function hasOppositeBoundaryAxis(start: Point, end: Point, targetViewport = viewport): boolean {
  const margin = safeMargin(targetViewport);
  const band = 24;
  const sl = Math.abs(start.x - margin) <= band;
  const sr = Math.abs(start.x - (targetViewport.width - margin)) <= band;
  const st = Math.abs(start.y - margin) <= band;
  const sb = Math.abs(start.y - (targetViewport.height - margin)) <= band;
  const el = Math.abs(end.x - margin) <= band;
  const er = Math.abs(end.x - (targetViewport.width - margin)) <= band;
  const et = Math.abs(end.y - margin) <= band;
  const eb = Math.abs(end.y - (targetViewport.height - margin)) <= band;
  return (sl && er) || (sr && el) || (st && eb) || (sb && et);
}

function generate(seed: string, courseLengthId: CourseLengthId, overlapDifficultyId: OverlapDifficultyId, targetViewport = playViewport) {
  const daily = createDailyContext(new Date(2026, 5, 24));
  return generatePath({ ...daily, seed, courseLengthId, overlapDifficultyId, visibilityLevel: "normal", viewport: targetViewport });
}

describe("self-avoiding curvature generator", () => {
  test("uses the self-avoiding-curvature-v4 curve, not a serpentine template", () => {
    const path = generate("hiddenline-kind", "basic", "complex");
    expect(path.curve?.kind).toBe("self-avoiding-curvature-v4");
    expect(path.curve?.seed).toBe(path.seed);
    expect(path.curve?.start).toEqual({ x: path.start.x, y: path.start.y });
    expect(path.curve?.end).toEqual({ x: path.end.x, y: path.end.y });
    expect(path.curve?.sampleSpacingPx).toBe(3.5);
  });

  test("same seed and settings produce an identical path", () => {
    const first = generate("hiddenline-determinism", "long", "hard");
    const second = generate("hiddenline-determinism", "long", "hard");
    expect(first.points).toEqual(second.points);
    expect(checksumPoints(first.points)).toBe(checksumPoints(second.points));
  });

  test("different seeds produce structurally different paths", () => {
    const a = generate("hiddenline-seed-a", "long", "complex");
    const b = generate("hiddenline-seed-b", "long", "complex");
    expect(checksumPoints(a.points)).not.toBe(checksumPoints(b.points));
    expect(a.start).not.toEqual(b.start);
  });

  test("start and end are deterministic, near opposite safe edges, and far apart", () => {
    const diagonal = Math.hypot(playViewport.width, playViewport.height);
    for (const courseLengthId of COURSES) {
      const path = generate(`hiddenline-endpoints:${courseLengthId}`, courseLengthId, "normal");
      expect(isNearSafeBoundary(path.start, playViewport), `${courseLengthId}/start`).toBe(true);
      expect(isNearSafeBoundary(path.end, playViewport), `${courseLengthId}/end`).toBe(true);
      expect(hasOppositeBoundaryAxis(path.start, path.end, playViewport), `${courseLengthId}/opposite`).toBe(true);
      expect(Math.hypot(path.start.x - path.end.x, path.start.y - path.end.y), `${courseLengthId}/separation`).toBeGreaterThanOrEqual(diagonal * 0.4);
    }
  });

  test("paths never self-intersect across every course and overlap setting", () => {
    for (const courseLengthId of COURSES) {
      for (const overlapDifficultyId of OVERLAPS) {
        const path = generate(`hiddenline-cross:${courseLengthId}:${overlapDifficultyId}`, courseLengthId, overlapDifficultyId);
        expect(path.selfIntersectionCount, `${courseLengthId}/${overlapDifficultyId}`).toBe(0);
        expect(countSelfIntersections(path.points), `${courseLengthId}/${overlapDifficultyId}`).toBe(0);
        expect(hasSelfIntersection(path.points), `${courseLengthId}/${overlapDifficultyId}`).toBe(false);
      }
    }
  });

  test("arcs stay large (no small circles) per overlap profile", () => {
    for (const overlapDifficultyId of OVERLAPS) {
      const target = OVERLAP_SHAPE_PROFILES[overlapDifficultyId].minTurnRadiusPx;
      const path = generate(`hiddenline-radius:${overlapDifficultyId}`, "marathon", overlapDifficultyId);
      expect(minTurnRadius(path.points), overlapDifficultyId).toBeGreaterThanOrEqual(target * 0.8);
    }
  });

  test("non-adjacent passes keep the overlap profile clearance", () => {
    for (const overlapDifficultyId of OVERLAPS) {
      const clearance = OVERLAP_SHAPE_PROFILES[overlapDifficultyId].selfClearancePx;
      const exclusion = Math.ceil((clearance * 1.7) / 3.5);
      const path = generate(`hiddenline-clearance:${overlapDifficultyId}`, "marathon", overlapDifficultyId);
      expect(minNonAdjacentClearance(path.points, exclusion), overlapDifficultyId).toBeGreaterThanOrEqual(clearance * 0.82);
    }
  });

  test("curve is smooth: uniform spacing and no micro-wiggle", () => {
    for (const overlapDifficultyId of OVERLAPS) {
      const path = generate(`hiddenline-smooth:${overlapDifficultyId}`, "longRun", overlapDifficultyId);
      expect(maxSegmentLength(path.points), overlapDifficultyId).toBeLessThanOrEqual(4.5);
      expect(maxHeadingChangeOverDistance(path.points, 32), overlapDifficultyId).toBeLessThan(Math.PI / 4);
    }
  });

  test("length never exceeds the 2000px ceiling and lands in the course range", () => {
    for (const courseLengthId of COURSES) {
      const range = PATH_LENGTH_RANGES_PX[courseLengthId];
      const path = generate(`hiddenline-length:${courseLengthId}`, courseLengthId, "normal");
      expect(path.totalLength, courseLengthId).toBeLessThanOrEqual(2000);
      expect(path.totalLength, courseLengthId).toBeGreaterThanOrEqual(range.min);
      expect(path.totalLength, courseLengthId).toBeLessThanOrEqual(range.max);
      expect(path.usedFallback, courseLengthId).toBe(false);
    }
  });

  test("longer courses are longer on average", () => {
    const average = (courseLengthId: CourseLengthId): number => {
      let sum = 0;
      const seeds = 8;
      for (let s = 0; s < seeds; s += 1) sum += generate(`hiddenline-order:${courseLengthId}:${s}`, courseLengthId, "normal").totalLength;
      return sum / seeds;
    };
    expect(average("basic")).toBeGreaterThan(average("short"));
    expect(average("marathon")).toBeGreaterThan(average("basic"));
  });

  test("all points stay inside the safe margin", () => {
    const margin = safeMargin(playViewport);
    for (const overlapDifficultyId of OVERLAPS) {
      const path = generate(`hiddenline-margin:${overlapDifficultyId}`, "marathon", overlapDifficultyId);
      for (const point of path.points) {
        expect(point.x).toBeGreaterThanOrEqual(margin - 0.01);
        expect(point.x).toBeLessThanOrEqual(playViewport.width - margin + 0.01);
        expect(point.y).toBeGreaterThanOrEqual(margin - 0.01);
        expect(point.y).toBeLessThanOrEqual(playViewport.height - margin + 0.01);
      }
    }
  });

  test("progressT is monotonic with positive length", () => {
    const path = generate("hiddenline-progress", "long", "complex");
    expect(path.points[0]?.t).toBe(0);
    expect(path.points.at(-1)?.t).toBe(1);
    expect(path.totalLength).toBeGreaterThan(0);
    for (let index = 1; index < path.points.length; index += 1) {
      expect(path.points[index].t).toBeGreaterThanOrEqual(path.points[index - 1].t);
      expect(path.points[index].distance).toBeGreaterThanOrEqual(path.points[index - 1].distance);
    }
  });

  test("visibility level changes reveal/fail rules without changing the line shape", () => {
    const base = { ...createDailyContext(new Date(2026, 5, 24)), seed: "hiddenline-visibility", courseLengthId: "basic" as const, overlapDifficultyId: "complex" as const, viewport };
    const easy = generatePath({ ...base, visibilityLevel: "easy" });
    const normal = generatePath({ ...base, visibilityLevel: "normal" });
    const hard = generatePath({ ...base, visibilityLevel: "hard" });
    expect(easy.points).toEqual(normal.points);
    expect(normal.points).toEqual(hard.points);
    expect(easy.rules.revealRadiusPx).toBeGreaterThan(normal.rules.revealRadiusPx);
    expect(normal.rules.revealRadiusPx).toBeGreaterThan(hard.rules.revealRadiusPx);
  });

  test("legacy line types still map to a course and stay valid", () => {
    const daily = createDailyContext(new Date(2026, 5, 24));
    const warmup = generatePath({ ...daily, seed: "hiddenline-legacy-warmup", lineType: "warmup", generatorProfileId: "gentle-warmup-v1", viewport: playViewport });
    const precision = generatePath({ ...daily, seed: "hiddenline-legacy-precision", lineType: "precision", generatorProfileId: "precision-focus-v1", viewport: playViewport });
    expect(warmup.courseLengthId).toBe("short");
    expect(precision.courseLengthId).toBe("marathon");
    expect(countSelfIntersections(warmup.points)).toBe(0);
    expect(countSelfIntersections(precision.points)).toBe(0);
  });

  test("bulk: every course/overlap combo yields a valid, non-crossing curve", () => {
    let total = 0;
    let crossing = 0;
    for (const courseLengthId of COURSES) {
      for (const overlapDifficultyId of OVERLAPS) {
        for (let s = 0; s < 6; s += 1) {
          const path = generate(`hiddenline-bulk:${courseLengthId}:${overlapDifficultyId}:${s}`, courseLengthId, overlapDifficultyId);
          total += 1;
          if (path.selfIntersectionCount !== 0) crossing += 1;
          expect(path.totalLength).toBeLessThanOrEqual(2000);
          expect(path.usedFallback).toBe(false);
        }
      }
    }
    expect(crossing).toBe(0);
    expect(total).toBe(150);
  });
});
