import { describe, expect, test } from "vitest";
import { generatePath } from "../../src/game/pathGenerator";
import { createSessionMachine } from "../../src/game/sessionMachine";

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
  for (let index = 1; index < targetPath.points.length; index += 2) {
    machine.pointerMove(targetPath.points[index], index * 32);
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
});
