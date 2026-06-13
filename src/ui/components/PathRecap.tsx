import { pointAtT } from "../../game/pathGeometry";
import type { GeneratedPath, PathPoint } from "../../game/types";

type PathRecapProps = {
  path: GeneratedPath;
  progressT: number;
  status: "success" | "failed";
  ariaLabel: string;
};

function toPathData(points: PathPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`, ...rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)].join(" ");
}

function completedPoints(path: PathPoint[], progressT: number): PathPoint[] {
  const clampedProgress = Math.max(0, Math.min(1, progressT));
  const reached = path.filter((point) => point.t <= clampedProgress);
  return [...reached, pointAtT(path, clampedProgress)];
}

export function PathRecap({ path, progressT, status, ariaLabel }: PathRecapProps) {
  const completed = completedPoints(path.points, progressT);
  const marker = pointAtT(path.points, status === "success" ? 1 : progressT);
  const completedColor = status === "success" ? "#7fd6be" : "#6baed0";
  const markerColor = status === "success" ? "#7fd6be" : "#df7d73";

  return (
    <svg
      className={`path-recap path-recap--${status}`}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${path.viewport.width} ${path.viewport.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path className="path-recap__hidden" d={toPathData(path.points)} pathLength={1} />
      <path
        className="path-recap__completed"
        d={toPathData(completed)}
        stroke={completedColor}
        pathLength={1}
      />
      <circle className="path-recap__start" cx={path.start.x} cy={path.start.y} r="8" />
      <circle className="path-recap__marker" cx={marker.x} cy={marker.y} r={status === "success" ? 9 : 8} fill={markerColor} />
    </svg>
  );
}
