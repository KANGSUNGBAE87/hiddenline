import type { I18n } from "../i18n";
import { deriveRunFeedback } from "../game/runFeedback";
import { generatePath } from "../game/pathGenerator";
import type { RunRecord } from "../storage/schema";
import { MetricRow } from "./components/MetricRow";
import { PathRecap } from "./components/PathRecap";

type ResultScreenProps = {
  record: RunRecord;
  previousBest: RunRecord | null;
  i18n: I18n;
  onRetry: () => void;
  onHome: () => void;
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function duration(value: number | null): string {
  if (value === null) return "-";
  return `${(value / 1000).toFixed(1)}s`;
}

export function ResultScreen({ record, previousBest, i18n, onRetry, onHome }: ResultScreenProps) {
  const success = record.status === "success";
  const path = generatePath({
    localDateKey: record.localDateKey,
    timezoneOffset: record.timezoneOffset,
    seed: record.seed,
    generatorVersion: record.generatorVersion,
    difficulty: record.difficulty,
    viewport: { width: 390, height: 740 },
  });
  const feedback = deriveRunFeedback(record, previousBest);
  const scoreDelta =
    success && previousBest?.score !== null && previousBest?.score !== undefined && record.score !== null
      ? record.score - previousBest.score
      : null;
  const successSubtitle =
    scoreDelta === null
      ? i18n.t("result.newBest")
      : scoreDelta > 0
        ? `${i18n.t("result.newBest")} +${scoreDelta}`
        : scoreDelta < 0
          ? `${i18n.t("result.bestDelta")} ${scoreDelta}`
          : i18n.t("result.newBest");

  return (
    <main className={`app-screen result-screen result-screen--${record.status}`}>
      <section className="result-hero">
        <p className="eyebrow">{record.localDateKey}</p>
        <h1>{success ? i18n.t("result.successTitle") : i18n.t("result.failedTitle")}</h1>
        <p className="subtitle">
          {success ? successSubtitle : i18n.t(`fail.${record.failReason ?? "off_path"}`)}
        </p>
      </section>

      <section className="result-recap" aria-labelledby="result-recap-title">
        <div className="section-heading">
          <h2 id="result-recap-title">{i18n.t("result.pathRecap")}</h2>
          <p>{i18n.t("result.replayHint")}</p>
        </div>
        <PathRecap path={path} progressT={record.progressMax} status={record.status} ariaLabel={i18n.t("result.pathRecap")} />
      </section>

      <section className="metric-grid" aria-label="result metrics">
        <MetricRow
          label={i18n.t(success ? "result.score" : "result.progress")}
          value={success && record.score !== null ? `${record.score}` : percent(record.progressMax)}
          tone={success ? "success" : "failed"}
        />
        <MetricRow label={i18n.t("result.accuracy")} value={percent(record.accuracy)} />
        <MetricRow label={i18n.t("result.smoothness")} value={percent(record.smoothness)} />
        <MetricRow label={i18n.t("result.duration")} value={duration(record.durationMs)} />
      </section>

      <section className={`feedback-panel feedback-panel--${feedback.tone}`} aria-labelledby="run-feedback-title">
        <div className="section-heading">
          <h2 id="run-feedback-title">{i18n.t(feedback.title)}</h2>
          <p>{i18n.t(feedback.coachingLine)}</p>
        </div>
        <div className="feedback-chip-row" aria-label={i18n.t("result.reason")}>
          {feedback.chips.map((chip) => (
            <span className="feedback-chip" key={chip}>
              {i18n.t(chip)}
            </span>
          ))}
        </div>
      </section>

      <div className="result-actions">
        <button className="primary-button" type="button" onClick={onRetry}>
          {i18n.t("result.retry")}
        </button>
        <button className="secondary-button secondary-button--plain" type="button" onClick={onHome}>
          {i18n.t("result.home")}
        </button>
      </div>
    </main>
  );
}
