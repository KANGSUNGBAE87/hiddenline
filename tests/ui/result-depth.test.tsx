import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { createI18n } from "../../src/i18n";
import type { RunRecord } from "../../src/storage/schema";
import { ResultScreen } from "../../src/ui/ResultScreen";

function createRecord(overrides: Partial<RunRecord>): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return { schemaVersion: 1, id: "run-result", mode: "daily", localDateKey: "2026-06-13", timezoneOffset: -540, dailyPackId: "2026-06-13:daily-pack-v1", lineType: "main", seed: "hiddenline-daily:2026-06-13:daily-v1", generatorVersion: "daily-v1", generatorProfileId: "daily-main-normal-v1", scoringProfileId: "official-balanced-v2", difficulty: "normal", lineDifficulty: "normal", visibilityLevel: "normal", completed: false, status: "failed", score: null, progressMax: 0.68, accuracy: 0.64, smoothness: 0.7, durationMs: 18_000, failReason: "off_path", createdAt: now, updatedAt: now, ...overrides };
}

describe("Result depth v2", () => {
  test("failed results show a recap and coaching chip", () => {
    render(<ResultScreen record={createRecord({})} previousBest={null} presetId="intro" i18n={createI18n("ko")} onRetry={vi.fn()} onHome={vi.fn()} onSelectPreset={vi.fn()} onDailyEntry={vi.fn()} />);
    expect(screen.getByRole("img", { name: "이번 선 돌아보기" })).toBeInTheDocument();
    expect(screen.getByText("다음 시도 포인트")).toBeInTheDocument();
  });

  test("successful new best results show a new-best coaching chip", () => {
    render(<ResultScreen record={createRecord({ id: "success-result", completed: true, status: "success", score: 812, progressMax: 1, accuracy: 0.91, smoothness: 0.86, failReason: null })} previousBest={createRecord({ id: "previous-best", completed: true, status: "success", score: 742, progressMax: 1, failReason: null })} presetId="intro" i18n={createI18n("ko")} onRetry={vi.fn()} onHome={vi.fn()} onSelectPreset={vi.fn()} onDailyEntry={vi.fn()} />);
    expect(screen.getByText("새 기록 감각이에요")).toBeInTheDocument();
  });

  test("opens a measurement explanation panel from the result screen", async () => {
    const user = userEvent.setup();
    render(<ResultScreen record={createRecord({ id: "success-result", completed: true, status: "success", score: 812, progressMax: 1, accuracy: 0.91, smoothness: 0.86, failReason: null })} previousBest={null} presetId="intro" i18n={createI18n("ko")} onRetry={vi.fn()} onHome={vi.fn()} onSelectPreset={vi.fn()} onDailyEntry={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "점수는 어떻게 계산되나요?" }));
    expect(screen.getByText(/정확도 40/)).toBeInTheDocument();
  });
});
