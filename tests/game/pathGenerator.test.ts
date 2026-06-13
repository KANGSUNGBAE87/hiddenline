import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";
import { createDailyContext } from "../../src/game/daily";
import { generatePath } from "../../src/game/pathGenerator";
import { hasSelfIntersection } from "../../src/game/pathGeometry";

const viewport = { width: 390, height: 560 };

describe("path generator", () => {
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

  test("generated path stays within safe margin and has no self-intersection", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const path = generatePath({ ...daily, viewport });
    const margin = GAMEPLAY_DEFAULTS.safeMarginPx;

    for (const point of path.points) {
      expect(point.x).toBeGreaterThanOrEqual(margin);
      expect(point.x).toBeLessThanOrEqual(viewport.width - margin);
      expect(point.y).toBeGreaterThanOrEqual(margin);
      expect(point.y).toBeLessThanOrEqual(viewport.height - margin);
    }

    expect(hasSelfIntersection(path.points)).toBe(false);
  });

  test("fallback path is deterministic", () => {
    const daily = createDailyContext(new Date(2026, 5, 13));
    const first = generatePath({ ...daily, viewport: { width: 120, height: 120 }, maxAttempts: 0 });
    const second = generatePath({ ...daily, viewport: { width: 120, height: 120 }, maxAttempts: 0 });

    expect(first.usedFallback).toBe(true);
    expect(first.points).toEqual(second.points);
  });
});
