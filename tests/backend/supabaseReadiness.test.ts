import { describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEEPSEEK_SERVER_ENV_KEYS,
  HIDDENLINE_SUPABASE,
  createSessionEventRow,
  createSupabaseBackendTransport,
  createRunRecordRow,
} from "../../src/backend/hiddenLineSupabase";
import type { RunRecord, SessionEvent } from "../../src/storage/schema";

function runRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  const now = "2026-06-26T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "run-1",
    mode: "daily",
    localDateKey: "2026-06-26",
    timezoneOffset: -540,
    dailyPackId: "2026-06-26:daily-pack-v1",
    lineType: "main",
    courseLengthId: "basic",
    overlapDifficultyId: "complex",
    seed: "hiddenline-daily:2026-06-26:organic-v5",
    generatorVersion: "organic-v5",
    generatorProfileId: "daily-main-normal-v1",
    scoringProfileId: "official-balanced-v2",
    difficulty: "normal",
    lineDifficulty: "normal",
    visibilityLevel: "normal",
    completed: true,
    status: "success",
    score: 830,
    measurementBreakdown: {
      accuracy: { value: 0.94, displayPercent: 94, weight: 40, explanationKey: "result.measurement.accuracy" },
      smoothness: { value: 0.88, displayPercent: 88, weight: 20, explanationKey: "result.measurement.smoothness" },
      calmness: { value: 0.86, displayPercent: 86, weight: 15, explanationKey: "result.measurement.calmness" },
      completion: { value: 1, displayPercent: 100, weight: 15, explanationKey: "result.measurement.completion" },
      pace: { value: 0.8, displayPercent: 80, weight: 10, explanationKey: "result.measurement.pace" },
    },
    progressMax: 1,
    accuracy: 0.94,
    smoothness: 0.88,
    warningPeak: 12,
    warningCount: 1,
    durationMs: 24_000,
    failReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Supabase backend readiness", () => {
  test("locks Hidden Line tables to hiddenline_ prefix and RLS-first schema", () => {
    expect(HIDDENLINE_SUPABASE.tablePrefix).toBe("hiddenline");
    expect(Object.values(HIDDENLINE_SUPABASE.tables)).toEqual([
      "hiddenline_run_records",
      "hiddenline_session_events",
      "hiddenline_session_states",
      "hiddenline_ai_requests",
    ]);

    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260626010000_hiddenline_backend.sql"),
      "utf8",
    );
    expect(migration).toContain("create table if not exists public.hiddenline_run_records");
    expect(migration).toContain("create table if not exists public.hiddenline_session_events");
    expect(migration).toContain("create table if not exists public.hiddenline_session_states");
    expect(migration).toContain("create table if not exists public.hiddenline_ai_requests");
    expect(migration).toContain("alter table public.hiddenline_run_records enable row level security");
    expect(migration).not.toContain("public.hl_run_records");
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)\s*with\s*check\s*\(\s*true\s*\)/i);
  });

  test("maps local run records to prefixed Supabase rows without raw provider identity", () => {
    const row = createRunRecordRow(runRecord(), {
      anonymousInstallIdHash: "sha256:local-install",
    });

    expect(row.run_id).toBe("run-1");
    expect(row.local_date_key).toBe("2026-06-26");
    expect(row.course_length_id).toBe("basic");
    expect(row.overlap_difficulty_id).toBe("complex");
    expect(row.visibility_level).toBe("normal");
    expect(row.measurement_breakdown).toMatchObject({ accuracy: { displayPercent: 94 } });
    expect(row.anonymous_install_id_hash).toBe("sha256:local-install");
    expect(JSON.stringify(row)).not.toContain("userKey");
  });

  test("sanitizes session event payloads before Supabase storage", () => {
    const event: SessionEvent = {
      id: "evt-1",
      type: "difficulty_feedback_submitted",
      createdAt: "2026-06-26T00:00:00.000Z",
      payload: {
        rating: 3,
        memo: "free text should not be synced",
        rawText: "do not store me",
      },
    };

    const row = createSessionEventRow(event, { anonymousInstallIdHash: "sha256:local-install" });

    expect(row.event_type).toBe("difficulty_feedback_submitted");
    expect(row.payload).toEqual({ rating: 3 });
  });

  test("posts through Supabase Edge Functions with anon key only", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const transport = createSupabaseBackendTransport(
      { supabaseUrl: "https://project.supabase.co", anonKey: "anon-public-key" },
      fetcher,
    );

    await expect(transport.post<{ ok: boolean }>("hiddenline-sync", { hello: "world" })).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith(
      "https://project.supabase.co/functions/v1/hiddenline-sync",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer anon-public-key",
          apikey: "anon-public-key",
        }),
      }),
    );
  });

  test("keeps DeepSeek integration server-only", () => {
    expect(DEEPSEEK_SERVER_ENV_KEYS).toEqual(["DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_BASE_URL"]);
    expect(DEEPSEEK_SERVER_ENV_KEYS.some((key) => key.startsWith("VITE_"))).toBe(false);

    const edgeFunction = readFileSync(resolve(process.cwd(), "supabase/functions/hiddenline-ai-coach/index.ts"), "utf8");
    expect(edgeFunction).toContain("DEEPSEEK_API_KEY");
    expect(edgeFunction).not.toContain("VITE_DEEPSEEK_API_KEY");
    expect(edgeFunction).toContain("HIDDENLINE_AI_ENABLED");
  });
});
