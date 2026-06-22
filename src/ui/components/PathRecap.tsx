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
  const format = (value: number) => value.toFixed(1);
  const commands = [`M ${format(points[0].x)} ${format(points[0].y)}`];

  if (points.length === 2) {
    const controlX = (points[0].x + points[1].x) / 2;
    const controlY = (points[0].y + points[1].y) / 2;
    commands.push(`Q ${format(controlX)} ${format(controlY)} ${format(points[1].x)} ${format(points[1].y)}`);
    return commands.join(" ");
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    commands.push(`Q ${format(current.x)} ${format(current.y)} ${format(midX)} ${format(midY)}`);
  }

  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  commands.push(`Q ${format(previous.x)} ${format(previous.y)} ${format(last.x)} ${format(last.y)}`);

  return commands.join(" ");
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
