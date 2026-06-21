import type { DailyLineContext, GeneratedPath } from "../../game/types";

type DailyArtifactProps = {
  daily: DailyLineContext;
  path: GeneratedPath;
  ariaLabel: string;
  badgeLabel: string;
};

export function createSmoothPathD(points: GeneratedPath["points"]): string {
  const [first] = points;
  if (!first) return "";
  if (points.length === 1) return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  if (points.length === 2) {
    const second = points[1];
    const controlX = (first.x + second.x) / 2;
    const controlY = (first.y + second.y) / 2;
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${second.x.toFixed(2)} ${second.y.toFixed(2)}`;
  }

  const commands = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    commands.push(`Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`);
  }

  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  commands.push(`Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${last.x.toFixed(2)} ${last.y.toFixed(2)}`);

  return commands.join(" ");
}

export function DailyArtifact({ path, ariaLabel, badgeLabel }: DailyArtifactProps) {
  const pathD = createSmoothPathD(path.points);

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
          <path className="daily-artifact__full-path-shadow" d={pathD} />
          <path className="daily-artifact__full-path" d={pathD} />
          <circle className="daily-artifact__start-halo" cx={path.start.x} cy={path.start.y} r="26" />
          <circle className="daily-artifact__start" cx={path.start.x} cy={path.start.y} r="8" />
          <path className="daily-artifact__destination" d={`M ${path.end.x - 10} ${path.end.y} L ${path.end.x + 10} ${path.end.y} M ${path.end.x} ${path.end.y - 10} L ${path.end.x} ${path.end.y + 10}`} />
        </svg>
        <span className="daily-artifact__badge">{badgeLabel}</span>
      </div>
    </figure>
  );
}
