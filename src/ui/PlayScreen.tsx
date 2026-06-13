import { useEffect, useMemo, useRef, useState } from "react";
import { createDailyContext } from "../game/daily";
import { generatePath } from "../game/pathGenerator";
import { createSessionMachine, type SessionSnapshot } from "../game/sessionMachine";
import type { DailyContext, GeneratedPath, Point } from "../game/types";
import type { I18n } from "../i18n";
import { LocalStorageRepository } from "../storage/localStorageRepository";
import type { RunRecord } from "../storage/schema";
import { CanvasGame } from "./components/CanvasGame";
import { IconButton } from "./components/IconButton";

type PlayScreenProps = {
  daily: DailyContext;
  repository: LocalStorageRepository;
  i18n: I18n;
  onHome: () => void;
  onResult: (record: RunRecord, previousBest: RunRecord | null) => void;
};

declare global {
  interface Window {
    __HIDDEN_LINE_QA_PATH__?: GeneratedPath;
    __HIDDEN_LINE_QA_SNAPSHOT__?: SessionSnapshot;
  }
}

function createRunId(context: DailyContext, status: "success" | "failed", endedAtMs: number | null): string {
  return `${context.localDateKey}-${status}-${Math.round(endedAtMs ?? performance.now())}`;
}

export function PlayScreen({ daily, repository, i18n, onHome, onResult }: PlayScreenProps) {
  const path = useMemo(() => generatePath({ ...daily, viewport: { width: 390, height: 740 } }), [daily]);
  const machineRef = useRef(createSessionMachine(path));
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => machineRef.current.getSnapshot());
  const finishedRef = useRef(false);

  function updateSnapshot() {
    const next = machineRef.current.getSnapshot();
    setSnapshot(next);
    if (!finishedRef.current && (next.status === "success" || next.status === "failed")) {
      finishedRef.current = true;
      const now = new Date().toISOString();
      const previousBest = repository.getDailyBest(daily.localDateKey);
      const record: RunRecord = {
        schemaVersion: 1,
        id: createRunId(daily, next.status, next.endedAtMs),
        mode: "daily",
        localDateKey: daily.localDateKey,
        timezoneOffset: daily.timezoneOffset,
        seed: daily.seed,
        generatorVersion: daily.generatorVersion,
        difficulty: daily.difficulty,
        completed: next.status === "success",
        status: next.status,
        score: next.status === "success" ? next.score : null,
        progressMax: next.progressMax,
        accuracy: next.metrics.accuracy,
        smoothness: next.metrics.smoothness,
        durationMs: next.metrics.durationMs,
        failReason: next.failureReason,
        createdAt: now,
        updatedAt: now,
      };
      repository.saveRun(record);
      onResult(record, previousBest);
    }
  }

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return undefined;
    window.__HIDDEN_LINE_QA_PATH__ = path;
    window.__HIDDEN_LINE_QA_SNAPSHOT__ = snapshot;
    return () => {
      delete window.__HIDDEN_LINE_QA_PATH__;
      delete window.__HIDDEN_LINE_QA_SNAPSHOT__;
    };
  }, [path, snapshot]);

  useEffect(() => {
    if (snapshot.status !== "tracing" && snapshot.status !== "warning") return undefined;

    let frameId = 0;
    const tick = () => {
      machineRef.current.tick(performance.now());
      updateSnapshot();
      if (finishedRef.current) return;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [snapshot.status]);

  function helperText() {
    if (snapshot.status === "ready") return i18n.t("play.readyHint");
    if (snapshot.status === "warning") return i18n.t("play.warning");
    if (snapshot.status === "success") return i18n.t("result.successTitle");
    if (snapshot.status === "failed") return i18n.t("result.failedTitle");
    return i18n.t("play.traceHint");
  }

  function move(method: "pointerDown" | "pointerMove", point: Point, timeMs: number) {
    machineRef.current[method](point, timeMs);
    updateSnapshot();
  }

  return (
    <main className="app-screen play-screen">
      <header className="play-header">
        <IconButton icon="‹" label={i18n.t("play.back")} onClick={onHome} />
        <div>
          <p className="eyebrow">{createDailyContext().localDateKey}</p>
          <h1>{i18n.t("play.title")}</h1>
        </div>
        <strong className="progress-percent">{Math.round(snapshot.progressMax * 100)}%</strong>
      </header>

      <div className="progress-track" aria-label="progress">
        <span style={{ width: `${Math.round(snapshot.progressMax * 100)}%` }} />
      </div>

      <section className="play-field" aria-label="play field">
        <CanvasGame
          path={path}
          snapshot={snapshot}
          onPointerDown={(point, timeMs) => move("pointerDown", point, timeMs)}
          onPointerMove={(point, timeMs) => move("pointerMove", point, timeMs)}
          onPointerUp={(timeMs) => {
            machineRef.current.pointerUp(timeMs);
            updateSnapshot();
          }}
          onPointerCancel={(timeMs) => {
            machineRef.current.pointerCancel(timeMs);
            updateSnapshot();
          }}
        />
      </section>

      <p className={`play-helper play-helper--${snapshot.status}`}>{helperText()}</p>

      <ol
        className={`micro-tutorial ${snapshot.status === "ready" ? "" : "micro-tutorial--hidden"}`}
        aria-label={i18n.t("play.microTutorial")}
        aria-hidden={snapshot.status === "ready" ? undefined : true}
      >
        <li>{i18n.t("play.tutorialStart")}</li>
        <li>{i18n.t("play.tutorialReveal")}</li>
        <li>{i18n.t("play.tutorialRecover")}</li>
      </ol>
    </main>
  );
}
