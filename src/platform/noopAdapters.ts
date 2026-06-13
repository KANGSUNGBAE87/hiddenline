import type { AdsAdapter, AnalyticsAdapter, AuthAdapter, BackendTransport, HapticsAdapter, PaymentAdapter, ShareAdapter } from "./types";

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

export const noopAuth: AuthAdapter = {
  status: "stub",
  plannedProviders: ["apps_in_toss", "google_play"],
  async getCurrentUser() {
    return { status: "anonymous" };
  },
};

export const noopPayment: PaymentAdapter = {
  status: "stub",
  plannedStores: ["apps_in_toss_iap", "google_play_billing"],
  async hasEntitlement() {
    return false;
  },
};

export const noopAds: AdsAdapter = {
  status: "stub",
  plannedNetworks: ["apps_in_toss_ads", "admob"],
  async showPlacement() {
    return { shown: false, reason: "ads_disabled_in_mvp" };
  },
};
