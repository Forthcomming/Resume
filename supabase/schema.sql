-- ResumeKit — resumes table (homepage / resume library)
-- Run this in the Supabase SQL editor.

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

-- Structured resume content (added after initial release).
alter table public.resumes
  add column if not exists content jsonb not null default '{}'::jsonb;

create index if not exists resumes_user_id_updated_at_idx
  on public.resumes (user_id, updated_at desc);

-- Keep updated_at fresh on every write.
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
-- Seed data (mirrors the dashboard mockup). Demo user, no auth yet.
-- ---------------------------------------------------------------------------
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
