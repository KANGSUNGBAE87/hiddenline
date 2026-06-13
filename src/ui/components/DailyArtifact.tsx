import { pointAtT } from "../../game/pathGeometry";
import type { DailyContext, GeneratedPath, PathPoint } from "../../game/types";

type DailyArtifactProps = {
  daily: DailyContext;
  path: GeneratedPath;
  ariaLabel: string;
};

function toPathData(points: PathPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`, ...rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)].join(" ");
}

export function DailyArtifact({ daily, path, ariaLabel }: DailyArtifactProps) {
  const hintEnd = pointAtT(path.points, 0.18);
  const hint = [...path.points.filter((point) => point.t <= 0.18), hintEnd];

  return (
    <figure className="daily-artifact">
      <div className="daily-artifact__stage">
        <svg
          className="daily-artifact__preview"
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${path.viewport.width} ${path.viewport.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <path className="daily-artifact__hint" d={toPathData(hint)} pathLength={1} />
          <circle className="daily-artifact__start-halo" cx={path.start.x} cy={path.start.y} r="26" />
          <circle className="daily-artifact__start" cx={path.start.x} cy={path.start.y} r="8" />
          <path className="daily-artifact__destination" d={`M ${path.end.x - 10} ${path.end.y} L ${path.end.x + 10} ${path.end.y} M ${path.end.x} ${path.end.y - 10} L ${path.end.x} ${path.end.y + 10}`} />
        </svg>
        <span className="daily-artifact__badge">{daily.seed.slice(-8).toUpperCase()}</span>
      </div>
    </figure>
  );
}
