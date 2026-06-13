import type { DailyContext } from "../game/types";
import { generatePath } from "../game/pathGenerator";
import type { I18n } from "../i18n";
import type { RunRecord } from "../storage/schema";
import { DailyArtifact } from "./components/DailyArtifact";
import { WeeklyMiniStrip } from "./components/WeeklyMiniStrip";

type HomeScreenProps = {
  daily: DailyContext;
  todayBest: RunRecord | null;
  previousBest?: RunRecord | null;
  allDailyRecords?: RunRecord[];
  i18n: I18n;
  onStart: () => void;
};

function formatScore(record: RunRecord | null): string {
  if (!record || record.score === null) return "-";
  return `${record.score}`;
}

function formatPrevious(record: RunRecord | null | undefined, i18n: I18n): string {
  if (!record || record.score === null) return i18n.t("home.previousRecordEmpty");
  return `${i18n.t("home.previousRecord")} ${record.score}`;
}

export function HomeScreen({ daily, todayBest, previousBest = null, allDailyRecords = [], i18n, onStart }: HomeScreenProps) {
  const path = generatePath({ ...daily, viewport: { width: 390, height: 740 } });

  return (
    <main className="app-screen home-screen">
      <section className="daily-hero" aria-labelledby="daily-title">
        <p className="eyebrow">
          {i18n.t("home.dateLabel")} · {daily.localDateKey}
        </p>
        <h1 id="daily-title">오늘의 숨은선</h1>
        <p className="subtitle">어제보다 더 정확하고 부드럽게</p>

        <DailyArtifact daily={daily} path={path} ariaLabel={i18n.t("home.dailyArtifact")} />

        <div className="daily-stat-grid" aria-live="polite">
          <div className="daily-stat-card daily-stat-card--best">
            <span>{todayBest ? i18n.t("home.bestScore") : i18n.t("home.bestEmpty")}</span>
            <strong>{formatScore(todayBest)}</strong>
          </div>
          <div className="daily-stat-card daily-stat-card--previous">
            <span>{formatPrevious(previousBest, i18n)}</span>
            <strong>{previousBest?.score === null || previousBest?.score === undefined ? "-" : `+${Math.max(0, (todayBest?.score ?? previousBest.score) - previousBest.score)}`}</strong>
          </div>
        </div>

        <WeeklyMiniStrip localDateKey={daily.localDateKey} records={allDailyRecords} ariaLabel={i18n.t("home.weeklyStrip")} />

        <button className="primary-button" type="button" onClick={onStart}>
          {i18n.t("home.startDaily")}
        </button>
      </section>

      <section className="secondary-actions secondary-actions--compact" aria-label="secondary modes">
        <button className="secondary-button" type="button" disabled>
          {i18n.t("home.practiceMode")}
          <span>{i18n.t("home.practiceDisabled")}</span>
        </button>
        <button className="secondary-button" type="button" disabled>
          {i18n.t("home.weeklyMode")}
          <span>{i18n.t("home.weeklyDisabled")}</span>
        </button>
      </section>
    </main>
  );
}
