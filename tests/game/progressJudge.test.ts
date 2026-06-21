import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";
import { generatePath } from "../../src/game/pathGenerator";
import { annotatePolyline } from "../../src/game/pathGeometry";
import { judgeProgressSample, getCoverageRatio } from "../../src/game/progressJudge";
import type { GeneratedPath, Point } from "../../src/game/types";

const context = {
  localDateKey: "2026-06-13",
  timezoneOffset: -540,
  seed: "hiddenline-daily:2026-06-13:daily-v1",
  generatorVersion: "daily-v1" as const,
  difficulty: "normal" as const,
};
const path = generatePath({ ...context, viewport: { width: 390, height: 560 } });

function createCrossingPath(points: Point[]): GeneratedPath {
  const annotated = annotatePolyline(points);
  return {
    seed: "crossing-progress-test",
    generatorVersion: "daily-v1",
    lineType: "curve",
    courseLengthId: "longRun",
    overlapDifficultyId: "complex",
    selfIntersectionCount: 1,
    generatorProfileId: "curve-control-v1",
    difficulty: "normal",
    lineDifficulty: "hard",
    visibilityLevel: "normal",
    complexityScore: 1,
    viewport: { width: 390, height: 560 },
    start: annotated[0],
    end: annotated[annotated.length - 1],
    points: annotated,
    totalLength: annotated[annotated.length - 1].distance,
    usedFallback: false,
    rules: path.rules,
  };
}

describe("progress judge", () => {
  test("touch near the current path advances progressT", () => {
    const coveredSegments = new Set<number>();
    const target = path.points[Math.floor(path.points.length * 0.02)];

    const judgment = judgeProgressSample({
      point: target,
      path,
      previousProgressT: 0,
      coveredSegments,
      previousTimeMs: 0,
      timeMs: 120,
    });

    expect(judgment.accepted).toBe(true);
    expect(judgment.progressT).toBeGreaterThan(0);
    expect(judgment.warningLevel).toBe("safe");
    expect(getCoverageRatio(judgment.coveredSegments)).toBeGreaterThan(0);
  });

  test("progressT jump blocking rejects suspicious skip", () => {
    const coveredSegments = new Set<number>();
    const target = path.points[Math.floor(path.points.length * 0.72)];

    const judgment = judgeProgressSample({
      point: target,
      path,
      previousProgressT: 0.08,
      coveredSegments,
      previousTimeMs: 100,
      timeMs: 132,
    });

    expect(judgment.accepted).toBe(false);
    expect(judgment.suspiciousJump).toBe(true);
    expect(judgment.progressT).toBe(0.08);
    expect(getCoverageRatio(judgment.coveredSegments)).toBe(0);
  });

  test("coverage ratio blocks skip finish", () => {
    const sparseCoverage = new Set([0, 1, 2, 62, 63]);

    expect(getCoverageRatio(sparseCoverage)).toBeLessThan(GAMEPLAY_DEFAULTS.requiredCoverageRatio);
  });

  test("touch far from path classifies as fail", () => {
    const judgment = judgeProgressSample({
      point: { x: 1, y: 1 },
      path,
      previousProgressT: 0,
      coveredSegments: new Set(),
      previousTimeMs: 0,
      timeMs: 16,
    });

    expect(judgment.warningLevel).toBe("fail");
  });

  test("self-crossing paths judge against the current progress window", () => {
    const crossingPath = createCrossingPath([
      { x: 48, y: 120 },
      { x: 180, y: 120 },
      { x: 320, y: 120 },
      { x: 180, y: 120 },
      { x: 180, y: 260 },
      { x: 320, y: 260 },
    ]);
    const laterCrossing = crossingPath.points[3];

    const judgment = judgeProgressSample({
      point: laterCrossing,
      path: crossingPath,
      previousProgressT: Math.max(0, laterCrossing.t - 0.01),
      coveredSegments: new Set(),
      previousTimeMs: 100,
      timeMs: 160,
    });

    expect(judgment.accepted).toBe(true);
    expect(judgment.projectedProgressT).toBeGreaterThan(0.5);
    expect(judgment.progressT).toBeGreaterThan(0.5);
  });
});
