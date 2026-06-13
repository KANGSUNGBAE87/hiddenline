import type { I18n, MessageKey } from "../../i18n";
import type { RunRecord } from "../../storage/schema";

type WeeklyMiniStripProps = {
  localDateKey: string;
  records: RunRecord[];
  ariaLabel: string;
  i18n: I18n;
};

const dayLabelKeys = ["weekday.mon", "weekday.tue", "weekday.wed", "weekday.thu", "weekday.fri", "weekday.sat", "weekday.sun"] satisfies MessageKey[];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function weekKeys(localDateKey: string): string[] {
  const date = new Date(`${localDateKey}T00:00:00`);
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return toDateKey(day);
  });
}

function bestForDate(records: RunRecord[], dateKey: string): RunRecord | null {
  const candidates = records.filter((record) => record.localDateKey === dateKey);
  return candidates.sort((a, b) => Number(b.completed) - Number(a.completed) || (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
}

export function WeeklyMiniStrip({ localDateKey, records, ariaLabel, i18n }: WeeklyMiniStripProps) {
  return (
    <section className="weekly-mini-strip" aria-label={ariaLabel}>
      <div className="weekly-mini-strip__header">
        <span>{ariaLabel}</span>
      </div>
      <div className="weekly-mini-strip__grid">
        {weekKeys(localDateKey).map((dateKey, index) => {
          const record = bestForDate(records, dateKey);
          const state = record?.completed ? "completed" : record ? "attempted" : "empty";
          const dayLabel = i18n.t(dayLabelKeys[index]);
          return (
            <div
              className={`weekly-mini-tile weekly-mini-tile--${state} ${dateKey === localDateKey ? "weekly-mini-tile--today" : ""}`}
              key={dateKey}
              aria-label={`${dayLabel} ${state}`}
            >
              <span>{dayLabel}</span>
              <strong>{record?.score ?? (record ? `${Math.round(record.progressMax * 100)}%` : "-")}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
