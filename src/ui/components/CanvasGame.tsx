import { useEffect, useRef, useState } from "react";
import { VISIBILITY_DEFAULTS } from "../../game/config";
import { pointAtT } from "../../game/pathGeometry";
import type { GeneratedPath, PathPoint, Point } from "../../game/types";
import type { SessionSnapshot } from "../../game/sessionMachine";

type CanvasGameProps = {
  path: GeneratedPath;
  snapshot: SessionSnapshot;
  onPointerDown: (point: Point, timeMs: number) => void;
  onPointerMove: (point: Point, timeMs: number) => void;
  onPointerUp: (timeMs: number) => void;
  onPointerCancel: (timeMs: number) => void;
};

function makeLinearGradient(
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Array<[number, string]>,
  fallback: string,
): CanvasGradient | string {
  if (typeof context.createLinearGradient !== "function") return fallback;
  const gradient = context.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function makeRadialGradient(
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  stops: Array<[number, string]>,
  fallback: string,
): CanvasGradient | string {
  if (typeof context.createRadialGradient !== "function") return fallback;
  const gradient = context.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function strokeSegment(
  context: CanvasRenderingContext2D,
  path: PathPoint[],
  fromT: number,
  toT: number,
  color: string,
  opacity: number,
  width: number,
) {
  const start = Math.max(0, Math.min(fromT, toT));
  const end = Math.min(1, Math.max(fromT, toT));
  if (end <= start) return;

  const points = [pointAtT(path, start), ...path.filter((point) => point.t > start && point.t < end), pointAtT(path, end)];
  if (points.length < 2) return;

  context.save();
  context.globalAlpha = opacity;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    const controlX = (points[0].x + points[1].x) / 2;
    const controlY = (points[0].y + points[1].y) / 2;
    context.quadraticCurveTo(controlX, controlY, points[1].x, points[1].y);
  } else {
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      context.quadraticCurveTo(current.x, current.y, midX, midY);
    }

    const previous = points[points.length - 2];
    const last = points[points.length - 1];
    context.quadraticCurveTo(previous.x, previous.y, last.x, last.y);
  }

  context.stroke();
  context.restore();
}

function drawMarker(context: CanvasRenderingContext2D, point: Point, color: string, radius: number, opacity = 1) {
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFieldBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const base = makeLinearGradient(
    context,
    0,
    0,
    0,
    height,
    [
      [0, "#101b25"],
      [0.52, "#081018"],
      [1, "#060b10"],
    ],
    "#081018",
  );
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  const topGlow = makeRadialGradient(
    context,
    width * 0.5,
    0,
    0,
    width * 0.5,
    0,
    width * 0.75,
    [
      [0, "rgba(127, 220, 255, 0.13)"],
      [0.34, "rgba(127, 220, 255, 0.035)"],
      [1, "rgba(127, 220, 255, 0)"],
    ],
    "rgba(127, 220, 255, 0.035)",
  );
  context.fillStyle = topGlow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.08;
  context.strokeStyle = "#aee8ff";
  context.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const radius = 74 + index * 54;
    context.beginPath();
    context.arc(width * 0.28, height * 0.64, radius, Math.PI * 1.05, Math.PI * 1.92);
    context.stroke();
  }
  context.globalAlpha = 0.045;
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 73) % width;
    const y = (index * 139) % height;
    context.fillStyle = index % 3 === 0 ? "#aee8ff" : "#91a3af";
    context.fillRect(x, y, 1, 1);
  }
  context.restore();
}

function drawDestinationMarker(context: CanvasRenderingContext2D, point: Point) {
  context.save();
  context.globalAlpha = VISIBILITY_DEFAULTS.destinationOpacity * 0.72;
  context.shadowColor = "#d6f5ff";
  context.shadowBlur = 12;
  context.strokeStyle = "#d6f5ff";
  context.lineWidth = 1.2;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(point.x - 12, point.y);
  context.lineTo(point.x + 12, point.y);
  context.moveTo(point.x, point.y - 12);
  context.lineTo(point.x, point.y + 12);
  context.moveTo(point.x - 6, point.y - 6);
  context.lineTo(point.x + 6, point.y + 6);
  context.moveTo(point.x + 6, point.y - 6);
  context.lineTo(point.x - 6, point.y + 6);
  context.stroke();
  context.globalAlpha = VISIBILITY_DEFAULTS.destinationOpacity * 0.65;
  context.beginPath();
  context.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
  context.fillStyle = "#f3fbff";
  context.fill();
  context.restore();
}

function drawStartMarker(context: CanvasRenderingContext2D, point: Point) {
  const glow = makeRadialGradient(
    context,
    point.x,
    point.y,
    1,
    point.x,
    point.y,
    34,
    [
      [0, "rgba(214, 245, 255, 0.95)"],
      [0.26, "rgba(127, 220, 255, 0.42)"],
      [1, "rgba(127, 220, 255, 0)"],
    ],
    "rgba(127, 220, 255, 0.18)",
  );

  context.save();
  context.fillStyle = glow;
  context.beginPath();
  context.arc(point.x, point.y, 34, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(174, 232, 255, 0.32)";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(point.x, point.y, 18, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#aee8ff";
  context.shadowColor = "#7fdcff";
  context.shadowBlur = 14;
  context.beginPath();
  context.arc(point.x, point.y, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.72)";
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(point.x - 2.5, point.y - 2.5, 2.4, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFocusLens(
  context: CanvasRenderingContext2D,
  point: Point,
  status: SessionSnapshot["status"],
  warningMeter: number,
  radius: number,
) {
  const warning = status === "warning";
  const color = warning ? "232, 183, 91" : "174, 232, 255";
  const ringOpacity = warning ? 0.3 + Math.min(0.48, warningMeter / 170) : 0.2;
  const fill = makeRadialGradient(
    context,
    point.x,
    point.y,
    radius * 0.22,
    point.x,
    point.y,
    radius,
    [
      [0, `rgba(${color}, ${warning ? 0.18 : 0.11})`],
      [0.5, `rgba(${color}, ${warning ? 0.08 : 0.045})`],
      [1, `rgba(${color}, 0.012)`],
    ],
    `rgba(${color}, ${warning ? 0.08 : 0.045})`,
  );

  context.save();
  context.fillStyle = fill;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = warning ? 0.16 : 0.1;
  context.fillStyle = "#f3fbff";
  context.beginPath();
  context.arc(point.x - radius * 0.18, point.y - radius * 0.18, radius * 0.22, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = ringOpacity;
  context.strokeStyle = warning ? "#e8b75b" : "#aee8ff";
  context.lineWidth = warning ? 2 : 1;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = warning ? 0.24 : 0.14;
  context.beginPath();
  context.arc(point.x, point.y, radius * 0.62, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

export function CanvasGame({
  path,
  snapshot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sizeTick, setSizeTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => setSizeTick((value) => value + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width || path.viewport.width);
    const cssHeight = Math.max(1, rect.height || path.viewport.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform((cssWidth * dpr) / path.viewport.width, 0, 0, (cssHeight * dpr) / path.viewport.height, 0, 0);
    context.clearRect(0, 0, path.viewport.width, path.viewport.height);
    drawFieldBackground(context, path.viewport.width, path.viewport.height);

    const isRevealing = snapshot.status !== "ready" && snapshot.lastTouch;
    const focus = snapshot.lastTouch ?? path.start;
    const visibleForwardPreviewT = path.rules.forwardPreviewT * VISIBILITY_DEFAULTS.forwardPreviewRenderMultiplier;

    if (isRevealing) {
      drawFocusLens(context, focus, snapshot.status, snapshot.warningMeter, path.rules.touchFocusRadiusPx);

      context.save();
      context.beginPath();
      context.arc(focus.x, focus.y, path.rules.revealRadiusPx, 0, Math.PI * 2);
      context.clip();

      strokeSegment(
        context,
        path.points,
        Math.max(0, snapshot.progressT - VISIBILITY_DEFAULTS.passedTrailT),
        snapshot.progressT,
        "#6baed0",
        VISIBILITY_DEFAULTS.passedTrailOpacity,
        VISIBILITY_DEFAULTS.pathStrokeWidth * 0.85,
      );

      strokeSegment(
        context,
        path.points,
        snapshot.progressT,
        Math.min(1, snapshot.progressT + visibleForwardPreviewT),
        "#31404a",
        VISIBILITY_DEFAULTS.forwardPreviewOpacity,
        VISIBILITY_DEFAULTS.pathStrokeWidth,
      );

      context.shadowColor = snapshot.status === "warning" ? "#e8b75b" : "#aee8ff";
      context.shadowBlur = snapshot.status === "warning" ? 7 : 6;
      strokeSegment(
        context,
        path.points,
        Math.max(0, snapshot.progressT - VISIBILITY_DEFAULTS.activeBacktrackT),
        Math.min(1, snapshot.progressT + visibleForwardPreviewT),
        snapshot.status === "warning" ? "#e8b75b" : "#aee8ff",
        VISIBILITY_DEFAULTS.revealedPathOpacity,
        VISIBILITY_DEFAULTS.pathStrokeWidth,
      );
      context.restore();
    }

    if (snapshot.status === "failed" && snapshot.lastTouch) {
      drawMarker(context, snapshot.lastTouch, "#df7d73", 9, 0.9);
    }

    drawStartMarker(context, path.start);
    drawDestinationMarker(context, path.end);
  }, [path, snapshot, sizeTick]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || path.viewport.width;
    const height = rect.height || path.viewport.height;
    return {
      x: ((event.clientX - rect.left) / width) * path.viewport.width,
      y: ((event.clientY - rect.top) / height) * path.viewport.height,
    };
  }

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      data-testid="game-canvas"
      aria-label="Hidden Line play field"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        onPointerDown(pointFromEvent(event), performance.now());
      }}
      onPointerMove={(event) => {
        if (event.buttons === 0 && event.pointerType !== "touch") return;
        onPointerMove(pointFromEvent(event), performance.now());
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        onPointerUp(performance.now());
      }}
      onPointerCancel={(event) => {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        onPointerCancel(performance.now());
      }}
    />
  );
}
