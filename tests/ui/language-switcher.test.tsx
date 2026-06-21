import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

async function renderApp(target?: "google-play" | "apps-in-toss") {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (target) vi.stubEnv("VITE_TARGET", target);
  const { default: App } = await import("../../src/App");
  return render(<App />);
}

describe("language switcher", () => {
  test("switches between Korean and English and stores the locale via settings sheet", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    await renderApp("google-play");

    // Language switcher is now behind settings gear icon (L8)
    await user.click(screen.getByRole("button", { name: "설정" }));
    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(screen.getByRole("heading", { name: "Today's Hidden Line" })).toBeInTheDocument();
    expect(window.localStorage.getItem("hiddenline.locale.v1")).toBe("en");

    // Switch back to Korean
    await user.click(screen.getByRole("radio", { name: "한국어" }));
    expect(screen.getByRole("heading", { name: "오늘의 숨은선" })).toBeInTheDocument();
  });
});
