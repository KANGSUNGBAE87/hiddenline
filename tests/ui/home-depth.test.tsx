import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { createDailyContext } from "../../src/game/daily";
import { createDailyPackContext, getDailyCourseContext } from "../../src/game/dailyPack";
import { generatePath } from "../../src/game/pathGenerator";
import type { CourseLengthId, GeneratedPath, OverlapDifficultyId, VisibilityLevelId } from "../../src/game/types";
import { createPreviewViewport } from "../../src/game/viewport";
import { createI18n } from "../../src/i18n";
import { HomeScreen } from "../../src/ui/HomeScreen";
import { createSmoothPathD } from "../../src/ui/components/DailyArtifact";

function renderHome(overrides: Partial<{
  courseLengthId: CourseLengthId;
  overlapDifficultyId: OverlapDifficultyId;
  visibilityLevel: VisibilityLevelId;
  onSelectCourseLength: (value: CourseLengthId) => void;
  onSelectOverlapDifficulty: (value: OverlapDifficultyId) => void;
  onSelectVisibilityLevel: (value: VisibilityLevelId) => void;
}> = {}) {
  const daily = createDailyContext(new Date("2026-06-21T12:00:00+09:00"));
  const dailyPack = createDailyPackContext(daily);
  const courseLengthId = overrides.courseLengthId ?? "basic";
  const overlapDifficultyId = overrides.overlapDifficultyId ?? "complex";
  const visibilityLevel = overrides.visibilityLevel ?? "normal";
  const selectedLine = getDailyCourseContext(dailyPack, courseLengthId, overlapDifficultyId, visibilityLevel);

  return render(
    <HomeScreen
      dailyPack={dailyPack}
      courseLengthId={courseLengthId}
      overlapDifficultyId={overlapDifficultyId}
      selectedLine={selectedLine}
      todayBest={null}
      previousBest={null}
      allDailyRecords={[]}
      i18n={createI18n("ko")}
      onSelectCourseLength={overrides.onSelectCourseLength ?? vi.fn()}
      onSelectOverlapDifficulty={overrides.onSelectOverlapDifficulty ?? vi.fn()}
      onSelectVisibilityLevel={overrides.onSelectVisibilityLevel ?? vi.fn()}
      onStart={vi.fn()}
    />,
  );
}

function getHeroPathD(): string {
  return document.querySelector(".daily-artifact__full-path")?.getAttribute("d") ?? "";
}

function pathD(path: GeneratedPath): string {
  return createSmoothPathD(path.points);
}

describe("Home course/overlap/sight layout", () => {
  test("centers the selected line preview and summarizes the three play axes", () => {
    renderHome();

    expect(screen.getByRole("img", { name: "오늘의 선 미리보기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오늘의 선 시작하기" })).toBeInTheDocument();
    expect(screen.getByText("기본 코스 · 곡선 Normal · 시야 보통")).toBeInTheDocument();
    expect(screen.queryByText(/5개 난이도/)).not.toBeInTheDocument();
    expect(screen.queryByText("공식 프리셋")).not.toBeInTheDocument();
  });

  test("uses an example curve in the Home preview instead of revealing today's actual line", () => {
    const daily = createDailyContext(new Date("2026-06-21T12:00:00+09:00"));
    const dailyPack = createDailyPackContext(daily);
    const selectedLine = getDailyCourseContext(dailyPack, "basic", "complex", "normal");
    const actualDailyPath = generatePath({ ...selectedLine, viewport: createPreviewViewport() });

    renderHome();

    const previewD = getHeroPathD();
    expect(previewD).not.toBe(pathD(actualDailyPath));
    expect(previewD).toContain("Q");
    expect(previewD).not.toContain(" L ");
  });

  test("shows course length, overlap difficulty, and sight as separate centered controls", async () => {
    const user = userEvent.setup();
    const onSelectCourseLength = vi.fn();
    const onSelectOverlapDifficulty = vi.fn();
    const onSelectVisibilityLevel = vi.fn();
    renderHome({ onSelectCourseLength, onSelectOverlapDifficulty, onSelectVisibilityLevel });

    await user.click(screen.getByRole("button", { name: "긴 코스" }));
    await user.click(screen.getByRole("button", { name: "Normal" }));
    await user.click(screen.getByRole("button", { name: "좁음" }));

    expect(onSelectCourseLength).toHaveBeenCalledWith("long");
    expect(onSelectOverlapDifficulty).toHaveBeenCalledWith("complex");
    expect(onSelectVisibilityLevel).toHaveBeenCalledWith("hard");
  });

  test("shows curve difficulty as Intro to Expert with a 3 plus 2 layout", () => {
    renderHome();

    const overlapGroup = screen.getByRole("group", { name: "곡선 난도" });
    const overlapButtons = within(overlapGroup).getAllByRole("button");

    expect(overlapButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Intro",
      "Easy",
      "Normal",
      "Hard",
      "Expert",
    ]);
    expect(within(overlapGroup).getByText("가장 완만")).toBeInTheDocument();
    expect(within(overlapGroup).getByText("약한 굽이")).toBeInTheDocument();
    expect(within(overlapGroup).getByText("기본 굽이")).toBeInTheDocument();
    expect(within(overlapGroup).getByText("깊은 굽이")).toBeInTheDocument();
    expect(within(overlapGroup).getByText("가장 복잡")).toBeInTheDocument();
    expect(overlapGroup.querySelector(".choice-grid--five")).toBeInTheDocument();
  });
});
