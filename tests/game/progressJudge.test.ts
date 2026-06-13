import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";
import { generatePath } from "../../src/game/pathGenerator";
import { judgeProgressSample, getCoverageRatio } from "../../src/game/progressJudge";

const context = {
  localDateKey: "2026-06-13",
  timezoneOffset: -540,
  seed: "hiddenline-daily:2026-06-13:daily-v1",
  generatorVersion: "daily-v1" as const,
  difficulty: "normal" as const,
};
const path = generatePath({ ...context, viewport: { width: 390, height: 560 } });

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
});
