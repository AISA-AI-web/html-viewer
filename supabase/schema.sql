-- ============================================================================
-- EduSim Hub — database schema, security, and helpers
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste this whole
-- file → Run. Safe to re-run (idempotent where practical).
--
-- Security model: the browser talks to Supabase with the PUBLIC anon key, so
-- EVERYTHING below is gated by Row-Level Security (RLS). Anyone may READ
-- published simulations (students need no account). Only the signed-in author
-- may modify their own rows. Ratings are one-per-user, self-owned.
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Teacher profile, 1:1 with auth.users (created client-side on first sign-in).
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  school       text,
  created_at   timestamptz not null default now()
);

-- A saved EduSim simulation: the self-contained HTML plus its classification.
create table if not exists public.simulations (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text check (char_length(description) <= 2000),
  html         text not null check (char_length(html) <= 2000000),  -- ~2MB cap
  grade_level  text,                                  -- controlled value (see app)
  subject      text,                                  -- controlled value (see app)
  concepts     text[] not null default '{}',          -- free-text tags
  standards    text[] not null default '{}',          -- e.g. 'NGSS MS-PS1-1'
  is_published boolean not null default true,
  view_count   integer not null default 0,
  -- denormalized rating aggregates (kept current by trigger below)
  avg_rating   numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- One rating per (user, simulation).
create table if not exists public.ratings (
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  created_at    timestamptz not null default now(),
  primary key (simulation_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes for the library browse/search/filter
-- ---------------------------------------------------------------------------
create index if not exists idx_sim_created   on public.simulations (created_at desc);
create index if not exists idx_sim_rating    on public.simulations (avg_rating desc);
create index if not exists idx_sim_grade     on public.simulations (grade_level);
create index if not exists idx_sim_subject   on public.simulations (subject);
create index if not exists idx_sim_author    on public.simulations (author_id);
create index if not exists idx_sim_concepts  on public.simulations using gin (concepts);
create index if not exists idx_sim_standards on public.simulations using gin (standards);

-- ---------------------------------------------------------------------------
-- Triggers / functions
-- ---------------------------------------------------------------------------

-- Keep avg_rating/rating_count current. SECURITY DEFINER so a rating by user A
-- can update the aggregate on a simulation owned by user B (bypasses RLS for
-- this controlled write only).
create or replace function public.recalc_simulation_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  sid := coalesce(new.simulation_id, old.simulation_id);
  update public.simulations s set
    avg_rating   = coalesce((select avg(rating)::numeric(3,2) from public.ratings where simulation_id = sid), 0),
    rating_count = (select count(*) from public.ratings where simulation_id = sid)
  where s.id = sid;
  return null;
end; $$;

drop trigger if exists ratings_recalc on public.ratings;
create trigger ratings_recalc
after insert or update or delete on public.ratings
for each row execute function public.recalc_simulation_rating();

-- Maintain updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists simulations_updated_at on public.simulations;
create trigger simulations_updated_at
before update on public.simulations
for each row execute function public.set_updated_at();

-- Atomic view-count bump, callable by anonymous viewers (students) without
-- granting them UPDATE on the table. Only touches published rows.
create or replace function public.increment_view(sim_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.simulations set view_count = view_count + 1
  where id = sim_id and is_published = true;
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.simulations enable row level security;
alter table public.ratings     enable row level security;

-- profiles: world-readable; each user manages only their own row.
drop policy if exists profiles_select_all  on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_select_all  on public.profiles for select using (true);
create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_self on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- simulations: published rows are world-readable (students need no account);
-- authors see their own drafts and are the only ones who may write.
drop policy if exists sim_select_published_or_own on public.simulations;
drop policy if exists sim_insert_own on public.simulations;
drop policy if exists sim_update_own on public.simulations;
drop policy if exists sim_delete_own on public.simulations;
create policy sim_select_published_or_own on public.simulations for select
  using (is_published or auth.uid() = author_id);
create policy sim_insert_own on public.simulations for insert
  with check (auth.uid() = author_id);
create policy sim_update_own on public.simulations for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy sim_delete_own on public.simulations for delete
  using (auth.uid() = author_id);

-- ratings: world-readable; each user owns (and can change) only their vote.
drop policy if exists ratings_select_all  on public.ratings;
drop policy if exists ratings_insert_self on public.ratings;
drop policy if exists ratings_update_self on public.ratings;
drop policy if exists ratings_delete_self on public.ratings;
create policy ratings_select_all  on public.ratings for select using (true);
create policy ratings_insert_self on public.ratings for insert with check (auth.uid() = user_id);
create policy ratings_update_self on public.ratings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ratings_delete_self on public.ratings for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (privileges; RLS still applies on top of these)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.simulations, public.ratings to anon, authenticated;
grant insert, update, delete on public.simulations, public.ratings to authenticated;
grant insert, update on public.profiles to authenticated;
grant execute on function public.increment_view(uuid) to anon, authenticated;
