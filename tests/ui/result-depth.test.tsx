import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createI18n } from "../../src/i18n";
import type { RunRecord } from "../../src/storage/schema";
import { ResultScreen } from "../../src/ui/ResultScreen";

function createRecord(overrides: Partial<RunRecord>): RunRecord {
  const now = "2026-06-13T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "run-result",
    mode: "daily",
    localDateKey: "2026-06-13",
    timezoneOffset: -540,
    seed: "hiddenline-daily:2026-06-13:daily-v1",
    generatorVersion: "daily-v1",
    difficulty: "normal",
    completed: false,
    status: "failed",
    score: null,
    progressMax: 0.68,
    accuracy: 0.64,
    smoothness: 0.7,
    durationMs: 18_000,
    failReason: "off_path",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Result depth v2", () => {
  test("failed results show a path recap and one coaching chip", () => {
    render(
      <ResultScreen
        record={createRecord({})}
        previousBest={null}
        i18n={createI18n("ko")}
        onRetry={vi.fn()}
        onHome={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "이번 선 돌아보기" })).toBeInTheDocument();
    expect(screen.getByText("다음 시도 포인트")).toBeInTheDocument();
    expect(screen.getByText("커브 구간을 조금 천천히")).toBeInTheDocument();
    expect(screen.getByText("이번엔 커브에서 손끝을 조금 늦춰보세요")).toBeInTheDocument();
  });

  test("successful new best results show a new-best coaching chip", () => {
    render(
      <ResultScreen
        record={createRecord({
          id: "success-result",
          completed: true,
          status: "success",
          score: 812,
          progressMax: 1,
          accuracy: 0.91,
          smoothness: 0.86,
          failReason: null,
        })}
        previousBest={createRecord({
          id: "previous-best",
          completed: true,
          status: "success",
          score: 742,
          progressMax: 1,
          failReason: null,
        })}
        i18n={createI18n("ko")}
        onRetry={vi.fn()}
        onHome={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "이번 선 돌아보기" })).toBeInTheDocument();
    expect(screen.getByText("새 기록 감각이에요")).toBeInTheDocument();
    expect(screen.getByText("이전 최고보다 더 안정적으로 이어졌어요")).toBeInTheDocument();
  });
});
