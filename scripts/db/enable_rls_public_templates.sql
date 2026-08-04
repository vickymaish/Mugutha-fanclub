-- Migration: enable RLS on public.templates and add admin-only policies
-- Run this as a DB superuser (Supabase SQL editor or psql as the project owner)

BEGIN;

-- 1) Enable Row Level Security
ALTER TABLE public.templates
  ENABLE ROW LEVEL SECURITY;

-- 2) Admin-only SELECT
CREATE POLICY "templates admin select"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' );

-- 3) Admin-only INSERT
CREATE POLICY "templates admin insert"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );

-- 4) Admin-only UPDATE
CREATE POLICY "templates admin update"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );

-- 5) Admin-only DELETE
CREATE POLICY "templates admin delete"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' );

COMMIT;

-- IMPORTANT: Ensure admin JWTs include role = 'admin' before deploying.
