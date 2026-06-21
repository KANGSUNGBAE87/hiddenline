import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createDailyContext } from "../../src/game/daily";
import { createDailyPackContext, getDailyCourseContext } from "../../src/game/dailyPack";
import { generatePath } from "../../src/game/pathGenerator";
import { pointAtT } from "../../src/game/pathGeometry";
import type { SessionSnapshot } from "../../src/game/sessionMachine";
import { createPreviewViewport } from "../../src/game/viewport";
import { CanvasGame } from "../../src/ui/components/CanvasGame";

describe("CanvasGame path rendering", () => {
  test("renders active revealed line with curve commands instead of straight segment joins", () => {
    const daily = createDailyContext(new Date("2026-06-22T12:00:00+09:00"));
    const dailyPack = createDailyPackContext(daily);
    const selectedLine = getDailyCourseContext(dailyPack, "basic", "complex", "normal");
    const path = generatePath({ ...selectedLine, viewport: createPreviewViewport() });
    const focus = pointAtT(path.points, 0.42);
    const context = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      clip: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: "",
      fillStyle: "",
      lineCap: "round",
      lineJoin: "round",
      lineWidth: 1,
      strokeStyle: "",
    } as unknown as CanvasRenderingContext2D & { quadraticCurveTo: ReturnType<typeof vi.fn> };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const snapshot: SessionSnapshot = {
      status: "tracing",
      progressT: 0.42,
      progressMax: 0.42,
      warningMeter: 0,
      failureReason: null,
      startedAtMs: 0,
      endedAtMs: null,
      metrics: {
        accuracy: 1,
        smoothness: 1,
        durationMs: null,
        warningPeak: 0,
        warningCount: 0,
      },
      lastTouch: focus,
      coverageRatio: 0.42,
      score: null,
    };

    render(
      <CanvasGame
        path={path}
        snapshot={snapshot}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
        onPointerCancel={vi.fn()}
      />,
    );

    expect(context.quadraticCurveTo).toHaveBeenCalled();
  });
});
