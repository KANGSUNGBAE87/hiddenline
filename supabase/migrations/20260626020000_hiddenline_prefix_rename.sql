-- Rename the first Hidden Line table prefix from `hl_` to `hiddenline_`.
-- This preserves existing rows and keeps future project naming explicit.

do $$
begin
  if to_regclass('public.hiddenline_run_records') is null
     and to_regclass('public.hl_run_records') is not null then
    alter table public.hl_run_records rename to hiddenline_run_records;
  end if;

  if to_regclass('public.hiddenline_session_events') is null
     and to_regclass('public.hl_session_events') is not null then
    alter table public.hl_session_events rename to hiddenline_session_events;
  end if;

  if to_regclass('public.hiddenline_session_states') is null
     and to_regclass('public.hl_session_states') is not null then
    alter table public.hl_session_states rename to hiddenline_session_states;
  end if;

  if to_regclass('public.hiddenline_ai_requests') is null
     and to_regclass('public.hl_ai_requests') is not null then
    alter table public.hl_ai_requests rename to hiddenline_ai_requests;
  end if;
end $$;

do $$
begin
  if to_regclass('public.hiddenline_run_records_owner_date_idx') is null
     and to_regclass('public.hl_run_records_owner_date_idx') is not null then
    alter index public.hl_run_records_owner_date_idx rename to hiddenline_run_records_owner_date_idx;
  end if;

  if to_regclass('public.hiddenline_run_records_daily_variant_idx') is null
     and to_regclass('public.hl_run_records_daily_variant_idx') is not null then
    alter index public.hl_run_records_daily_variant_idx rename to hiddenline_run_records_daily_variant_idx;
  end if;

  if to_regclass('public.hiddenline_session_events_owner_time_idx') is null
     and to_regclass('public.hl_session_events_owner_time_idx') is not null then
    alter index public.hl_session_events_owner_time_idx rename to hiddenline_session_events_owner_time_idx;
  end if;

  if to_regclass('public.hiddenline_session_events_type_time_idx') is null
     and to_regclass('public.hl_session_events_type_time_idx') is not null then
    alter index public.hl_session_events_type_time_idx rename to hiddenline_session_events_type_time_idx;
  end if;

  if to_regclass('public.hiddenline_session_states_core_user_uidx') is null
     and to_regclass('public.hl_session_states_core_user_uidx') is not null then
    alter index public.hl_session_states_core_user_uidx rename to hiddenline_session_states_core_user_uidx;
  end if;

  if to_regclass('public.hiddenline_session_states_anonymous_uidx') is null
     and to_regclass('public.hl_session_states_anonymous_uidx') is not null then
    alter index public.hl_session_states_anonymous_uidx rename to hiddenline_session_states_anonymous_uidx;
  end if;

  if to_regclass('public.hiddenline_ai_requests_owner_time_idx') is null
     and to_regclass('public.hl_ai_requests_owner_time_idx') is not null then
    alter index public.hl_ai_requests_owner_time_idx rename to hiddenline_ai_requests_owner_time_idx;
  end if;
end $$;

do $$
declare
  item record;
  relation_oid oid;
begin
  for item in
    select *
    from (values
      ('public.hiddenline_run_records', 'hl_run_records_pkey', 'hiddenline_run_records_pkey'),
      ('public.hiddenline_run_records', 'hl_run_records_check', 'hiddenline_run_records_owner_check'),
      ('public.hiddenline_run_records', 'hl_run_records_mode_check', 'hiddenline_run_records_mode_check'),
      ('public.hiddenline_run_records', 'hl_run_records_status_check', 'hiddenline_run_records_status_check'),
      ('public.hiddenline_run_records', 'hl_run_records_core_user_id_fkey', 'hiddenline_run_records_core_user_id_fkey'),
      ('public.hiddenline_session_events', 'hl_session_events_pkey', 'hiddenline_session_events_pkey'),
      ('public.hiddenline_session_events', 'hl_session_events_check', 'hiddenline_session_events_owner_check'),
      ('public.hiddenline_session_events', 'hl_session_events_core_user_id_fkey', 'hiddenline_session_events_core_user_id_fkey'),
      ('public.hiddenline_session_states', 'hl_session_states_pkey', 'hiddenline_session_states_pkey'),
      ('public.hiddenline_session_states', 'hl_session_states_check', 'hiddenline_session_states_owner_check'),
      ('public.hiddenline_session_states', 'hl_session_states_core_user_id_fkey', 'hiddenline_session_states_core_user_id_fkey'),
      ('public.hiddenline_ai_requests', 'hl_ai_requests_pkey', 'hiddenline_ai_requests_pkey'),
      ('public.hiddenline_ai_requests', 'hl_ai_requests_status_check', 'hiddenline_ai_requests_status_check'),
      ('public.hiddenline_ai_requests', 'hl_ai_requests_core_user_id_fkey', 'hiddenline_ai_requests_core_user_id_fkey')
    ) as constraint_map(table_name, old_name, new_name)
  loop
    relation_oid := to_regclass(item.table_name);
    if relation_oid is not null
       and exists (
         select 1
         from pg_constraint
         where conrelid = relation_oid
           and conname = item.old_name
       )
       and not exists (
         select 1
         from pg_constraint
         where conrelid = relation_oid
           and conname = item.new_name
       ) then
      execute format('alter table %s rename constraint %I to %I', item.table_name, item.old_name, item.new_name);
    end if;
  end loop;
end $$;

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
