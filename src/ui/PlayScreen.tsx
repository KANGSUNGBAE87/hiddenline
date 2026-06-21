import { useEffect, useMemo, useRef, useState } from "react";
import { GAMEPLAY_DEFAULTS } from "../game/config";
import { applyDeadzone, smoothPoint } from "../game/inputSmoothing";
import { generatePath } from "../game/pathGenerator";
import { createPreviewViewport } from "../game/viewport";
import { createMeasurementBreakdown } from "../game/measurement";
import { createSessionMachine, type SessionSnapshot } from "../game/sessionMachine";
import type { DailyLineContext, GeneratedPath, Point } from "../game/types";
import type { I18n } from "../i18n";
import { LocalStorageRepository } from "../storage/localStorageRepository";
import type { RunRecord } from "../storage/schema";
import { CanvasGame } from "./components/CanvasGame";
import { IconButton } from "./components/IconButton";

type PlayScreenProps = {
  daily: DailyLineContext;
  repository: LocalStorageRepository;
  i18n: I18n;
  exitSignal: number;
  onHome: () => void;
  onResult: (record: RunRecord, previousBest: RunRecord | null) => void;
};

declare global {
  interface Window {
    __HIDDEN_LINE_QA_PATH__?: GeneratedPath;
    __HIDDEN_LINE_QA_SNAPSHOT__?: SessionSnapshot;
  }
}

function createRunId(context: DailyLineContext, status: "success" | "failed", endedAtMs: number | null): string {
  return `${context.localDateKey}-${context.courseLengthId}-${context.overlapDifficultyId}-${context.visibilityLevel}-${status}-${Math.round(endedAtMs ?? performance.now())}`;
}

export function PlayScreen({ daily, repository, i18n, exitSignal, onHome, onResult }: PlayScreenProps) {
  const path = useMemo(() => generatePath({ ...daily, viewport: createPreviewViewport() }), [daily]);
  const machineRef = useRef(createSessionMachine(path));
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => machineRef.current.getSnapshot());
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const finishedRef = useRef(false);
  const smoothedPointRef = useRef<Point | null>(null);
  const rawPointRef = useRef<Point | null>(null);

  useEffect(() => {
    machineRef.current = createSessionMachine(path);
    smoothedPointRef.current = null;
    rawPointRef.current = null;
    finishedRef.current = false;
    setSnapshot(machineRef.current.getSnapshot());
  }, [path]);

  function updateSnapshot() {
    const next = machineRef.current.getSnapshot();
    setSnapshot(next);
    if (!finishedRef.current && (next.status === "success" || next.status === "failed")) {
      finishRun(next, next.status, next.failureReason, "result");
    }
  }

  function createRecordFromSnapshot(next: SessionSnapshot, status: "success" | "failed", failReason: RunRecord["failReason"]): RunRecord {
    const endedAtMs = next.endedAtMs ?? performance.now();
    const durationMs =
      next.metrics.durationMs ?? (next.startedAtMs === null ? null : Math.max(0, endedAtMs - next.startedAtMs));
    const metrics = {
      ...next.metrics,
      durationMs,
    };
    const now = new Date().toISOString();
    const measurementBreakdown = createMeasurementBreakdown(metrics, next.progressMax, Math.max(1, path.totalLength / 0.1));

    return {
      schemaVersion: 1,
      id: createRunId(daily, status, endedAtMs),
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
      score: status === "success" && daily.official ? next.score : null,
      measurementBreakdown,
      progressMax: next.progressMax,
      accuracy: metrics.accuracy,
      smoothness: metrics.smoothness,
      warningPeak: metrics.warningPeak,
      warningCount: metrics.warningCount,
      durationMs: metrics.durationMs,
      failReason,
      createdAt: now,
      updatedAt: now,
    };
  }

  function finishRun(
    next: SessionSnapshot,
    status: "success" | "failed",
    failReason: RunRecord["failReason"],
    route: "result" | "home",
  ) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const previousBest = repository.getDailyBest(daily.localDateKey, daily.courseLengthId, daily.overlapDifficultyId, daily.visibilityLevel);
    const record = createRecordFromSnapshot(next, status, failReason);
    repository.saveRun(record);
    if (route === "result") {
      onResult(record, previousBest);
    } else {
      onHome();
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
    const deadzonedPoint =
      method === "pointerMove"
        ? applyDeadzone(rawPointRef.current, point, GAMEPLAY_DEFAULTS.deadzonePx)
        : point;
    const nextPoint =
      method === "pointerMove"
        ? smoothPoint(smoothedPointRef.current, deadzonedPoint, GAMEPLAY_DEFAULTS.smoothingAlpha)
        : point;

    rawPointRef.current = deadzonedPoint;
    smoothedPointRef.current = nextPoint;
    machineRef.current[method](nextPoint, timeMs);
    updateSnapshot();
  }

  function requestHome() {
    const current = machineRef.current.getSnapshot();
    if (current.status === "ready" && current.progressMax <= 0) {
      onHome();
      return;
    }
    setExitConfirmOpen(true);
  }

  function abortRun(route: "result" | "home") {
    setExitConfirmOpen(false);
    finishRun(machineRef.current.getSnapshot(), "failed", "aborted", route);
  }

  useEffect(() => {
    if (exitSignal <= 0 || finishedRef.current) return;
    const current = machineRef.current.getSnapshot();
    if (current.status === "ready" && current.progressMax <= 0) {
      onHome();
      return;
    }
    finishRun(current, "failed", "aborted", "home");
  }, [exitSignal]);

  return (
    <main className="app-screen play-screen">
      <header className="play-header">
        <IconButton icon="‹" label={i18n.t("play.back")} onClick={requestHome} />
        <div>
          <p className="eyebrow">{daily.localDateKey}</p>
          <h1>{i18n.t(daily.displayNameKey)}</h1>
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
            smoothedPointRef.current = null;
            rawPointRef.current = null;
            machineRef.current.pointerUp(timeMs);
            updateSnapshot();
          }}
          onPointerCancel={(timeMs) => {
            smoothedPointRef.current = null;
            rawPointRef.current = null;
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

      {exitConfirmOpen ? (
        <div className="exit-dialog-backdrop" role="presentation">
          <section className="exit-dialog" role="dialog" aria-modal="true" aria-labelledby="play-exit-title">
            <h2 id="play-exit-title">{i18n.t("play.exitTitle")}</h2>
            <p>{i18n.t("play.exitBody")}</p>
            <div className="exit-dialog__actions exit-dialog__actions--stacked">
              <button className="secondary-button secondary-button--plain" type="button" onClick={() => setExitConfirmOpen(false)}>
                {i18n.t("play.exitContinue")}
              </button>
              <button className="secondary-button secondary-button--plain" type="button" onClick={() => abortRun("result")}>
                {i18n.t("play.exitFinish")}
              </button>
              <button className="primary-button primary-button--danger" type="button" onClick={() => abortRun("home")}>
                {i18n.t("play.exitHome")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
