import { useState, useCallback } from "react";
import type { I18n } from "../i18n";
import { deriveRunFeedback } from "../game/runFeedback";
import { createMeasurementBreakdown } from "../game/measurement";
import { generatePath } from "../game/pathGenerator";
import { createPreviewViewport } from "../game/viewport";
import type { PresetId, RunRecord } from "../storage/schema";
import { MetricRow } from "./components/MetricRow";
import { PathRecap } from "./components/PathRecap";

type ResultScreenProps = {
  record: RunRecord;
  previousBest: RunRecord | null;
  presetId?: PresetId;
  i18n: I18n;
  onRetry: () => void;
  onHome: () => void;
  onSelectPreset?: (presetId: PresetId) => void;
  onDailyEntry: () => void;
};

const measurementOrder = ["accuracy", "smoothness", "calmness", "completion", "pace"] as const;

const feedbackOptions = [
  { id: "tooEasy", key: "result.feedback.tooEasy" as const },
  { id: "justRight", key: "result.feedback.justRight" as const },
  { id: "tooHard", key: "result.feedback.tooHard" as const },
];

export function ResultScreen({
  record, previousBest, i18n, onRetry, onHome, onSelectPreset, onDailyEntry,
}: ResultScreenProps) {
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [feedbackSelected, setFeedbackSelected] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const measurementBreakdown =
    record.measurementBreakdown ??
    createMeasurementBreakdown(
      {
        accuracy: record.accuracy,
        smoothness: record.smoothness,
        durationMs: record.durationMs,
        warningPeak: record.warningPeak ?? 0,
        warningCount: record.warningCount ?? 0,
      },
      record.progressMax,
    );

  const path = generatePath({
    localDateKey: record.localDateKey,
    timezoneOffset: record.timezoneOffset,
    seed: record.seed,
    generatorVersion: record.generatorVersion,
    lineType: record.lineType,
    generatorProfileId: record.generatorProfileId,
    difficulty: record.difficulty,
    lineDifficulty: record.lineDifficulty,
    visibilityLevel: record.visibilityLevel,
    courseLengthId: record.courseLengthId,
    overlapDifficultyId: record.overlapDifficultyId,
    viewport: createPreviewViewport(),
  });

  const feedback = deriveRunFeedback(record, previousBest);
  const scoreDelta =
    record.status === "success" &&
    previousBest?.score !== null &&
    previousBest?.score !== undefined &&
    record.score !== null
      ? record.score - previousBest.score
      : null;

  const handleFeedbackSelect = useCallback((id: string) => {
    setFeedbackSelected(id);
    setFeedbackSubmitted(true);
  }, []);

  return (
    <main className={`app-screen result-screen result-screen--${record.status}`}>
      {/* Hero */}
      <section className="result-hero">
        <p className="eyebrow">
          {record.localDateKey} · {i18n.t(`line.${record.lineType}.name`)}
        </p>
        <h1>
          {record.status === "success"
            ? i18n.t("result.successTitle")
            : i18n.t("result.failedTitle")}
        </h1>
        <p className="subtitle">
          {record.status === "success"
            ? scoreDelta === null
              ? i18n.t("result.newBest")
              : scoreDelta > 0
                ? `${i18n.t("result.newBest")} +${scoreDelta}`
                : i18n.t("result.newBest")
            : i18n.t(`fail.${record.failReason ?? "off_path"}`)}
        </p>
      </section>

      {/* Metrics grid */}
      <section className="metric-grid" aria-label="result metrics">
        <MetricRow
          label={i18n.t(record.status === "success" ? "result.score" : "result.progress")}
          value={
            record.status === "success" && record.score !== null
              ? `${record.score}`
              : `${Math.round(record.progressMax * 100)}%`
          }
          tone={record.status}
        />
        <MetricRow label={i18n.t("result.accuracy")} value={`${Math.round(record.accuracy * 100)}%`} />
        <MetricRow label={i18n.t("result.smoothness")} value={`${Math.round(record.smoothness * 100)}%`} />
        <MetricRow label={i18n.t("result.calmness")} value={record.warningPeak != null ? `${Math.round((1 - (record.warningPeak ?? 0)) * 100)}%` : "-"} />
      </section>

      {/* Feedback panel with title + coaching */}
      <section className={`result-recap result-recap--${record.status === "success" ? "success" : "learning"}`} aria-label={i18n.t("result.reason")}>
        <strong>{i18n.t(feedback.title)}</strong>
        <p>{i18n.t(feedback.coachingLine)}</p>
      </section>

      {/* Path recap */}
      <section className="result-recap" aria-label={i18n.t("result.pathRecap")}>
        <PathRecap path={path} progressT={record.progressMax} status={record.status} ariaLabel={i18n.t("result.pathRecap")} />
        <p className="eyebrow">{i18n.t("result.replayHint")}</p>
      </section>

      {/* Primary CTA — inline only (H4: no sticky bar, single appearance) */}
      <button type="button" className="primary-button" onClick={onRetry}>
        {i18n.t("result.retry")}
      </button>

      {/* Secondary actions */}
      <div className="secondary-actions secondary-actions--compact">
        <button type="button" className="secondary-button" onClick={onHome}>
          {i18n.t("result.home")}
        </button>
        <button type="button" className="secondary-button" onClick={() => setMoreOpen((o) => !o)}>
          <span>{i18n.t("home.result.moreActions")}</span>
        </button>
      </div>

      {/* More actions */}
      {moreOpen && (
        <div className="secondary-actions secondary-actions--compact">
          <button type="button" className="secondary-button secondary-button--plain" onClick={() => { onSelectPreset?.("intro"); }}>
            {i18n.t("home.preset.intro")}
          </button>
          <button type="button" className="secondary-button secondary-button--plain" onClick={onDailyEntry}>
            {i18n.t("home.result.dailyEntry")}
          </button>
        </div>
      )}

      {/* Measurement explanation */}
      <section className="measurement-panel" aria-label={i18n.t("measurement.panelLabel")}>
        <button
          type="button"
          className="measurement-panel__toggle"
          aria-expanded={measurementOpen}
          onClick={() => setMeasurementOpen((o) => !o)}
        >
          {i18n.t("measurement.howScore")}
        </button>
        {measurementOpen && (
          <div className="measurement-panel__body">
            <p>{i18n.t("measurement.formula")}</p>
            <ul>
              {measurementOrder.map((metric) => (
                <li key={metric}>
                  <strong>{i18n.t(`result.${metric}`)}</strong>: {i18n.t(`measurement.${metric}.explanation`)}
                </li>
              ))}
            </ul>
            <p className="measurement-formula">{i18n.t("measurement.subtext")}</p>
          </div>
        )}
      </section>

      {/* L7: Difficulty feedback — 3 chips, NOT textarea */}
      <section className="feedback-section" aria-label={i18n.t("result.feedback.title")}>
        <p className="feedback-section__title">{i18n.t("result.feedback.title")}</p>
        <div className="feedback-chip-row" role="radiogroup" aria-label={i18n.t("result.feedback.title")}>
          {feedbackOptions.map((opt) => {
            const isSelected = feedbackSelected === opt.id;
            const isDisabled = feedbackSubmitted && !isSelected;
            return (
              <button
                key={opt.id}
                type="button"
                className={`feedback-chip${isSelected ? " feedback-chip--selected" : ""}${isDisabled ? " feedback-chip--disabled" : ""}`}
                role="radio"
                aria-checked={isSelected}
                disabled={feedbackSubmitted && !isSelected}
                onClick={() => handleFeedbackSelect(opt.id)}
              >
                {isSelected && <span aria-hidden="true">✓</span>}
                {i18n.t(opt.key)}
              </button>
            );
          })}
        </div>
        {feedbackSubmitted && (
          <p className="feedback-toast">{i18n.t("result.feedback.thanks")}</p>
        )}
      </section>
    </main>
  );
}
