import { noopAnalytics, noopBackend, noopHaptics } from "./noopAdapters";
import type { Platform, ShareAdapter, StorageAdapter } from "./types";

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createStorage(): StorageAdapter {
  if (typeof window === "undefined") return createMemoryStorage();

  try {
    const testKey = "__hiddenline_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}

function createShare(): ShareAdapter {
  return {
    canShare() {
      const nav = typeof navigator === "undefined" ? null : navigator;
      return Boolean(nav && "share" in nav);
    },
    async share(payload) {
      const nav =
        typeof navigator === "undefined"
          ? null
          : (navigator as Navigator & {
              share?: (payload: { title: string; text: string }) => Promise<void>;
              clipboard?: Clipboard;
            });
      if (nav?.share) {
        await nav.share(payload);
        return;
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(`${payload.title}\n${payload.text}`);
      }
    },
  };
}

export function createBrowserPlatform(): Platform {
  return {
    storage: createStorage(),
    haptics: noopHaptics,
    analytics: noopAnalytics,
    share: createShare(),
    backend: noopBackend,
  };
}
