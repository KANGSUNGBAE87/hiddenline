-- Hidden Line Supabase backend foundation.
-- Apply in the shared Supabase project `dr.kang-mini-project` after review.
-- This migration intentionally enables RLS without broad public policies.

create extension if not exists pgcrypto;

create table if not exists public.core_users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.authmap_user_identities (
  id uuid primary key default gen_random_uuid(),
  core_user_id uuid not null references public.core_users(id) on delete cascade,
  provider text not null,
  provider_user_id_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id_hash)
);

create table if not exists public.authmap_link_requests (
  id uuid primary key default gen_random_uuid(),
  core_user_id uuid not null references public.core_users(id) on delete cascade,
  provider text not null,
  provider_user_id_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hiddenline_run_records (
  run_id text primary key,
  core_user_id uuid references public.core_users(id) on delete set null,
  anonymous_install_id_hash text,
  mode text not null check (mode in ('daily')),
  local_date_key text not null,
  timezone_offset integer not null,
  daily_pack_id text not null,
  line_type text not null,
  course_length_id text,
  overlap_difficulty_id text,
  seed text not null,
  generator_version text not null,
  generator_profile_id text not null,
  scoring_profile_id text not null,
  difficulty text not null,
  line_difficulty text not null,
  visibility_level text not null,
  completed boolean not null,
  status text not null check (status in ('success', 'failed')),
  score integer,
  measurement_breakdown jsonb,
  progress_max numeric not null,
  accuracy numeric not null,
  smoothness numeric not null,
  warning_peak numeric,
  warning_count integer,
  duration_ms integer,
  fail_reason text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (core_user_id is not null or anonymous_install_id_hash is not null)
);

create index if not exists hiddenline_run_records_owner_date_idx
  on public.hiddenline_run_records (core_user_id, anonymous_install_id_hash, local_date_key);

create index if not exists hiddenline_run_records_daily_variant_idx
  on public.hiddenline_run_records (
    local_date_key,
    course_length_id,
    overlap_difficulty_id,
    visibility_level,
    completed,
    score desc
  );

create table if not exists public.hiddenline_session_events (
  event_id text primary key,
  core_user_id uuid references public.core_users(id) on delete set null,
  anonymous_install_id_hash text,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null,
  check (core_user_id is not null or anonymous_install_id_hash is not null)
);

create index if not exists hiddenline_session_events_owner_time_idx
  on public.hiddenline_session_events (core_user_id, anonymous_install_id_hash, created_at);

create index if not exists hiddenline_session_events_type_time_idx
  on public.hiddenline_session_events (event_type, created_at);

create table if not exists public.hiddenline_session_states (
  state_id text primary key,
  core_user_id uuid references public.core_users(id) on delete cascade,
  anonymous_install_id_hash text,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  check (core_user_id is not null or anonymous_install_id_hash is not null)
);

create unique index if not exists hiddenline_session_states_core_user_uidx
  on public.hiddenline_session_states (core_user_id)
  where core_user_id is not null;

create unique index if not exists hiddenline_session_states_anonymous_uidx
  on public.hiddenline_session_states (anonymous_install_id_hash)
  where anonymous_install_id_hash is not null;

create table if not exists public.hiddenline_ai_requests (
  id uuid primary key default gen_random_uuid(),
  core_user_id uuid references public.core_users(id) on delete set null,
  anonymous_install_id_hash text,
  request_kind text not null,
  locale text not null default 'ko',
  model text not null,
  status text not null check (status in ('disabled', 'queued', 'success', 'failed')),
  prompt_version text not null,
  input_summary jsonb,
  output_summary jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hiddenline_ai_requests_owner_time_idx
  on public.hiddenline_ai_requests (core_user_id, anonymous_install_id_hash, created_at);

alter table public.core_users enable row level security;
alter table public.authmap_user_identities enable row level security;
alter table public.authmap_link_requests enable row level security;
alter table public.hiddenline_run_records enable row level security;
alter table public.hiddenline_session_events enable row level security;
alter table public.hiddenline_session_states enable row level security;
alter table public.hiddenline_ai_requests enable row level security;

comment on table public.hiddenline_run_records is
  'Hidden Line daily run records. RLS is locked by default; writes should go through Edge Functions/server verification until auth policies are explicitly added.';

comment on table public.hiddenline_session_events is
  'Hidden Line PII-safe event stream. Free-text payload keys are stripped before sync.';

comment on table public.hiddenline_ai_requests is
  'Hidden Line AI audit table for server-side DeepSeek calls. Do not store raw prompts or provider secrets.';
