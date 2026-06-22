import type { DailyLineContext, GeneratedPath } from "../../game/types";

type DailyArtifactProps = {
  daily: DailyLineContext;
  path: GeneratedPath;
  ariaLabel: string;
  badgeLabel: string;
};

export function DailyArtifact({ path, ariaLabel, badgeLabel }: DailyArtifactProps) {
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
          <circle className="daily-artifact__start-halo" cx={path.start.x} cy={path.start.y} r="26" />
          <circle className="daily-artifact__start" cx={path.start.x} cy={path.start.y} r="8" />
          <path className="daily-artifact__destination" d={`M ${path.end.x - 10} ${path.end.y} L ${path.end.x + 10} ${path.end.y} M ${path.end.x} ${path.end.y - 10} L ${path.end.x} ${path.end.y + 10}`} />
        </svg>
        <span className="daily-artifact__badge">{badgeLabel}</span>
      </div>
    </figure>
  );
}
