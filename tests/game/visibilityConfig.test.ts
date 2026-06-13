import { describe, expect, test } from "vitest";
import { VISIBILITY_DEFAULTS } from "../../src/game/config";

describe("visibility tuning", () => {
  test("keeps the active reveal compact around the touch point", () => {
    expect(VISIBILITY_DEFAULTS.touchFocusRadius).toBeLessThanOrEqual(60);
    expect(VISIBILITY_DEFAULTS.pathStrokeWidth).toBeLessThanOrEqual(3);
    expect(VISIBILITY_DEFAULTS.activeBacktrackT + VISIBILITY_DEFAULTS.forwardPreviewT).toBeLessThanOrEqual(0.028);
    expect(VISIBILITY_DEFAULTS.forwardPreviewOpacity).toBeLessThanOrEqual(0.08);
  });
});
