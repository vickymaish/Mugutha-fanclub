-- Supabase PostgreSQL schema for Mugutha MembersClub

create extension if not exists "pgcrypto";

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  email text,
  join_date date not null default current_date,
  membership_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  status text not null default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid references broadcasts(id),
  member_id uuid references members(id),
  status text not null default 'pending',
  sent_at timestamptz,
  whatsapp_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table members enable row level security;
alter table broadcasts enable row level security;
alter table messages enable row level security;

create policy "Authenticated users can read/write members" on members
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can read/write broadcasts" on broadcasts
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can read/write messages" on messages
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
