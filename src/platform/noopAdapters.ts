import type { AnalyticsAdapter, BackendTransport, HapticsAdapter, ShareAdapter } from "./types";

export const noopHaptics: HapticsAdapter = {
  async impact() {
    return undefined;
  },
};

export const noopAnalytics: AnalyticsAdapter = {
  track() {
    return undefined;
  },
};

export const noopShare: ShareAdapter = {
  canShare() {
    return false;
  },
  async share() {
    return undefined;
  },
};

export const noopBackend: BackendTransport = {
  async post() {
    return null;
  },
};
