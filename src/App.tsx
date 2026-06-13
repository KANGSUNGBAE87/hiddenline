import { useEffect, useMemo, useRef, useState } from "react";
import { createDailyContext } from "./game/daily";
import { createI18n } from "./i18n";
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

function createDevSuccessRecord(daily: ReturnType<typeof createDailyContext>): RunRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `${daily.localDateKey}-qa-success`,
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
    durationMs: 24_000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createDevFailedRecord(daily: ReturnType<typeof createDailyContext>): RunRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `${daily.localDateKey}-qa-failed`,
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
    durationMs: 18_600,
    failReason: "off_path",
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const daily = useMemo(() => createDailyContext(), []);
  const i18n = useMemo(() => createI18n("ko"), []);
  const repository = useMemo(() => new LocalStorageRepository(createBrowserPlatform().storage), []);
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<ResultState | null>(null);
  const [todayBest, setTodayBest] = useState(() => repository.getDailyBest(daily.localDateKey));
  const [allDailyRecords, setAllDailyRecords] = useState(() => repository.getAllDailyRecords());
  const qaHandledRef = useRef(false);
  const previousBest = useMemo(
    () => repository.getPreviousDailyBest(daily.localDateKey),
    [allDailyRecords, daily.localDateKey, repository],
  );

  function refreshRecords() {
    setTodayBest(repository.getDailyBest(daily.localDateKey));
    setAllDailyRecords(repository.getAllDailyRecords());
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
    return (
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
      />
    );
  }

  if (screen === "result" && result) {
    return (
      <ResultScreen
        record={result.record}
        previousBest={result.previousBest}
        i18n={i18n}
        onRetry={() => setScreen("play")}
        onHome={() => setScreen("home")}
      />
    );
  }

  return (
    <HomeScreen
      daily={daily}
      todayBest={todayBest}
      previousBest={previousBest}
      allDailyRecords={allDailyRecords}
      i18n={i18n}
      onStart={() => setScreen("play")}
    />
  );
}
