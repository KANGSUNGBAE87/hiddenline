import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, String(value)),
      get length() {
        return store.size;
      },
    },
  });
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  globalAlpha: 1,
  shadowBlur: 0,
  shadowColor: "",
  fillStyle: "",
  lineCap: "round",
  lineJoin: "round",
  lineWidth: 1,
  strokeStyle: "",
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
