import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../../src/App";

describe("first playable app flow", () => {
  test("Home renders 오늘의 숨은선", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "오늘의 숨은선" })).toBeInTheDocument();
    expect(screen.getByText("어제보다 더 정확하고 부드럽게")).toBeInTheDocument();
  });

  test("Start button opens Play Ready", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "오늘의 선 시작하기" }));

    expect(screen.getByText("시작점에 손가락을 올려보세요")).toBeInTheDocument();
    expect(screen.getByLabelText("짧은 안내")).toBeInTheDocument();
    expect(screen.getByText("손끝 주변만 선이 보여요")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
  });
});
