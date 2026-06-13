import type { Point } from "./types";

export function smoothPoint(previous: Point | null, next: Point, alpha: number): Point {
  if (!previous) return next;

  return {
    x: previous.x * (1 - alpha) + next.x * alpha,
    y: previous.y * (1 - alpha) + next.y * alpha,
  };
}

export function applyDeadzone(previous: Point | null, next: Point, deadzonePx: number): Point {
  if (!previous) return next;
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;

  return Math.hypot(dx, dy) < deadzonePx ? previous : next;
}
