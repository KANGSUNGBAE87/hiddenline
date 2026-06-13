import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createDailyContext } from "./game/daily";
import { createI18n, isLocale, localeOptions, type Locale } from "./i18n";
import { createBrowserPlatform } from "./platform/browserPlatform";
import { LocalStorageRepository } from "./storage/localStorageRepository";
import type { RunRecord } from "./storage/schema";
import { HomeScreen } from "./ui/HomeScreen";
import { PlayScreen } from "./ui/PlayScreen";
import { ResultScreen } from "./ui/ResultScreen";
import "./styles/app.css";

type Screen = "home" | "play" | "result";
type ResultState = {
  record: RunRecord;
  previousBest: RunRecord | null;
};

const localeStorageKey = "hiddenline.locale.v1";

function createDevSuccessRecord(daily: ReturnType<typeof createDailyContext>): RunRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: daily.localDateKey + "-qa-success",
    mode: "daily",
    localDateKey: daily.localDateKey,
    timezoneOffset: daily.timezoneOffset,
    seed: daily.seed,
    generatorVersion: daily.generatorVersion,
    difficulty: daily.difficulty,
    completed: true,
    status: "success",
    score: 920,
    progressMax: 1,
    accuracy: 0.94,
    smoothness: 0.88,
    durationMs: 24000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createDevFailedRecord(daily: ReturnType<typeof createDailyContext>): RunRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: daily.localDateKey + "-qa-failed",
    mode: "daily",
    localDateKey: daily.localDateKey,
    timezoneOffset: daily.timezoneOffset,
    seed: daily.seed,
    generatorVersion: daily.generatorVersion,
    difficulty: daily.difficulty,
    completed: false,
    status: "failed",
    score: null,
    progressMax: 0.68,
    accuracy: 0.81,
    smoothness: 0.72,
    durationMs: 18600,
    failReason: "off_path",
    createdAt: now,
    updatedAt: now,
  };
}

type LanguageSwitcherProps = {
  locale: Locale;
  i18n: ReturnType<typeof createI18n>;
  onChange: (locale: Locale) => void;
};

function LanguageSwitcher({ locale, i18n, onChange }: LanguageSwitcherProps) {
  return (
    <div className="language-switcher" aria-label={i18n.t("settings.language")}>
      {localeOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={option.id === locale ? "is-selected" : ""}
          aria-pressed={option.id === locale}
          onClick={() => onChange(option.id)}
        >
          {i18n.t("settings.language." + option.id)}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const daily = useMemo(() => createDailyContext(), []);
  const platform = useMemo(() => createBrowserPlatform(), []);
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = platform.storage.getItem(localeStorageKey);
    return isLocale(stored) ? stored : "ko";
  });
  const i18n = useMemo(() => createI18n(locale), [locale]);
  const repository = useMemo(() => new LocalStorageRepository(platform.storage), [platform]);
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<ResultState | null>(null);
  const [todayBest, setTodayBest] = useState(() => repository.getDailyBest(daily.localDateKey));
  const [allDailyRecords, setAllDailyRecords] = useState(() => repository.getAllDailyRecords());
  const qaHandledRef = useRef(false);
  const previousBest = useMemo(
    () => repository.getPreviousDailyBest(daily.localDateKey),
    [allDailyRecords, daily.localDateKey, repository],
  );

  function changeLocale(nextLocale: Locale) {
    platform.storage.setItem(localeStorageKey, nextLocale);
    setLocale(nextLocale);
  }

  function refreshRecords() {
    setTodayBest(repository.getDailyBest(daily.localDateKey));
    setAllDailyRecords(repository.getAllDailyRecords());
  }

  function withChrome(content: ReactNode) {
    return (
      <>
        <LanguageSwitcher locale={locale} i18n={i18n} onChange={changeLocale} />
        {content}
      </>
    );
  }

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (qaHandledRef.current) return;
      const qaMode = params.get("qa");
      if (qaMode === "success" || qaMode === "failed") {
        qaHandledRef.current = true;
        const previousBest = repository.getDailyBest(daily.localDateKey);
        const record = qaMode === "success" ? createDevSuccessRecord(daily) : createDevFailedRecord(daily);
        repository.saveRun(record);
        setResult({ record, previousBest });
        refreshRecords();
        setScreen("result");
      }
    }
  }, [daily, previousBest, repository]);

  if (screen === "play") {
    return withChrome(
      <PlayScreen
        daily={daily}
        repository={repository}
        i18n={i18n}
        onHome={() => setScreen("home")}
        onResult={(record, previousBest) => {
          setResult({ record, previousBest });
          refreshRecords();
          setScreen("result");
        }}
      />,
    );
  }

  if (screen === "result" && result) {
    return withChrome(
      <ResultScreen
        record={result.record}
        previousBest={result.previousBest}
        i18n={i18n}
        onRetry={() => setScreen("play")}
        onHome={() => setScreen("home")}
      />,
    );
  }

  return withChrome(
    <HomeScreen
      daily={daily}
      todayBest={todayBest}
      previousBest={previousBest}
      allDailyRecords={allDailyRecords}
      i18n={i18n}
      onStart={() => setScreen("play")}
    />,
  );
}
