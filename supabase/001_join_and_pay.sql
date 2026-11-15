-- Mugutha FC: join and pay (M-Pesa + cash)
-- Paste into Supabase > SQL Editor and click Run.
-- Safe to run more than once, and safe on the existing tables: it only ADDS
-- columns and tables that are missing. It doesn't delete or change any data.

create extension if not exists "pgcrypto";

-- ── Members: tier, expiry date and member number ──────────────────────────
alter table members add column if not exists tier text;
alter table members add column if not exists amount_paid numeric default 0;
alter table members add column if not exists expires_at timestamptz;
alter table members add column if not exists member_number text;
alter table members add column if not exists is_demo boolean not null default false;

create unique index if not exists members_member_number_key
  on members (member_number) where member_number is not null;
create index if not exists members_expires_at_idx on members (expires_at);

-- Member numbers: MFC-0001, MFC-0002 ...
create sequence if not exists member_number_seq start 1;
create or replace function next_member_number() returns text
language sql volatile as $$
  select 'MFC-' || lpad(nextval('member_number_seq')::text, 4, '0')
$$;

-- ── Phone numbers: store every member as 2547XXXXXXXX ─────────────────────
-- WhatsApp and M-Pesa both use this format, so the same fan is never stored twice.
-- Numbers already in this format, or that would clash with one, are left alone.
update members m set phone = '254' || substr(m.phone, 2)
where m.phone ~ '^0[71][0-9]{8}$'
  and not exists (select 1 from members x where x.phone = '254' || substr(m.phone, 2));
update members m set phone = substr(m.phone, 2)
where m.phone ~ '^\+254[71][0-9]{8}$'
  and not exists (select 1 from members x where x.phone = substr(m.phone, 2));

-- ── Payments: every M-Pesa and cash payment ───────────────────────────────
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members (id) on delete set null,
  phone text not null,
  name text,
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  amount integer not null check (amount > 0),
  method text not null check (method in ('mpesa', 'cash')),
  source text not null default 'admin' check (source in ('whatsapp', 'admin', 'web')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  checkout_request_id text unique,
  mpesa_receipt text unique,
  failure_reason text,
  recorded_by text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  last_checked_at timestamptz
);

create index if not exists payments_status_created_idx on payments (status, created_at);
create index if not exists payments_member_idx on payments (member_id);

-- Only the backend (service role key) reads and writes payments. With row level
-- security on and no policies, the public anon key can't see them at all.
alter table payments enable row level security;
