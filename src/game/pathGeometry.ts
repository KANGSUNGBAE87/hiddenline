import type { PathPoint, Point } from "./types";

export type PathProjection = {
  point: Point;
  distance: number;
  progressT: number;
  segmentIndex: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polylineLength(points: Point[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1], points[index]);
  }
  return length;
}

export function annotatePolyline(points: Point[]): PathPoint[] {
  const totalLength = polylineLength(points);
  let traveled = 0;

  return points.map((point, index) => {
    if (index > 0) {
      traveled += distance(points[index - 1], point);
    }

    return {
      ...point,
      distance: traveled,
      t: totalLength === 0 ? 0 : traveled / totalLength,
    };
  });
}

export function samplePolyline(points: Point[], sampleCount: number): PathPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0], t: 0, distance: 0 }];

  const annotated = annotatePolyline(points);
  return Array.from({ length: sampleCount }, (_, index) => {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    return pointAtT(annotated, t);
  });
}

export function pointAtT(path: PathPoint[], t: number): PathPoint {
  if (path.length === 0) {
    return { x: 0, y: 0, t: 0, distance: 0 };
  }

  const targetT = clamp(t, 0, 1);
  if (targetT <= 0) return path[0];
  if (targetT >= 1) return path[path.length - 1];

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    if (targetT <= next.t) {
      const span = next.t - previous.t || 1;
      const localT = (targetT - previous.t) / span;
      return {
        x: lerp(previous.x, next.x, localT),
        y: lerp(previous.y, next.y, localT),
        distance: lerp(previous.distance, next.distance, localT),
        t: targetT,
      };
    }
  }

  return path[path.length - 1];
}

export function projectPointToPath(point: Point, path: PathPoint[]): PathProjection {
  if (path.length < 2) {
    const fallback = path[0] ?? { x: 0, y: 0, t: 0, distance: 0 };
    return {
      point: fallback,
      distance: distance(point, fallback),
      progressT: fallback.t,
      segmentIndex: 0,
    };
  }

  let best: PathProjection | null = null;

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy || 1;
    const localT = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
    const projected = {
      x: start.x + dx * localT,
      y: start.y + dy * localT,
    };
    const projectedDistance = distance(point, projected);
    const segmentDistance = distance(start, end) * localT;
    const totalDistance = start.distance + segmentDistance;
    const progressT = path[path.length - 1].distance === 0 ? 0 : totalDistance / path[path.length - 1].distance;

    if (!best || projectedDistance < best.distance) {
      best = {
        point: projected,
        distance: projectedDistance,
        progressT,
        segmentIndex: index - 1,
      };
    }
  }

  return best!;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  return o1 * o2 < 0 && o3 * o4 < 0;
}

export function hasSelfIntersection(points: Point[]): boolean {
  for (let first = 0; first < points.length - 1; first += 1) {
    for (let second = first + 2; second < points.length - 1; second += 1) {
      if (first === 0 && second === points.length - 2) continue;
      if (segmentsIntersect(points[first], points[first + 1], points[second], points[second + 1])) {
        return true;
      }
    }
  }

  return false;
}
