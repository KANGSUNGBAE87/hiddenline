import type { Viewport } from "./types";

export const DEFAULT_GAME_VIEWPORT: Viewport = {
  width: 390,
  height: 740,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createGameViewport(width: number | undefined, height: number | undefined): Viewport {
  return {
    width: Math.round(clamp(width ?? DEFAULT_GAME_VIEWPORT.width, 320, 520)),
    height: Math.round(clamp(height ?? DEFAULT_GAME_VIEWPORT.height, 420, 760)),
  };
}

export function createPreviewViewport(): Viewport {
  return DEFAULT_GAME_VIEWPORT;
}
