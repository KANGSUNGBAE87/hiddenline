export type StorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type HapticsAdapter = {
  impact(type: "warning" | "success" | "failed"): Promise<void>;
};

export type AnalyticsAdapter = {
  track(eventName: string, properties?: Record<string, unknown>): void;
};

export type ShareAdapter = {
  canShare(): boolean;
  share(payload: { title: string; text: string }): Promise<void>;
};

export type BackendTransport = {
  post<TResponse>(path: string, body: unknown): Promise<TResponse | null>;
};

export type AdapterStatus = "stub" | "enabled";
export type AuthProviderId = "apps_in_toss" | "google_play";
export type PaymentStoreId = "apps_in_toss_iap" | "google_play_billing";
export type AdNetworkId = "apps_in_toss_ads" | "admob";

export type AuthUser =
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string; displayName?: string };

export type AuthAdapter = {
  status: AdapterStatus;
  plannedProviders: AuthProviderId[];
  getCurrentUser(): Promise<AuthUser>;
};

export type EntitlementId = "premium_monthly" | "remove_ads" | "extra_daily_lines";

export type PaymentAdapter = {
  status: AdapterStatus;
  plannedStores: PaymentStoreId[];
  hasEntitlement(entitlementId: EntitlementId): Promise<boolean>;
};

export type AdPlacementId = "home_footer" | "result_recap";

export type AdsAdapter = {
  status: AdapterStatus;
  plannedNetworks: AdNetworkId[];
  showPlacement(placementId: AdPlacementId): Promise<{ shown: boolean; reason?: "ads_disabled_in_mvp" | "placement_unavailable" }>;
};

export type Platform = {
  storage: StorageAdapter;
  haptics: HapticsAdapter;
  analytics: AnalyticsAdapter;
  share: ShareAdapter;
  backend: BackendTransport;
  auth: AuthAdapter;
  payment: PaymentAdapter;
  ads: AdsAdapter;
};
