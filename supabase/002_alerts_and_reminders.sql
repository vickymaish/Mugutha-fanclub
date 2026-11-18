-- Mugutha FC: match-day alerts, renewal reminders and opt-out (STOP)
-- Paste into Supabase > SQL Editor and click Run, after 001_join_and_pay.sql.
-- Safe to run more than once: it only ADDS columns that are missing.

-- ── Fixtures: where the ground is, and which alerts went out ──────────────
-- venue_lat / venue_lng: the ground's map pin (right-click the ground in Google
-- Maps and copy the two numbers). Used for directions.
alter table fixtures add column if not exists venue_lat double precision;
alter table fixtures add column if not exists venue_lng double precision;
-- Set when each automatic alert is sent, so nobody gets the same alert twice.
alter table fixtures add column if not exists alert_day_before_at timestamptz;
alter table fixtures add column if not exists alert_matchday_at timestamptz;

-- ── Members: STOP / START, and which renewal reminders went out ───────────
alter table members add column if not exists opted_out boolean not null default false;
alter table members add column if not exists opted_out_at timestamptz;
-- Holds the expiry date each reminder was sent for. When a member renews, their
-- expiry date changes, so next year's reminders go out again.
alter table members add column if not exists reminder_7d_for timestamptz;
alter table members add column if not exists reminder_1d_for timestamptz;

create index if not exists members_active_expiry_idx
  on members (membership_status, expires_at);
