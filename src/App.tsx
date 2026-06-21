import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createDailyContext } from "./game/daily";
import { createDailyPackContext, getDailyCourseContext } from "./game/dailyPack";
import { isCourseLengthId, isOverlapDifficultyId, isVisibilityLevelId } from "./game/typeGuards";
import { createI18n, isLocale, localeOptions, type Locale } from "./i18n";
import { createBrowserPlatform } from "./platform/browserPlatform";
import { LocalStorageRepository } from "./storage/localStorageRepository";
import type { PresetId, RunRecord, SessionEvent } from "./storage/schema";
import { HomeScreen } from "./ui/HomeScreen";
import { PlayScreen } from "./ui/PlayScreen";
import { ResultScreen } from "./ui/ResultScreen";
import type { CourseLengthId, DailyLineContext, OverlapDifficultyId, VisibilityLevelId } from "./game/types";
import "./styles/app.css";

type Screen = "home" | "play" | "result";
type ResultState = { record: RunRecord; previousBest: RunRecord | null };
const localeStorageKey = "hiddenline.locale.v1";
const courseLengthStorageKey = "hiddenline.course-length.v1";
const overlapDifficultyStorageKey = "hiddenline.overlap-difficulty.v1";
const visibilityStorageKey = "hiddenline.visibility.v1";
const targetShell = import.meta.env.VITE_TARGET === "apps-in-toss" ? "apps-in-toss" : "google-play";

function eventId() { return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function createDevRecord(daily: DailyLineContext, status: "success" | "failed") {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `${daily.localDateKey}-qa-${status}`,
    mode: "daily",
    localDateKey: daily.localDateKey,
    timezoneOffset: daily.timezoneOffset,
    dailyPackId: daily.dailyPackId,
    lineType: daily.lineType,
    courseLengthId: daily.courseLengthId,
    overlapDifficultyId: daily.overlapDifficultyId,
    seed: daily.seed,
    generatorVersion: daily.generatorVersion,
    generatorProfileId: daily.generatorProfileId,
    scoringProfileId: daily.scoringProfileId,
    difficulty: daily.difficulty,
    lineDifficulty: daily.lineDifficulty,
    visibilityLevel: daily.visibilityLevel,
    completed: status === "success",
    status,
    score: status === "success" ? 920 : null,
    progressMax: status === "success" ? 1 : 0.68,
    accuracy: status === "success" ? 0.94 : 0.81,
    smoothness: status === "success" ? 0.88 : 0.72,
    durationMs: status === "success" ? 24000 : 18600,
    failReason: status === "success" ? null : "off_path",
    createdAt: now,
    updatedAt: now,
  } satisfies RunRecord;
}
function pushEvent(repository: LocalStorageRepository, type: SessionEvent["type"], payload?: Record<string, unknown>) { repository.appendEvent({ id: eventId(), type, createdAt: new Date().toISOString(), payload }); }

// L8: Language switcher now only appears inside Settings sheet
function LanguageSwitcher({ locale, i18n, onChange }: { locale: Locale; i18n: ReturnType<typeof createI18n>; onChange: (locale: Locale) => void }) {
  return (
    <div className="language-switcher" role="radiogroup" aria-label={i18n.t("settings.language")}>
      {localeOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={option.id === locale ? "is-selected" : ""}
          role="radio"
          aria-checked={option.id === locale}
          onClick={() => onChange(option.id)}
        >
          {i18n.t("settings.language." + option.id)}
        </button>
      ))}
    </div>
  );
}

function SettingsSheet({ locale, i18n, onChangeLocale, onClose }: { locale: Locale; i18n: ReturnType<typeof createI18n>; onChangeLocale: (locale: Locale) => void; onClose: () => void }) {
  return (
    <>
      <div className="settings-sheet-backdrop" role="presentation" onClick={onClose} />
      <div className="settings-sheet" role="dialog" aria-modal="true" aria-label={i18n.t("settings.title")}>
        <div className="settings-sheet__inner">
          <h2 className="settings-sheet__title">{i18n.t("settings.title")}</h2>
          <div className="settings-sheet__section">
            <span className="settings-sheet__label">{i18n.t("settings.language")}</span>
            <LanguageSwitcher locale={locale} i18n={i18n} onChange={onChangeLocale} />
          </div>
          <button type="button" className="settings-sheet__done" onClick={onClose}>
            {i18n.t("settings.done")}
          </button>
        </div>
      </div>
    </>
  );
}

// L8: Shell no longer has LanguageSwitcher — only gear icon that opens settings
function TossTopControls({ locale, i18n, onChangeLocale, onExit }: { locale: Locale; i18n: ReturnType<typeof createI18n>; onChangeLocale: (locale: Locale) => void; onExit: () => void }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      <nav className="toss-top-controls" aria-label={i18n.t("shell.navLabel")}>
        <button className="toss-nav-button" type="button" aria-label={i18n.t("settings.title")} onClick={() => setSettingsOpen(true)}>
          <span aria-hidden="true">⚙️</span>
        </button>
        <button className="toss-nav-button" type="button" aria-label={i18n.t("shell.closeMiniApp")} onClick={onExit}>
          <span aria-hidden="true">x</span>
        </button>
      </nav>
      {settingsOpen && (
        <SettingsSheet locale={locale} i18n={i18n} onChangeLocale={onChangeLocale} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

function GooglePlayTopBar({ locale, i18n, onChangeLocale }: { locale: Locale; i18n: ReturnType<typeof createI18n>; onChangeLocale: (locale: Locale) => void }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      <header className="google-play-top-bar" aria-label={i18n.t("shell.googlePlay.navLabel")}>
        <span className="google-play-top-bar__brand">Hidden Line</span>
        <button className="toss-nav-button" type="button" aria-label={i18n.t("settings.title")} onClick={() => setSettingsOpen(true)}>
          <span aria-hidden="true">⚙️</span>
        </button>
      </header>
      {settingsOpen && (
        <SettingsSheet locale={locale} i18n={i18n} onChangeLocale={onChangeLocale} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

function ShellChrome({ locale, i18n, onChangeLocale, onExit }: { locale: Locale; i18n: ReturnType<typeof createI18n>; onChangeLocale: (locale: Locale) => void; onExit: () => void }) {
  return targetShell === "apps-in-toss" ? (
    <TossTopControls locale={locale} i18n={i18n} onChangeLocale={onChangeLocale} onExit={onExit} />
  ) : (
    <GooglePlayTopBar locale={locale} i18n={i18n} onChangeLocale={onChangeLocale} />
  );
}

export default function App() {
  const daily = useMemo(() => createDailyContext(), []);
  const dailyPack = useMemo(() => createDailyPackContext(daily), [daily]);
  const platform = useMemo(() => createBrowserPlatform(), []);
  const repository = useMemo(() => new LocalStorageRepository(platform.storage), [platform]);
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = platform.storage.getItem(localeStorageKey);
    return isLocale(stored) ? stored : "ko";
  });
  const [courseLengthId, setCourseLengthId] = useState<CourseLengthId>(() => {
    const stored = platform.storage.getItem(courseLengthStorageKey);
    return isCourseLengthId(stored) ? stored : "basic";
  });
  const [overlapDifficultyId, setOverlapDifficultyId] = useState<OverlapDifficultyId>(() => {
    const stored = platform.storage.getItem(overlapDifficultyStorageKey);
    return isOverlapDifficultyId(stored) ? stored : "complex";
  });
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<ResultState | null>(null);
  const [playExitSignal, setPlayExitSignal] = useState(0);
  const [selectedVisibilityLevel, setSelectedVisibilityLevel] = useState<VisibilityLevelId>(() => {
    const stored = platform.storage.getItem(visibilityStorageKey);
    return isVisibilityLevelId(stored) ? stored : "normal";
  });
  const [allDailyRecords, setAllDailyRecords] = useState(() => repository.getAllDailyRecords());
  const qaHandledRef = useRef(false);
  const i18n = useMemo(() => createI18n(locale), [locale]);
  const selectedLine = useMemo(
    () => getDailyCourseContext(dailyPack, courseLengthId, overlapDifficultyId, selectedVisibilityLevel),
    [courseLengthId, dailyPack, overlapDifficultyId, selectedVisibilityLevel],
  );
  const todayBest = useMemo(() => repository.getDailyBest(daily.localDateKey, courseLengthId, overlapDifficultyId, selectedVisibilityLevel), [allDailyRecords, courseLengthId, daily.localDateKey, overlapDifficultyId, repository, selectedVisibilityLevel]);
  const previousBest = useMemo(() => repository.getPreviousDailyBest(daily.localDateKey, courseLengthId, overlapDifficultyId, selectedVisibilityLevel), [allDailyRecords, courseLengthId, daily.localDateKey, overlapDifficultyId, repository, selectedVisibilityLevel]);

  function changeLocale(nextLocale: Locale) { platform.storage.setItem(localeStorageKey, nextLocale); setLocale(nextLocale); }
  function refreshRecords() { setAllDailyRecords(repository.getAllDailyRecords()); }
  function updateCourseLength(nextCourseLengthId: CourseLengthId) {
    platform.storage.setItem(courseLengthStorageKey, nextCourseLengthId);
    setCourseLengthId(nextCourseLengthId);
    pushEvent(repository, "course_length_selected", { courseLengthId: nextCourseLengthId });
  }
  function updateOverlapDifficulty(nextOverlapDifficultyId: OverlapDifficultyId) {
    platform.storage.setItem(overlapDifficultyStorageKey, nextOverlapDifficultyId);
    setOverlapDifficultyId(nextOverlapDifficultyId);
    pushEvent(repository, "overlap_difficulty_selected", { overlapDifficultyId: nextOverlapDifficultyId });
  }
  function updateVisibilityLevel(nextVisibilityLevel: VisibilityLevelId) {
    platform.storage.setItem(visibilityStorageKey, nextVisibilityLevel);
    setSelectedVisibilityLevel(nextVisibilityLevel);
    pushEvent(repository, "visibility_level_selected", { visibilityLevel: nextVisibilityLevel });
  }
  function exitMiniApp() { if (screen === "play") { setPlayExitSignal((value) => value + 1); return; } setScreen("home"); setResult(null); if (targetShell === "apps-in-toss" && typeof window !== "undefined") window.close(); }
  function withChrome(content: ReactNode) { return <><ShellChrome locale={locale} i18n={i18n} onChangeLocale={changeLocale} onExit={exitMiniApp} />{content}</>; }

  useEffect(() => {
    const state = repository.getSessionState();
    pushEvent(repository, "app_opened", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel, sessionDateKey: daily.localDateKey });
    pushEvent(repository, "last_session_state_loaded", {
      lastCourseLengthId: state.lastCourseLengthId,
      lastOverlapDifficultyId: state.lastOverlapDifficultyId,
      lastVisibilityLevel: state.lastVisibilityLevel,
      lastSessionDateKey: state.lastSessionDateKey,
      lastSessionOutcome: state.lastSessionOutcome,
    });
    if (state.lastSessionDateKey && state.lastSessionDateKey !== daily.localDateKey) {
      pushEvent(repository, "return_next_day", { fromDateKey: state.lastSessionDateKey, toDateKey: daily.localDateKey });
    }
    if (state.lastCourseLengthId) setCourseLengthId(state.lastCourseLengthId);
    if (state.lastOverlapDifficultyId) setOverlapDifficultyId(state.lastOverlapDifficultyId);
    if (state.lastVisibilityLevel) setSelectedVisibilityLevel(state.lastVisibilityLevel);
  }, []);

  useEffect(() => {
    repository.setSessionState({
      ...repository.getSessionState(),
      lastCourseLengthId: courseLengthId,
      lastOverlapDifficultyId: overlapDifficultyId,
      lastVisibilityLevel: selectedVisibilityLevel,
      lastSessionDateKey: daily.localDateKey,
    });
    pushEvent(repository, "last_session_state_saved", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel, lastSessionDateKey: daily.localDateKey });
  }, [courseLengthId, daily.localDateKey, overlapDifficultyId, repository, selectedVisibilityLevel]);

  useEffect(() => {
    if (result) {
      repository.setSessionState({ ...repository.getSessionState(), lastSessionId: result.record.id, lastSessionOutcome: result.record.status, lastSessionDateKey: result.record.localDateKey });
      pushEvent(repository, "result_viewed", { sessionId: result.record.id, status: result.record.status, courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel });
    }
  }, [courseLengthId, overlapDifficultyId, repository, result, selectedVisibilityLevel]);

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      if (qaHandledRef.current) return;
      const params = new URLSearchParams(window.location.search);
      const qaMode = params.get("qa");
      if (qaMode === "success" || qaMode === "failed") {
        qaHandledRef.current = true;
        const record = createDevRecord(selectedLine, qaMode);
        repository.saveRun(record);
        setResult({ record, previousBest });
        refreshRecords();
        setScreen("result");
      }
    }
  }, [previousBest, repository, selectedLine]);

  if (screen === "play")
    return withChrome(
      <PlayScreen
        daily={selectedLine}
        repository={repository}
        i18n={i18n}
        exitSignal={playExitSignal}
        onHome={() => { refreshRecords(); setScreen("home"); }}
        onResult={(record, prev) => {
          pushEvent(repository, record.status === "success" ? "run_completed" : "run_failed", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel, sessionId: record.id });
          setResult({ record, previousBest: prev });
          refreshRecords();
          setScreen("result");
        }}
      />
    );

  if (screen === "result" && result)
    return withChrome(
      <ResultScreen
        record={result.record}
        previousBest={result.previousBest}
        i18n={i18n}
        onRetry={() => { pushEvent(repository, "retry_same_seed_started", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel, seed: result.record.seed }); setScreen("play"); }}
        onHome={() => setScreen("home")}
        onSelectPreset={(next) => { if (next === "intro") updateCourseLength("short"); pushEvent(repository, "adjacent_preset_selected", { presetId: next }); setScreen("play"); }}
        onDailyEntry={() => { pushEvent(repository, "daily_entry_opened", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel }); setScreen("home"); }}
      />
    );

  return withChrome(
    <HomeScreen
      dailyPack={dailyPack}
      courseLengthId={courseLengthId}
      overlapDifficultyId={overlapDifficultyId}
      selectedLine={selectedLine}
      todayBest={todayBest}
      previousBest={previousBest}
      allDailyRecords={allDailyRecords}
      i18n={i18n}
      onSelectCourseLength={updateCourseLength}
      onSelectOverlapDifficulty={updateOverlapDifficulty}
      onSelectVisibilityLevel={updateVisibilityLevel}
      onStart={() => { pushEvent(repository, "run_started", { courseLengthId, overlapDifficultyId, visibilityLevel: selectedVisibilityLevel }); setScreen("play"); }}
    />
  );
}
