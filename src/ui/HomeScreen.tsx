import { useMemo } from "react";
import { generatePath } from "../game/pathGenerator";
import { createPreviewViewport } from "../game/viewport";
import type { CourseLengthId, DailyLineContext, DailyPackContext, OverlapDifficultyId, VisibilityLevelId } from "../game/types";
import type { I18n } from "../i18n";
import type { RunRecord } from "../storage/schema";
import { DailyArtifact } from "./components/DailyArtifact";

type HomeScreenProps = {
  dailyPack: DailyPackContext;
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  selectedLine: DailyLineContext;
  todayBest: RunRecord | null;
  previousBest?: RunRecord | null;
  allDailyRecords?: RunRecord[];
  i18n: I18n;
  onSelectCourseLength: (courseLengthId: CourseLengthId) => void;
  onSelectOverlapDifficulty: (overlapDifficultyId: OverlapDifficultyId) => void;
  onSelectVisibilityLevel: (visibilityLevel: VisibilityLevelId) => void;
  onStart: () => void;
};

const courseLengthOptions = [
  { id: "short", labelKey: "courseLength.short", descriptionKey: "courseLength.short.description" },
  { id: "basic", labelKey: "courseLength.basic", descriptionKey: "courseLength.basic.description" },
  { id: "long", labelKey: "courseLength.long", descriptionKey: "courseLength.long.description" },
  { id: "longRun", labelKey: "courseLength.longRun", descriptionKey: "courseLength.longRun.description" },
  { id: "marathon", labelKey: "courseLength.marathon", descriptionKey: "courseLength.marathon.description" },
] as const satisfies readonly { id: CourseLengthId; labelKey: string; descriptionKey: string }[];

const overlapDifficultyOptions = [
  { id: "light", labelKey: "overlapDifficulty.light", descriptionKey: "overlapDifficulty.light.description" },
  { id: "normal", labelKey: "overlapDifficulty.normal", descriptionKey: "overlapDifficulty.normal.description" },
  { id: "complex", labelKey: "overlapDifficulty.complex", descriptionKey: "overlapDifficulty.complex.description" },
  { id: "hard", labelKey: "overlapDifficulty.hard", descriptionKey: "overlapDifficulty.hard.description" },
  { id: "master", labelKey: "overlapDifficulty.master", descriptionKey: "overlapDifficulty.master.description" },
] as const satisfies readonly { id: OverlapDifficultyId; labelKey: string; descriptionKey: string }[];

const visibilityOptions = [
  { id: "easy", labelKey: "visibilityLevelShort.easy", descriptionKey: "visibilityLevelShort.easy.description" },
  { id: "normal", labelKey: "visibilityLevelShort.normal", descriptionKey: "visibilityLevelShort.normal.description" },
  { id: "hard", labelKey: "visibilityLevelShort.hard", descriptionKey: "visibilityLevelShort.hard.description" },
] as const satisfies readonly { id: VisibilityLevelId; labelKey: string; descriptionKey: string }[];

function formatDateKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function createWeekDateKeys(localDateKey: string): string[] {
  const anchor = new Date(`${localDateKey}T00:00:00`);
  if (Number.isNaN(anchor.getTime())) return [localDateKey];
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateKeyLocal(date);
  });
}

function ChoiceGroup<TId extends string>({
  label,
  options,
  selectedId,
  onChange,
  i18n,
}: {
  label: string;
  options: readonly { id: TId; labelKey: string; descriptionKey: string }[];
  selectedId: TId;
  onChange: (value: TId) => void;
  i18n: I18n;
}) {
  return (
    <section className="choice-group" role="group" aria-label={label}>
      <h2>{label}</h2>
      <div className={`choice-grid${options.length === 5 ? " choice-grid--five" : ""}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`choice-pill${option.id === selectedId ? " choice-pill--selected" : ""}`}
            aria-label={i18n.t(option.labelKey)}
            aria-pressed={option.id === selectedId}
            onClick={() => onChange(option.id)}
          >
            <span>{i18n.t(option.labelKey)}</span>
            <small>{i18n.t(option.descriptionKey)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HomeScreen({
  dailyPack,
  courseLengthId,
  overlapDifficultyId,
  selectedLine,
  todayBest,
  allDailyRecords = [],
  i18n,
  onSelectCourseLength,
  onSelectOverlapDifficulty,
  onSelectVisibilityLevel,
  onStart,
}: HomeScreenProps) {
  const path = useMemo(() => generatePath({ ...selectedLine, viewport: createPreviewViewport() }), [selectedLine]);
  const weekDayKeys = useMemo(() => createWeekDateKeys(dailyPack.localDateKey), [dailyPack.localDateKey]);
  const matchingRecords = useMemo(
    () => allDailyRecords.filter(
      (record) =>
        record.courseLengthId === courseLengthId &&
        record.overlapDifficultyId === overlapDifficultyId &&
        record.visibilityLevel === selectedLine.visibilityLevel,
    ),
    [allDailyRecords, courseLengthId, overlapDifficultyId, selectedLine.visibilityLevel],
  );

  const weekDayState = useMemo(() => {
    return weekDayKeys.map((dateKey) => {
      if (dateKey === dailyPack.localDateKey) return "today" as const;
      const record = matchingRecords.find((candidate) => candidate.localDateKey === dateKey);
      if (record?.completed) return "completed" as const;
      if (record) return "attempted" as const;
      return dateKey < dailyPack.localDateKey ? "past" as const : "future" as const;
    });
  }, [dailyPack.localDateKey, matchingRecords, weekDayKeys]);

  const courseLabel = i18n.t(`courseLength.${courseLengthId}`);
  const overlapLabel = i18n.t(`overlapDifficulty.${overlapDifficultyId}`);
  const sightLabel = i18n.t(`visibilityLevelShort.${selectedLine.visibilityLevel}`);
  const setupSummary = `${courseLabel} · ${i18n.t("home.summary.overlap")} ${overlapLabel} · ${i18n.t("home.summary.sight")} ${sightLabel}`;

  return (
    <main className="app-screen home-screen">
      <section className="daily-hero" aria-labelledby="daily-title">
        <div className="home-hero-copy">
          <p className="eyebrow">{i18n.t("home.dateLabel")} · {dailyPack.localDateKey}</p>
          <h1 id="daily-title">{i18n.t("home.title")}</h1>
          <p className="subtitle">{i18n.t("home.subtitle")}</p>
        </div>

        <DailyArtifact
          daily={selectedLine}
          path={path}
          ariaLabel={i18n.t("home.dailyArtifact")}
          badgeLabel={i18n.t("home.dailyBadge")}
        />

        <div className="setup-summary" aria-label={i18n.t("home.setupSummary")}>
          <strong>{setupSummary}</strong>
          <span>
            {todayBest?.score != null
              ? `${i18n.t("home.bestScore")} ${todayBest.score}`
              : i18n.t("home.bestEmpty")}
          </span>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onStart}
        >
          {i18n.t("home.startDaily")}
        </button>
      </section>

      <section className="setup-panel" aria-label={i18n.t("home.setupControls")}>
        <ChoiceGroup
          label={i18n.t("home.courseLength.title")}
          options={courseLengthOptions}
          selectedId={courseLengthId}
          onChange={onSelectCourseLength}
          i18n={i18n}
        />
        <ChoiceGroup
          label={i18n.t("home.overlapDifficulty.title")}
          options={overlapDifficultyOptions}
          selectedId={overlapDifficultyId}
          onChange={onSelectOverlapDifficulty}
          i18n={i18n}
        />
        <ChoiceGroup
          label={i18n.t("home.sight.title")}
          options={visibilityOptions}
          selectedId={selectedLine.visibilityLevel}
          onChange={onSelectVisibilityLevel}
          i18n={i18n}
        />
      </section>

      <div className="weekly-dots" role="group" aria-label={i18n.t("home.dotLabel")}>
        {weekDayKeys.map((dateKey, idx) => (
          <span
            key={dateKey}
            className={`weekly-dot weekly-dot--${weekDayState[idx]}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </main>
  );
}
