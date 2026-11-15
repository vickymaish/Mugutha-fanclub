-- Mugutha FC: demo data for the dashboard
-- Paste into Supabase > SQL Editor and click Run, after 001 and 002.
-- Safe to run more than once.

-- Demo fixtures are marked so "Clear demo data" removes only them.
alter table fixtures add column if not exists is_demo boolean not null default false;

-- Faster dashboard counts.
create index if not exists messages_status_sent_idx on messages (status, sent_at);
create index if not exists payments_paid_at_idx on payments (paid_at);
