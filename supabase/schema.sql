-- SDR Supabase Schema
-- Project: tjaowjiccowofzisdfhr (tjaowjiccowofzisdfhr.supabase.co)
-- Run in Supabase SQL Editor to create or recreate all tables.

-- ─── sdr_prospects ───────────────────────────────────────────────────────────
-- Mirror of prospects.json. Synced by scripts/sync.js after every run.
-- New prospects written by scripts/prospect.js after Sheet append.

create table if not exists sdr_prospects (
  id          text primary key,
  nm          text,
  fn          text,
  ti          text,
  co          text,
  em          text,
  dm          text,
  st          text,
  tr          text,
  sig         text,
  ind         text,
  sz          text,
  rev         text,
  city        text,
  state       text,
  country     text,
  fuc         integer default 1,
  fc          date,
  sc          date,
  tc          date,
  nfu         date,
  lc          date,
  lu          timestamptz,
  created_at  timestamptz default now()
);

alter table sdr_prospects enable row level security;
create policy "anon full access" on sdr_prospects for all using (true) with check (true);


-- ─── sdr_approval_items ──────────────────────────────────────────────────────
-- One row per draft pending approval. Written by scripts/draft.js.
-- Status updated by Cloudflare Pages Function /api/sdr-approve.

create table if not exists sdr_approval_items (
  id          text primary key,       -- draft_id (YYYYMMDD-prospectId)
  batch_date  date,
  prospect_id text,
  em          text,
  fn          text,
  nm          text,
  ti          text,
  co          text,
  tr          text,
  touch       text,
  subject     text,
  body        text,
  gen         text,                   -- 'llm' | 'static'
  status      text default 'pending_approval',
  ts          timestamptz,
  created_at  timestamptz default now()
);

alter table sdr_approval_items enable row level security;
create policy "anon full access" on sdr_approval_items for all using (true) with check (true);


-- ─── sdr_sends ───────────────────────────────────────────────────────────────
-- One row per email successfully sent. Written by scripts/send.js.

create table if not exists sdr_sends (
  id          text primary key,       -- draft_id
  prospect_id text,
  draft_id    text,
  em          text,
  fn          text,
  nm          text,
  ti          text,
  co          text,
  subject     text,
  sent_at     timestamptz,
  status      text default 'sent',
  fuc         integer default 1,
  created_at  timestamptz default now()
);

alter table sdr_sends enable row level security;
create policy "anon full access" on sdr_sends for all using (true) with check (true);
