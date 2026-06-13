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

export type Platform = {
  storage: StorageAdapter;
  haptics: HapticsAdapter;
  analytics: AnalyticsAdapter;
  share: ShareAdapter;
  backend: BackendTransport;
};
