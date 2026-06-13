import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createDailyContext } from "../../src/game/daily";
import { createI18n } from "../../src/i18n";
import type { RunRecord } from "../../src/storage/schema";
import { HomeScreen } from "../../src/ui/HomeScreen";

function createRecord(overrides: Partial<RunRecord>): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "daily-record",
    mode: "daily",
    localDateKey: "2026-06-13",
    timezoneOffset: -540,
    seed: "hiddenline-daily:2026-06-13:daily-v1",
    generatorVersion: "daily-v1",
    difficulty: "normal",
    completed: true,
    status: "success",
    score: 812,
    progressMax: 1,
    accuracy: 0.91,
    smoothness: 0.86,
    durationMs: 24_000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Home depth v2", () => {
  test("shows a daily artifact, compact weekly strip, and previous record context", () => {
    const daily = createDailyContext(new Date("2026-06-13T12:00:00+09:00"));

    render(
      <HomeScreen
        daily={daily}
        todayBest={createRecord({ score: 812 })}
        previousBest={createRecord({ id: "previous", localDateKey: "2026-06-12", score: 742 })}
        allDailyRecords={[
          createRecord({ id: "monday", localDateKey: "2026-06-08", score: 700 }),
          createRecord({ id: "today", localDateKey: "2026-06-13", score: 812 }),
        ]}
        i18n={createI18n("ko")}
        onStart={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "오늘의 선 미리보기" })).toBeInTheDocument();
    expect(screen.getByLabelText("이번 주 기록")).toBeInTheDocument();
    expect(screen.getByText("오늘 최고 기록")).toBeInTheDocument();
    expect(screen.getAllByText("812").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("이전 기록 742")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오늘의 선 시작하기" })).toBeInTheDocument();
  });
});
