import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GeneratedPath } from "../../src/game/types";

async function renderApp(target?: "google-play" | "apps-in-toss") {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (target) vi.stubEnv("VITE_TARGET", target);
  const { default: App } = await import("../../src/App");
  return render(<App />);
}

describe("first playable app flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  test("Google Play shell hides Toss-specific controls and shows settings gear", async () => {
    const user = userEvent.setup();
    await renderApp("google-play");

    expect(screen.getByRole("heading", { name: "오늘의 숨은선" })).toBeInTheDocument();
    expect(screen.getByText("어제보다 더 정확하고 부드럽게")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "더보기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "미니앱 종료" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("숨은선 상단 메뉴")).toBeInTheDocument();

    // Language is now behind settings gear icon
    await user.click(screen.getByRole("button", { name: "설정" }));
    await user.click(screen.getByRole("radio", { name: "English" }));
    expect(screen.getByRole("heading", { name: "Today's Hidden Line" })).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  test("Apps in Toss shell keeps Toss-specific controls when explicitly targeted", async () => {
    await renderApp("apps-in-toss");

    // Apps in Toss has gear icon for settings + exit button
    expect(screen.getByRole("button", { name: "설정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "미니앱 종료" })).toBeInTheDocument();
  });

  test("Start button opens Play Ready", async () => {
    const user = userEvent.setup();
    await renderApp("google-play");

    await user.click(screen.getByRole("button", { name: "오늘의 선 시작하기" }));

    expect(screen.getByText("시작점에 손가락을 올려보세요")).toBeInTheDocument();
    expect(screen.getByLabelText("짧은 안내")).toBeInTheDocument();
    expect(screen.getByText("손끝 주변만 선이 보여요")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
    // Language switcher no longer directly visible in play screen
    expect(screen.queryByLabelText("언어")).not.toBeInTheDocument();
  });

  test("Google Play shell does not call window.close from top chrome", async () => {
    const user = userEvent.setup();
    const closeSpy = vi.spyOn(window, "close").mockImplementation(() => undefined);
    await renderApp("google-play");

    expect(screen.queryByRole("button", { name: "미니앱 종료" })).not.toBeInTheDocument();
    expect(closeSpy).not.toHaveBeenCalled();
    closeSpy.mockRestore();
  });

  test("Play back asks before leaving an in-progress trace", async () => {
    const user = userEvent.setup();
    await renderApp("google-play");

    await user.click(screen.getByRole("button", { name: "오늘의 선 시작하기" }));
    await waitFor(() => expect(window.__HIDDEN_LINE_QA_PATH__).toBeTruthy());
    const path = window.__HIDDEN_LINE_QA_PATH__ as GeneratedPath;
    const canvas = screen.getByTestId("game-canvas");

    fireEvent.pointerDown(canvas, { clientX: path.start.x, clientY: path.start.y, pointerId: 1, buttons: 1 });
    fireEvent.pointerMove(canvas, { clientX: path.points[2].x, clientY: path.points[2].y, pointerId: 1, buttons: 1 });
    await user.click(screen.getByRole("button", { name: "오늘 화면" }));

    expect(screen.getByRole("dialog", { name: "진행 중인 선이 있어요" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계속하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이번 시도 종료" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "홈으로 나가기" })).toBeInTheDocument();
  });
});
