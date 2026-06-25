import type { PersistedSessionState, RunRecord, SessionEvent } from "../storage/schema";
import type { BackendTransport } from "../platform/types";

type OwnerScope = {
  coreUserId?: string | null;
  anonymousInstallIdHash?: string | null;
};

type SupabaseTransportConfig = {
  supabaseUrl: string;
  anonKey: string;
};

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export const HIDDENLINE_SUPABASE = {
  projectRef: "jwnuxxxthzkeiiuqopir",
  schema: "public",
  tablePrefix: "hiddenline",
  tables: {
    runRecords: "hiddenline_run_records",
    sessionEvents: "hiddenline_session_events",
    sessionStates: "hiddenline_session_states",
    aiRequests: "hiddenline_ai_requests",
  },
  edgeFunctions: {
    sync: "hiddenline-sync",
    aiCoach: "hiddenline-ai-coach",
  },
} as const;

export const DEEPSEEK_SERVER_ENV_KEYS = ["DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_BASE_URL"] as const;

export type HiddenLineRunRecordRow = {
  run_id: string;
  core_user_id: string | null;
  anonymous_install_id_hash: string | null;
  mode: RunRecord["mode"];
  local_date_key: string;
  timezone_offset: number;
  daily_pack_id: string;
  line_type: RunRecord["lineType"];
  course_length_id: RunRecord["courseLengthId"] | null;
  overlap_difficulty_id: RunRecord["overlapDifficultyId"] | null;
  seed: string;
  generator_version: RunRecord["generatorVersion"];
  generator_profile_id: RunRecord["generatorProfileId"];
  scoring_profile_id: RunRecord["scoringProfileId"];
  difficulty: RunRecord["difficulty"];
  line_difficulty: RunRecord["lineDifficulty"];
  visibility_level: RunRecord["visibilityLevel"];
  completed: boolean;
  status: RunRecord["status"];
  score: number | null;
  measurement_breakdown: RunRecord["measurementBreakdown"] | null;
  progress_max: number;
  accuracy: number;
  smoothness: number;
  warning_peak: number | null;
  warning_count: number | null;
  duration_ms: number | null;
  fail_reason: RunRecord["failReason"];
  created_at: string;
  updated_at: string;
};

export type HiddenLineSessionEventRow = {
  event_id: string;
  core_user_id: string | null;
  anonymous_install_id_hash: string | null;
  event_type: SessionEvent["type"];
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type HiddenLineSessionStateRow = {
  state_id: string;
  core_user_id: string | null;
  anonymous_install_id_hash: string | null;
  state: PersistedSessionState;
  updated_at: string;
};

const blockedPayloadKeys = new Set([
  "comment",
  "email",
  "freeText",
  "memo",
  "message",
  "name",
  "note",
  "phone",
  "providerUserId",
  "rawText",
  "text",
  "tossUserKey",
  "userKey",
]);

function ownerColumns(owner: OwnerScope): Pick<HiddenLineRunRecordRow, "core_user_id" | "anonymous_install_id_hash"> {
  return {
    core_user_id: owner.coreUserId ?? null,
    anonymous_install_id_hash: owner.anonymousInstallIdHash ?? null,
  };
}

function sanitizePayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePayloadValue).filter((item) => item !== undefined);
  if (!value || typeof value !== "object") return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (blockedPayloadKeys.has(key)) continue;
    const nextValue = sanitizePayloadValue(nestedValue);
    if (nextValue !== undefined) sanitized[key] = nextValue;
  }
  return sanitized;
}

export function sanitizeSessionPayload(payload: SessionEvent["payload"]): Record<string, unknown> | null {
  if (!payload) return null;
  const sanitized = sanitizePayloadValue(payload);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return null;
  return Object.keys(sanitized).length > 0 ? sanitized as Record<string, unknown> : null;
}

export function createRunRecordRow(record: RunRecord, owner: OwnerScope): HiddenLineRunRecordRow {
  return {
    run_id: record.id,
    ...ownerColumns(owner),
    mode: record.mode,
    local_date_key: record.localDateKey,
    timezone_offset: record.timezoneOffset,
    daily_pack_id: record.dailyPackId,
    line_type: record.lineType,
    course_length_id: record.courseLengthId ?? null,
    overlap_difficulty_id: record.overlapDifficultyId ?? null,
    seed: record.seed,
    generator_version: record.generatorVersion,
    generator_profile_id: record.generatorProfileId,
    scoring_profile_id: record.scoringProfileId,
    difficulty: record.difficulty,
    line_difficulty: record.lineDifficulty,
    visibility_level: record.visibilityLevel,
    completed: record.completed,
    status: record.status,
    score: record.score,
    measurement_breakdown: record.measurementBreakdown ?? null,
    progress_max: record.progressMax,
    accuracy: record.accuracy,
    smoothness: record.smoothness,
    warning_peak: record.warningPeak ?? null,
    warning_count: record.warningCount ?? null,
    duration_ms: record.durationMs,
    fail_reason: record.failReason,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function createSessionEventRow(event: SessionEvent, owner: OwnerScope): HiddenLineSessionEventRow {
  return {
    event_id: event.id,
    ...ownerColumns(owner),
    event_type: event.type,
    payload: sanitizeSessionPayload(event.payload),
    created_at: event.createdAt,
  };
}

export function createSessionStateRow(
  stateId: string,
  state: PersistedSessionState,
  owner: OwnerScope,
  updatedAt: string,
): HiddenLineSessionStateRow {
  return {
    state_id: stateId,
    ...ownerColumns(owner),
    state,
    updated_at: updatedAt,
  };
}

function normalizeSupabaseFunctionUrl(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const functionName = path.replace(/^\/+/, "");
  return `${base}/functions/v1/${functionName}`;
}

export function createSupabaseBackendTransport(
  config: SupabaseTransportConfig,
  fetcher: Fetcher = globalThis.fetch.bind(globalThis),
): BackendTransport {
  return {
    async post<TResponse>(path: string, body: unknown): Promise<TResponse | null> {
      const response = await fetcher(normalizeSupabaseFunctionUrl(config.supabaseUrl, path), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.anonKey}`,
          apikey: config.anonKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Supabase function ${path} failed with ${response.status}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) as TResponse : null;
    },
  };
}
