import { describe, expect, test } from "vitest";
import { createI18n } from "../../src/i18n";

describe("i18n", () => {
  test("uses Korean fallback instead of exposing raw keys", () => {
    const i18n = createI18n("en");

    expect(i18n.t("home.title")).toBe("Today's Hidden Line");
    expect(i18n.t("missing.key")).toBe("문구를 준비하고 있어요");
  });
});
