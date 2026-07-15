-- ResumeKit — resumes table + Anonymous Auth RLS
-- Run in the Supabase SQL editor.
-- Also enable: Authentication → Providers → Anonymous → Enable

create extension if not exists "pgcrypto";

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  section_order jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resumes
  add column if not exists content jsonb not null default '{}'::jsonb;

create index if not exists resumes_user_id_updated_at_idx
  on public.resumes (user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — each auth user (incl. anonymous) only sees own rows
-- ---------------------------------------------------------------------------
alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Optional demo fixtures (not visible under RLS to real users).
insert into public.resumes (id, user_id, title, tags, created_at, updated_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    '字节跳动 · 产品经理',
    '["产品", "互联网"]'::jsonb,
    '2024-06-18T00:00:00Z',
    '2024-06-18T00:00:00Z'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    '阿里巴巴 · 数据产品',
    '["数据", "产品"]'::jsonb,
    '2024-06-12T00:00:00Z',
    '2024-06-12T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    '美团 · 用户增长',
    '["增长", "互联网"]'::jsonb,
    '2024-06-05T00:00:00Z',
    '2024-06-05T00:00:00Z'
  )
on conflict (id) do nothing;
