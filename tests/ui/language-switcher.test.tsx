import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../../src/App";

describe("language switcher", () => {
  test("switches between Korean and English and stores the locale", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("heading", { name: "Today's Hidden Line" })).toBeInTheDocument();
    expect(window.localStorage.getItem("hiddenline.locale.v1")).toBe("en");

    await user.click(screen.getByRole("button", { name: "한국어" }));
    expect(screen.getByRole("heading", { name: "오늘의 숨은선" })).toBeInTheDocument();
  });
});
