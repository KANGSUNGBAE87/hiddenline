import { describe, expect, test } from "vitest";
import { GAMEPLAY_DEFAULTS } from "../../src/game/config";
import { createDailyContext } from "../../src/game/daily";
import { createDailyPackContext, getDailyLineContext } from "../../src/game/dailyPack";
import { applyDeadzone, smoothPoint } from "../../src/game/inputSmoothing";
import { generatePath } from "../../src/game/pathGenerator";
import { createSessionMachine } from "../../src/game/sessionMachine";
import { createPreviewViewport } from "../../src/game/viewport";
import type { Point } from "../../src/game/types";

const path = generatePath({
  localDateKey: "2026-06-13",
  timezoneOffset: -540,
  seed: "hiddenline-daily:2026-06-13:daily-v1",
  generatorVersion: "daily-v1",
  difficulty: "normal",
  viewport: { width: 390, height: 560 },
});

const tallPath = generatePath({
  localDateKey: "2026-06-13",
  timezoneOffset: -540,
  seed: "hiddenline-daily:2026-06-13:daily-v1",
  generatorVersion: "daily-v1",
  difficulty: "normal",
  viewport: { width: 390, height: 740 },
});

function traceToEnd(machine: ReturnType<typeof createSessionMachine>, targetPath = path) {
  machine.pointerDown(targetPath.start, 0);
  for (let index = 1; index < targetPath.points.length; index += 1) {
    machine.pointerMove(targetPath.points[index], index * 32);
  }
}

function traceToEndWithPlaySmoothing(machine: ReturnType<typeof createSessionMachine>, targetPath = path) {
  let smoothedPoint: Point | null = null;
  let rawPoint: Point | null = null;
  machine.pointerDown(targetPath.start, 0);
  smoothedPoint = targetPath.start;
  rawPoint = targetPath.start;

  for (let index = 1; index < targetPath.points.length; index += 1) {
    const deadzonedPoint = applyDeadzone(rawPoint, targetPath.points[index], GAMEPLAY_DEFAULTS.deadzonePx);
    const nextPoint = smoothPoint(
      smoothedPoint,
      deadzonedPoint,
      GAMEPLAY_DEFAULTS.smoothingAlpha,
    );
    rawPoint = deadzonedPoint;
    smoothedPoint = nextPoint;
    machine.pointerMove(nextPoint, index * 48);
    if (machine.getSnapshot().status === "failed") break;
  }

  for (let hold = 0; hold < 96 && machine.getSnapshot().status !== "success"; hold += 1) {
    const timeMs = targetPath.points.length * 48 + hold * 48;
    const deadzonedPoint = applyDeadzone(rawPoint, targetPath.end, GAMEPLAY_DEFAULTS.deadzonePx);
    const nextPoint = smoothPoint(
      smoothedPoint,
      deadzonedPoint,
      GAMEPLAY_DEFAULTS.smoothingAlpha,
    );
    rawPoint = deadzonedPoint;
    smoothedPoint = nextPoint;
    machine.pointerMove(nextPoint, timeMs);
  }
}

describe("session machine", () => {
  test("ready starts tracing only when pointer starts inside the start gate", () => {
    const machine = createSessionMachine(path);
    machine.pointerDown({ x: path.start.x + 90, y: path.start.y + 90 }, 0);
    expect(machine.getSnapshot().status).toBe("ready");

    machine.pointerDown(path.start, 100);
    expect(machine.getSnapshot().status).toBe("tracing");
  });

  test("valid samples move tracing progress forward", () => {
    const machine = createSessionMachine(path);
    machine.pointerDown(path.start, 0);
    machine.pointerMove(path.points[2], 64);

    expect(machine.getSnapshot().progressT).toBeGreaterThan(0);
  });

  test("warning meter increases and can recover", () => {
    const machine = createSessionMachine(path);
    machine.pointerDown(path.start, 0);
    machine.pointerMove({ x: path.points[1].x, y: path.points[1].y + 36 }, 100);
    expect(machine.getSnapshot().status).toBe("warning");

    machine.pointerMove(path.points[2], 300);
    machine.pointerMove(path.points[3], 650);
    expect(machine.getSnapshot().warningMeter).toBeLessThan(100);
  });

  test("short lift grace continues and long lift fails", () => {
    const machine = createSessionMachine(path);
    machine.pointerDown(path.start, 0);
    machine.pointerMove(path.points[1], 60);
    machine.pointerUp(100);
    machine.tick(250);
    expect(machine.getSnapshot().status).toBe("warning");

    machine.tick(400);
    expect(machine.getSnapshot().status).toBe("failed");
    expect(machine.getSnapshot().failureReason).toBe("lifted");
  });

  test("coverage ratio blocks endpoint skip success", () => {
    const machine = createSessionMachine(path);
    machine.pointerDown(path.start, 0);
    machine.pointerMove(path.end, 100);

    expect(machine.getSnapshot().status).not.toBe("success");
  });

  test("complete covered run enters success", () => {
    const machine = createSessionMachine(path);
    traceToEnd(machine);

    expect(machine.getSnapshot().status).toBe("success");
    expect(machine.getSnapshot().progressMax).toBeGreaterThanOrEqual(0.98);
  });

  test("complete covered run enters success on the tall play viewport", () => {
    const machine = createSessionMachine(tallPath);
    traceToEnd(machine, tallPath);

    expect(machine.getSnapshot().status).toBe("success");
    expect(machine.getSnapshot().progressMax).toBeGreaterThanOrEqual(0.98);
  });

  test("first line hard remains playable with the same smoothing used by PlayScreen", () => {
    const daily = createDailyContext(new Date("2026-06-16T12:00:00+09:00"));
    const dailyPack = createDailyPackContext(daily);
    const warmupHard = getDailyLineContext(dailyPack, "warmup", "hard", "normal");
    const hardPath = generatePath({ ...warmupHard, viewport: createPreviewViewport() });
    const machine = createSessionMachine(hardPath);

    traceToEndWithPlaySmoothing(machine, hardPath);

    expect(machine.getSnapshot().status, JSON.stringify(machine.getSnapshot())).toBe("success");
    expect(machine.getSnapshot().progressMax).toBeGreaterThanOrEqual(0.98);
  });

  test("all daily line shapes remain playable with the same smoothing used by PlayScreen", () => {
    const daily = createDailyContext(new Date("2026-06-16T12:00:00+09:00"));
    const dailyPack = createDailyPackContext(daily);

    for (const line of dailyPack.lines) {
      const lineContext = getDailyLineContext(dailyPack, line.lineType, line.lineDifficulty, "normal");
      const generated = generatePath({ ...lineContext, viewport: createPreviewViewport() });
      const machine = createSessionMachine(generated);

      traceToEndWithPlaySmoothing(machine, generated);

      expect(`${line.lineType}:${line.lineDifficulty}:${machine.getSnapshot().failureReason}`).toBe(
        `${line.lineType}:${line.lineDifficulty}:null`,
      );
      expect(machine.getSnapshot().status, JSON.stringify(machine.getSnapshot())).toBe("success");
      expect(machine.getSnapshot().progressMax).toBeGreaterThanOrEqual(0.98);
    }
  });
});
