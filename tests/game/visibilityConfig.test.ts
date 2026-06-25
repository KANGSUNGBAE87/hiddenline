import { describe, expect, test } from "vitest";
import { VISIBILITY_DEFAULTS, VISIBILITY_LEVELS } from "../../src/game/config";

describe("visibility tuning", () => {
  test("keeps touch radius tuning but doubles the rendered forward preview", () => {
    expect(VISIBILITY_LEVELS.easy.revealRadiusPx).toBe(248);
    expect(VISIBILITY_LEVELS.normal.revealRadiusPx).toBe(176);
    expect(VISIBILITY_LEVELS.hard.revealRadiusPx).toBe(124);
    expect(VISIBILITY_LEVELS.easy.touchFocusRadiusPx).toBe(140);
    expect(VISIBILITY_LEVELS.normal.touchFocusRadiusPx).toBe(108);
    expect(VISIBILITY_LEVELS.hard.touchFocusRadiusPx).toBe(84);
    expect(VISIBILITY_LEVELS.easy.forwardPreviewT).toBe(0.018);
    expect(VISIBILITY_LEVELS.normal.forwardPreviewT).toBe(0.011);
    expect(VISIBILITY_LEVELS.hard.forwardPreviewT).toBe(0.006);
    expect(VISIBILITY_LEVELS.normal.pathWidthPx).toBe(28);
    expect(VISIBILITY_LEVELS.normal.failDistancePx).toBe(44);
    expect(VISIBILITY_DEFAULTS.touchFocusRadius).toBe(116);
    expect(VISIBILITY_DEFAULTS.pathStrokeWidth).toBe(2.8);
    expect(VISIBILITY_DEFAULTS.activeBacktrackT).toBe(0.024);
    expect(VISIBILITY_DEFAULTS.forwardPreviewRenderMultiplier).toBe(4);
    expect(VISIBILITY_DEFAULTS.forwardPreviewOpacity).toBeLessThanOrEqual(0.08);
  });
});
