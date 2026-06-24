import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS, ORGANIC_CURVE_PROFILES } from "../../src/game/config";
import { createDailyContext } from "../../src/game/daily";
import { generatePath } from "../../src/game/pathGenerator";
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

function maxInstantHeadingDelta(points: Point[]): number {
  let maxDelta = 0;
  for (let index = 2; index < points.length; index += 1) {
    const previous = Math.atan2(points[index - 1].y - points[index - 2].y, points[index - 1].x - points[index - 2].x);
    const next = Math.atan2(points[index].y - points[index - 1].y, points[index].x - points[index - 1].x);
    const delta = Math.abs(Math.atan2(Math.sin(next - previous), Math.cos(next - previous)));
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
  const band = 22;
  return (
    Math.abs(point.x - margin) <= band ||
    Math.abs(point.x - (targetViewport.width - margin)) <= band ||
    Math.abs(point.y - margin) <= band ||
    Math.abs(point.y - (targetViewport.height - margin)) <= band
  );
}

function hasOppositeBoundaryAxis(start: Point, end: Point, targetViewport = viewport): boolean {
  const margin = safeMargin(targetViewport);
  const band = 28;
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

describe("organic spline path generator", () => {
  test("uses a single continuous organic spline definition, not the self-avoiding meander", () => {
    const path = generate("hiddenline-kind", "basic", "complex");
    expect(path.curve?.kind).toBe("organic-spline-v5");
    expect(path.curve?.seed).toBe(path.seed);
    expect(path.curve?.start).toEqual({ x: path.start.x, y: path.start.y });
    expect(path.curve?.end).toEqual({ x: path.end.x, y: path.end.y });
    expect(path.curve?.sampleSpacingPx).toBe(3.5);
    expect(path.curve?.construction).toBe("seeded-anchor-walk-chaikin-smooth");
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
      expect(Math.hypot(path.start.x - path.end.x, path.start.y - path.end.y), `${courseLengthId}/separation`).toBeGreaterThanOrEqual(diagonal * 0.32);
    }
  });

  test("all points stay inside the safe margin", () => {
    const margin = safeMargin(playViewport);
    for (const courseLengthId of COURSES) {
      for (const overlapDifficultyId of OVERLAPS) {
        const path = generate(`hiddenline-margin:${courseLengthId}:${overlapDifficultyId}`, courseLengthId, overlapDifficultyId);
        for (const point of path.points) {
          expect(point.x, `${courseLengthId}/${overlapDifficultyId}/x`).toBeGreaterThanOrEqual(margin - 0.01);
          expect(point.x, `${courseLengthId}/${overlapDifficultyId}/x`).toBeLessThanOrEqual(playViewport.width - margin + 0.01);
          expect(point.y, `${courseLengthId}/${overlapDifficultyId}/y`).toBeGreaterThanOrEqual(margin - 0.01);
          expect(point.y, `${courseLengthId}/${overlapDifficultyId}/y`).toBeLessThanOrEqual(playViewport.height - margin + 0.01);
        }
      }
    }
  });

  test("curve is smooth: uniform spacing and no visible corner joins", () => {
    for (const courseLengthId of COURSES) {
      const profile = ORGANIC_CURVE_PROFILES[courseLengthId];
      const path = generate(`hiddenline-smooth:${courseLengthId}`, courseLengthId, "complex");
      expect(maxSegmentLength(path.points), courseLengthId).toBeLessThanOrEqual(4.6);
      expect(minTurnRadius(path.points), courseLengthId).toBeGreaterThanOrEqual(profile.minTurnRadiusPx * 0.68);
      expect(maxInstantHeadingDelta(path.points), courseLengthId).toBeLessThan(0.42);
    }
  });

  test("course stages become longer in order on average", () => {
    const averageLength = (courseLengthId: CourseLengthId): number => {
      let length = 0;
      const seeds = 10;
      for (let s = 0; s < seeds; s += 1) {
        const path = generate(`hiddenline-order:${courseLengthId}:${s}`, courseLengthId, "complex");
        length += path.totalLength;
      }
      return length / seeds;
    };

    const measured = COURSES.map(averageLength);
    for (let index = 1; index < measured.length; index += 1) {
      expect(measured[index], `${COURSES[index]}/length`).toBeGreaterThan(measured[index - 1] * 1.06);
    }
  });

  test("harder stages may cross naturally, but crossings are measured rather than forced", () => {
    const easy = generate("hiddenline-crossing-easy", "short", "light");
    const expert = generate("hiddenline-crossing-expert", "marathon", "master");
    expect(easy.selfIntersectionCount).toBe(countSelfIntersections(easy.points));
    expect(expert.selfIntersectionCount).toBe(countSelfIntersections(expert.points));
    expect(expert.totalLength).toBeGreaterThan(easy.totalLength * 1.45);
    expect(expert.complexityScore).toBeGreaterThan(easy.complexityScore);
  });

  test("natural crossings are not fixed per course template", () => {
    const crossingCounts = new Set<number>();
    const signatures = new Set<string>();
    for (let seedIndex = 0; seedIndex < 10; seedIndex += 1) {
      const path = generate(`hiddenline-natural-topology:${seedIndex}`, "marathon", "master");
      crossingCounts.add(path.selfIntersectionCount);
      signatures.add(`${path.selfIntersectionCount}:${path.curve?.occupancy.widthRatio.toFixed(2)}:${path.curve?.occupancy.heightRatio.toFixed(2)}:${Math.round(path.totalLength / 50)}`);
    }

    expect(crossingCounts.size).toBeGreaterThan(1);
    expect(signatures.size).toBeGreaterThan(5);
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
    expect(warmup.usedFallback).toBe(false);
    expect(precision.usedFallback).toBe(false);
  });

  test("bulk: every course/overlap combo yields a valid organic curve without fallback", () => {
    let total = 0;
    for (const courseLengthId of COURSES) {
      for (const overlapDifficultyId of OVERLAPS) {
        for (let s = 0; s < 6; s += 1) {
          const path = generate(`hiddenline-bulk:${courseLengthId}:${overlapDifficultyId}:${s}`, courseLengthId, overlapDifficultyId);
          total += 1;
          expect(path.totalLength, `${courseLengthId}/${overlapDifficultyId}/${s}`).toBeGreaterThan(ORGANIC_CURVE_PROFILES[courseLengthId].softLengthRangePx.min * 0.75);
          expect(path.usedFallback, `${courseLengthId}/${overlapDifficultyId}/${s}`).toBe(false);
        }
      }
    }
    expect(total).toBe(150);
  });
});
