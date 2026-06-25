# Hidden Line Supabase / AI Backend Setup

Status: active
Updated: 2026-06-26

## Supabase Target

- Project: `dr.kang-mini-project`
- Project ref: `jwnuxxxthzkeiiuqopir`
- Schema: `public`
- App table prefix: `hiddenline_`
- Remote migration status: applied on 2026-06-26 through `supabase db query --linked --file`.

## Tables

Created or verified:

- `core_users`
- `authmap_user_identities`
- `authmap_link_requests`
- `hiddenline_run_records`
- `hiddenline_session_events`
- `hiddenline_session_states`
- `hiddenline_ai_requests`

All listed tables have RLS enabled. The Hidden Line app tables are intentionally not opened with public read/write policies yet. Sync should go through Edge Functions or another server path until login/account mapping is implemented.

Prefix correction:

- The first applied DB foundation briefly used `hl_`.
- The project standard is now `hiddenline_`.
- `supabase/migrations/20260626020000_hiddenline_prefix_rename.sql` renames existing `hl_*` tables, indexes, and constraints to `hiddenline_*`.
- Remote verification confirmed no `hl_` table, index, or constraint names remain.

## Local Env Boundaries

Browser-safe public Supabase values:

- Source of truth: `/Users/kangsungbae/.config/sungbae/shared-env/supabase-public.env.local`
- Allowed public vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Server/admin Supabase values:

- Source of truth: `/Users/kangsungbae/.config/sungbae/shared-env/supabase-admin.env.local`
- Never expose through `VITE_`, `NEXT_PUBLIC_`, or `PUBLIC_`.

DeepSeek server-only values:

- Source of truth: `/Users/kangsungbae/.config/sungbae/shared-env/ai-secrets.env.local`
- Supabase secrets were set for:
  - `DEEPSEEK_API_KEY`
  - `DEEPSEEK_MODEL`
  - `DEEPSEEK_BASE_URL`
  - `HIDDENLINE_AI_ENABLED`

## DeepSeek Readiness

Edge Function:

- `supabase/functions/hiddenline-ai-coach/index.ts`
- Deployed function: `hiddenline-ai-coach`
- JWT verification: default enabled
- Current AI state: disabled by `HIDDENLINE_AI_ENABLED=false`
- Model env default: `deepseek-v4-pro`
- Request mode when enabled: short result coaching uses `thinking: disabled` to keep the first AI touchpoint compact.

The function returns a disabled MVP response until `HIDDENLINE_AI_ENABLED=true` is set. This prevents accidental DeepSeek spend while keeping the integration path ready.

## Client Boundary

The app must not call DeepSeek directly. Client code may call Supabase Edge Functions through the platform/backend adapter only. Product/game logic must not import Supabase SDKs or AI provider clients directly.

## Next Backend Steps

1. Add a `hiddenline-sync` Edge Function when cloud sync is actually enabled.
2. Decide anonymous install ID hashing/rotation policy before syncing local records.
3. Add auth mapping for Google Play / Apps in Toss before user-scoped cloud save.
4. Turn on `HIDDENLINE_AI_ENABLED=true` only after QA, rate-limit, and product copy review.

## References Checked

- DeepSeek API docs list `deepseek-v4-pro` as a valid `/chat/completions` model.
- DeepSeek API docs support `thinking: { type: "enabled" | "disabled" }` for model calls.
