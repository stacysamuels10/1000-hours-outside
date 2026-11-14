-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.

create table if not exists public.sessions (
  id          uuid primary key,
  start       timestamptz not null,
  "end"       timestamptz null,          -- "end" is a reserved word, so it is quoted
  kind        text not null default 'manual',
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  deleted     boolean not null default false
);

create table if not exists public.settings (
  id               int primary key,       -- always a single row with id = 1
  daycare_minutes  int not null default 60,
  goal_hours       int not null default 1000,
  updated_at       timestamptz not null default now()
);

-- No auth wanted: let the public anon key read and write everything.
-- Approach: keep RLS enabled (Supabase's default posture) with a permissive
-- policy for anon, plus explicit table grants.
alter table public.sessions enable row level security;
alter table public.settings enable row level security;

drop policy if exists "anon full access" on public.sessions;
create policy "anon full access" on public.sessions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "anon full access" on public.settings;
create policy "anon full access" on public.settings
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.sessions to anon, authenticated;
grant select, insert, update, delete on public.settings to anon, authenticated;
