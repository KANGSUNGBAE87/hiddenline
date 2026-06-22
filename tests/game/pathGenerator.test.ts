import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";
import { createDailyContext } from "../../src/game/daily";
import { createDailyPackContext, getDailyLineContext } from "../../src/game/dailyPack";
import { generatePath } from "../../src/game/pathGenerator";
import { hasSelfIntersection } from "../../src/game/pathGeometry";
import type { CourseLengthId, GeneratorProfileId, LineDifficultyId, LineType, OverlapDifficultyId, Point } from "../../src/game/types";

const viewport = { width: 390, height: 560 };
const lockedFixtureSeed = "0x6f1c2a9d4e11b7c3";

function checksumPoints(points: Point[]): string {
  return points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join("|");
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
    const ratio = Math.min(1, Math.max(-1, dot / (firstLength * secondLength)));
    maxAngle = Math.max(maxAngle, Math.acos(ratio));
  }

  return maxAngle;
}

function clippedInteriorYCount(points: Point[], targetViewport = viewport): number {
  const margin = Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(targetViewport.width, targetViewport.height) * 0.18));

  return points.filter((point, index) => {
    const isEndpoint = index === 0 || index === points.length - 1;
    return !isEndpoint && (point.y <= margin + 0.01 || point.y >= targetViewport.height - margin - 0.01);
  }).length;
}

function safeMargin(targetViewport = viewport): number {
  return Math.min(GAMEPLAY_DEFAULTS.safeMarginPx, Math.max(16, Math.min(targetViewport.width, targetViewport.height) * 0.18));
}

function isNearSafeBoundary(point: Point, targetViewport = viewport): boolean {
  const margin = safeMargin(targetViewport);
  const boundaryBand = 18;

  return (
    Math.abs(point.x - margin) <= boundaryBand ||
    Math.abs(point.x - (targetViewport.width - margin)) <= boundaryBand ||
    Math.abs(point.y - margin) <= boundaryBand ||
    Math.abs(point.y - (targetViewport.height - margin)) <= boundaryBand
  );
}

function hasOppositeSafeBoundaryAxis(start: Point, end: Point, targetViewport = viewport): boolean {
  const margin = safeMargin(targetViewport);
  const boundaryBand = 22;
  const startLeft = Math.abs(start.x - margin) <= boundaryBand;
  const startRight = Math.abs(start.x - (targetViewport.width - margin)) <= boundaryBand;
  const startTop = Math.abs(start.y - margin) <= boundaryBand;
  const startBottom = Math.abs(start.y - (targetViewport.height - margin)) <= boundaryBand;
  const endLeft = Math.abs(end.x - margin) <= boundaryBand;
  const endRight = Math.abs(end.x - (targetViewport.width - margin)) <= boundaryBand;
  const endTop = Math.abs(end.y - margin) <= boundaryBand;
  const endBottom = Math.abs(end.y - (targetViewport.height - margin)) <= boundaryBand;

  return (startLeft && endRight) || (startRight && endLeft) || (startTop && endBottom) || (startBottom && endTop);
}

const profileByLineType: Record<LineType, GeneratorProfileId> = {
  warmup: "gentle-warmup-v1",
  main: "daily-main-normal-v1",
  curve: "curve-control-v1",
  precision: "precision-focus-v1",
};

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
    const ca = Math.hypot(c.x - a.x, c.y - a.y);
    if (ab < 0.8 || bc < 0.8) continue;

    const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    if (doubleArea > 0.001) radius = Math.min(radius, (ab * bc * ca) / (2 * doubleArea));
  }
  return radius;
}

function maxHeadingDelta(points: Point[]): number {
  let maxDelta = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const first = Math.atan2(current.y - previous.y, current.x - previous.x);
    const second = Math.atan2(next.y - current.y, next.x - current.x);
    const delta = Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)));
    maxDelta = Math.max(maxDelta, delta);
  }

  return maxDelta;
}

function curvatureDirectionChanges(points: Point[]): number {
  let changes = 0;
  let previousSign = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const first = { x: current.x - previous.x, y: current.y - previous.y };
    const second = { x: next.x - current.x, y: next.y - current.y };
    const firstLength = Math.hypot(first.x, first.y);
    const secondLength = Math.hypot(second.x, second.y);
    if (firstLength < 0.8 || secondLength < 0.8) continue;

    const cross = (first.x * second.y - first.y * second.x) / (firstLength * secondLength);
    if (Math.abs(cross) < 0.012) continue;

    const sign = Math.sign(cross);
    if (previousSign !== 0 && sign !== previousSign) changes += 1;
    previousSign = sign;
  }

  return changes;
}

describe("path generator", () => {
  test("course length controls normalized total path length", () => {
    const daily = createDailyContext(new Date(2026, 5, 21));
    const cases: Array<[CourseLengthId, number, number]> = [
      ["short", 1.42, 1.74],
      ["basic", 1.86, 2.25],
      ["long", 2.55, 3.15],
      ["longRun", 3.45, 4.35],
      ["marathon", 4.65, 5.65],
    ];

    for (const [courseLengthId, min, max] of cases) {
      const path = generatePath({
        ...daily,
        seed: `hiddenline-course-length:${courseLengthId}`,
        courseLengthId,
        overlapDifficultyId: "light",
        visibilityLevel: "normal",
        viewport,
      });
      const normalizedLength = path.totalLength / Math.min(viewport.width, viewport.height);

      expect(normalizedLength, courseLengthId).toBeGreaterThanOrEqual(min);
      expect(normalizedLength, courseLengthId).toBeLessThanOrEqual(max);
    }
  });

  test("overlap difficulty controls self-crossing count without stitched sharp corners", () => {
    const daily = createDailyContext(new Date(2026, 5, 21));
    const cases: Array<[OverlapDifficultyId, number, number]> = [
      ["light", 0, 0],
      ["normal", 1, 2],
      ["complex", 3, 4],
      ["hard", 5, 6],
      ["master", 7, 12],
    ];

    for (const [overlapDifficultyId, min, max] of cases) {
      const path = generatePath({
        ...daily,
        seed: `hiddenline-overlap:${overlapDifficultyId}`,
        courseLengthId: "marathon",
        overlapDifficultyId,
        visibilityLevel: "normal",
        viewport,
      });
      const intersections = countSelfIntersections(path.points);

      expect(intersections, overlapDifficultyId).toBeGreaterThanOrEqual(min);
      expect(intersections, overlapDifficultyId).toBeLessThanOrEqual(max);
      expect(maxTurnAngle(path.points), overlapDifficultyId).toBeLessThan(0.9);
      expect(minTurnRadius(path.points), overlapDifficultyId).toBeGreaterThan(0.05);
    }
  });

  test("overlap difficulty uses broad loop patterns instead of high-frequency wiggles", () => {
    const daily = createDailyContext(new Date(2026, 5, 22));
    const cases: Array<[OverlapDifficultyId, number, number, number]> = [
      ["light", 0, 8, 10],
      ["normal", 1, 14, 5],
      ["complex", 3, 20, 5],
      ["hard", 5, 28, 4],
      ["master", 7, 36, 4],
    ];

    for (const [overlapDifficultyId, minIntersections, maxCurvatureChanges, minRadius] of cases) {
      const path = generatePath({
        ...daily,
        seed: `hiddenline-large-loop-pattern:${overlapDifficultyId}`,
        courseLengthId: "marathon",
        overlapDifficultyId,
        visibilityLevel: "normal",
        viewport,
      });
      const intersections = countSelfIntersections(path.points);

      expect(intersections, overlapDifficultyId).toBeGreaterThanOrEqual(minIntersections);
      expect(curvatureDirectionChanges(path.points), overlapDifficultyId).toBeLessThanOrEqual(maxCurvatureChanges);
      expect(minTurnRadius(path.points), overlapDifficultyId).toBeGreaterThan(minRadius);
    }
  });

  test("generated paths start and end near opposite sides of the safe play rectangle", () => {
    const daily = createDailyContext(new Date(2026, 5, 21));
    const cases: Array<[CourseLengthId, OverlapDifficultyId]> = [
      ["short", "light"],
      ["basic", "normal"],
      ["long", "complex"],
      ["longRun", "hard"],
      ["marathon", "master"],
    ];

    for (const [courseLengthId, overlapDifficultyId] of cases) {
      const path = generatePath({
        ...daily,
        seed: `hiddenline-boundary-endpoints:${courseLengthId}:${overlapDifficultyId}`,
        courseLengthId,
        overlapDifficultyId,
        visibilityLevel: "normal",
        viewport,
      });

      expect(isNearSafeBoundary(path.start), `${courseLengthId}/${overlapDifficultyId}/start`).toBe(true);
      expect(isNearSafeBoundary(path.end), `${courseLengthId}/${overlapDifficultyId}/end`).toBe(true);
      expect(hasOppositeSafeBoundaryAxis(path.start, path.end), `${courseLengthId}/${overlapDifficultyId}/opposite`).toBe(true);
    }
  });

  test("endpoint anchoring does not insert straight stitched ramps", () => {
    const daily = createDailyContext(new Date(2026, 5, 22));
    const path = generatePath({
      ...daily,
      seed: "hiddenline-endpoint-curve-guard",
      courseLengthId: "basic",
      overlapDifficultyId: "complex",
      visibilityLevel: "normal",
      viewport,
    });

    expect(maxHeadingDelta(path.points.slice(0, 20))).toBeGreaterThan(0.001);
    expect(maxHeadingDelta(path.points.slice(-20))).toBeGreaterThan(0.001);
  });

  test("deterministic seed generates the same path", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const first = generatePath({ ...daily, viewport });
    const second = generatePath({ ...daily, viewport });

    expect(first.seed).toBe(second.seed);
    expect(first.points).toEqual(second.points);
  });

  test("generated path has monotonic t and positive length", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const path = generatePath({ ...daily, viewport });

    expect(path.points.length).toBeGreaterThanOrEqual(96);
    expect(path.points[0]?.t).toBe(0);
    expect(path.points.at(-1)?.t).toBe(1);
    expect(path.totalLength).toBeGreaterThan(0);

    for (let index = 1; index < path.points.length; index += 1) {
      expect(path.points[index].t).toBeGreaterThanOrEqual(path.points[index - 1].t);
      expect(path.points[index].distance).toBeGreaterThanOrEqual(path.points[index - 1].distance);
    }
  });

  test("generated path stays within safe margin and respects default overlap target", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const path = generatePath({ ...daily, viewport });
    const margin = GAMEPLAY_DEFAULTS.safeMarginPx;

    for (const point of path.points) {
      expect(point.x).toBeGreaterThanOrEqual(margin);
      expect(point.x).toBeLessThanOrEqual(viewport.width - margin);
      expect(point.y).toBeGreaterThanOrEqual(margin);
      expect(point.y).toBeLessThanOrEqual(viewport.height - margin);
    }

    expect(countSelfIntersections(path.points)).toBeGreaterThanOrEqual(3);
    expect(countSelfIntersections(path.points)).toBeLessThanOrEqual(4);
  });

  test("locked Standard fixture stays deterministic for the approved seed without pinning old coordinates", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const path = generatePath({
      ...daily,
      seed: lockedFixtureSeed,
      generatorVersion: "v1" as never,
      lineType: "main",
      courseLengthId: "basic",
      overlapDifficultyId: "normal",
      generatorProfileId: "daily-main-normal-v1",
      lineDifficulty: "normal",
      visibilityLevel: "normal",
      viewport,
    } as any);
    const second = generatePath({
      ...daily,
      seed: lockedFixtureSeed,
      generatorVersion: "v1" as never,
      lineType: "main",
      courseLengthId: "basic",
      overlapDifficultyId: "normal",
      generatorProfileId: "daily-main-normal-v1",
      lineDifficulty: "normal",
      visibilityLevel: "normal",
      viewport,
    } as any);

    expect(path.generatorVersion).toBe("v1");
    expect(path.lineType).toBe("main");
    expect(path.courseLengthId).toBe("basic");
    expect(path.overlapDifficultyId).toBe("normal");
    expect(path.start.x).toBeCloseTo(path.points[0]?.x ?? 0, 6);
    expect(path.start.y).toBeCloseTo(path.points[0]?.y ?? 0, 6);
    expect(path.end.x).toBeCloseTo(path.points.at(-1)?.x ?? 0, 6);
    expect(path.end.y).toBeCloseTo(path.points.at(-1)?.y ?? 0, 6);
    expect(checksumPoints(path.points)).toBe(checksumPoints(second.points));
  });

  test("generator profile changes the generated line shape", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const base = {
      ...daily,
      seed: "hiddenline-profile-test",
      viewport,
    };
    const warmup = generatePath({ ...base, lineType: "warmup" as const, generatorProfileId: "gentle-warmup-v1" as const });
    const curve = generatePath({ ...base, lineType: "curve" as const, generatorProfileId: "curve-control-v1" as const });

    expect(curve.points).not.toEqual(warmup.points);
    expect(curve.totalLength).toBeGreaterThan(warmup.totalLength * 0.9);
  });

  test("legacy line difficulty maps to overlap count instead of course length", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const base = {
      ...daily,
      seed: "hiddenline-line-difficulty-test",
      lineType: "main" as const,
      generatorProfileId: "daily-main-normal-v1" as const,
      viewport,
      visibilityLevel: "normal" as const,
    };
    const easyLine = generatePath({ ...base, lineDifficulty: "easy" });
    const normalLine = generatePath({ ...base, lineDifficulty: "normal" });
    const hardLine = generatePath({ ...base, lineDifficulty: "hard" });

    expect(easyLine.points).not.toEqual(normalLine.points);
    expect(normalLine.points).not.toEqual(hardLine.points);
    expect(countSelfIntersections(easyLine.points)).toBeGreaterThanOrEqual(1);
    expect(countSelfIntersections(easyLine.points)).toBeLessThanOrEqual(2);
    expect(countSelfIntersections(normalLine.points)).toBeGreaterThanOrEqual(3);
    expect(countSelfIntersections(normalLine.points)).toBeLessThanOrEqual(4);
    expect(countSelfIntersections(hardLine.points)).toBeGreaterThanOrEqual(5);
    expect(countSelfIntersections(hardLine.points)).toBeLessThanOrEqual(6);
    expect(easyLine.courseLengthId).toBe(normalLine.courseLengthId);
    expect(normalLine.courseLengthId).toBe(hardLine.courseLengthId);
  });

  test("hard line difficulty can generate an actual self-crossing path", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const hardLine = generatePath({
      ...daily,
      seed: "hiddenline-hard-self-crossing-test",
      lineType: "curve",
      generatorProfileId: "curve-control-v1",
      lineDifficulty: "hard",
      visibilityLevel: "normal",
      viewport,
    });

    expect(hasSelfIntersection(hardLine.points)).toBe(true);
  });

  test("legacy line families now map to course length while overlap remains separate", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const base = {
      ...daily,
      seed: "hiddenline-hard-family-rule-test",
      lineDifficulty: "hard" as const,
      visibilityLevel: "normal" as const,
      viewport,
    };
    const warmup = generatePath({ ...base, lineType: "warmup", generatorProfileId: "gentle-warmup-v1" });
    const main = generatePath({ ...base, lineType: "main", generatorProfileId: "daily-main-normal-v1" });
    const curve = generatePath({ ...base, lineType: "curve", generatorProfileId: "curve-control-v1" });
    const precision = generatePath({ ...base, lineType: "precision", generatorProfileId: "precision-focus-v1" });

    expect(warmup.courseLengthId).toBe("short");
    expect(main.courseLengthId).toBe("basic");
    expect(curve.courseLengthId).toBe("longRun");
    expect(precision.courseLengthId).toBe("marathon");
    expect(main.totalLength).toBeGreaterThan(warmup.totalLength);
    expect(curve.totalLength).toBeGreaterThan(main.totalLength);
    expect(precision.totalLength).toBeGreaterThan(curve.totalLength);
  });

  test("hard crossing lines avoid abrupt corner-like turns", () => {
    const daily = createDailyContext(new Date(2026, 5, 16));
    const base = {
      ...daily,
      lineDifficulty: "hard" as const,
      visibilityLevel: "normal" as const,
      viewport,
    };
    const main = generatePath({
      ...base,
      seed: "hiddenline-smooth-hard-main",
      lineType: "main",
      generatorProfileId: "daily-main-normal-v1",
    });
    const curve = generatePath({
      ...base,
      seed: "hiddenline-smooth-hard-curve",
      lineType: "curve",
      generatorProfileId: "curve-control-v1",
    });
    const precision = generatePath({
      ...base,
      seed: "hiddenline-smooth-hard-precision",
      lineType: "precision",
      generatorProfileId: "precision-focus-v1",
    });

    expect(maxTurnAngle(main.points)).toBeLessThan(1.75);
    expect(maxTurnAngle(curve.points)).toBeLessThan(1.75);
    expect(maxTurnAngle(precision.points)).toBeLessThan(1.75);
  });

  test("random smooth paths avoid boundary clipping corners across daily and legacy seeds", () => {
    const daily = createDailyContext(new Date(2026, 5, 16));
    const pack = createDailyPackContext(daily);
    const cases = [
      ...(["warmup", "main", "curve", "precision"] as const).flatMap((lineType) =>
        (["easy", "normal", "hard"] as const).map((lineDifficulty) =>
          getDailyLineContext(pack, lineType, lineDifficulty, "normal"),
        ),
      ),
      ...["2026-06-15", "2026-06-16"].flatMap((localDateKey) =>
        (["main", "curve", "precision"] as const).flatMap((lineType) =>
          (["normal", "hard"] as const).map((lineDifficulty) => ({
            ...daily,
            localDateKey,
            seed: `hiddenline-daily:${localDateKey}:daily-v1`,
            lineType,
            generatorProfileId: profileByLineType[lineType],
            lineDifficulty,
            visibilityLevel: "normal" as const,
          })),
        ),
      ),
    ];

    for (const testCase of cases) {
      const path = generatePath({ ...testCase, viewport });
      expect(clippedInteriorYCount(path.points), `${testCase.lineType}/${testCase.lineDifficulty}/${testCase.seed}`).toBe(0);
      expect(maxTurnAngle(path.points), `${testCase.lineType}/${testCase.lineDifficulty}/${testCase.seed}`).toBeLessThan(1.05);
    }
  });

  test("legacy line families increase course length after boundary-safe scaling", () => {
    const daily = createDailyContext(new Date(2026, 5, 16));
    const rows = (["warmup", "main", "curve", "precision"] as const).map((lineType) => {
      const base = {
        ...daily,
        seed: `hiddenline-smooth-complexity:${lineType}`,
        lineType,
        generatorProfileId: profileByLineType[lineType],
        visibilityLevel: "normal" as const,
        viewport,
      };
      const normal = generatePath({ ...base, lineDifficulty: "normal" as LineDifficultyId });

      return { lineType, normal };
    });

    expect(rows[1].normal.totalLength).toBeGreaterThan(rows[0].normal.totalLength);
    expect(rows[2].normal.totalLength).toBeGreaterThan(rows[1].normal.totalLength);
    expect(rows[3].normal.totalLength).toBeGreaterThan(rows[2].normal.totalLength);
  });

  test("visibility level changes reveal range and fail tolerance without changing the line shape", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const base = {
      ...daily,
      seed: "hiddenline-visibility-test",
      lineType: "main" as const,
      generatorProfileId: "daily-main-normal-v1" as const,
      lineDifficulty: "hard" as const,
      viewport,
    };
    const easySight = generatePath({ ...base, visibilityLevel: "easy" });
    const normalSight = generatePath({ ...base, visibilityLevel: "normal" });
    const hardSight = generatePath({ ...base, visibilityLevel: "hard" });

    expect(easySight.points).toEqual(normalSight.points);
    expect(normalSight.points).toEqual(hardSight.points);
    expect(easySight.lineDifficulty).toBe("hard");
    expect(easySight.visibilityLevel).toBe("easy");
    expect(normalSight.visibilityLevel).toBe("normal");
    expect(hardSight.visibilityLevel).toBe("hard");
    expect(easySight.rules.revealRadiusPx).toBeGreaterThan(normalSight.rules.revealRadiusPx);
    expect(normalSight.rules.revealRadiusPx).toBeGreaterThan(hardSight.rules.revealRadiusPx);
    expect(easySight.rules.failDistancePx).toBeGreaterThan(normalSight.rules.failDistancePx);
    expect(normalSight.rules.failDistancePx).toBeGreaterThan(hardSight.rules.failDistancePx);
  });
});
