Summary
-------
Issue: RLS Disabled in Public

Table: public.templates
Schema: public

Summary of the lint issue
------------------------
The table `public.templates` lives in the exposed `public` schema and is reachable via PostgREST (Supabase Data API), but Row Level Security (RLS) is not enabled. Without RLS, roles such as `anon` and `authenticated` can potentially read or modify all rows in the table, because Postgres will not apply any row-level authorization filters.

Impact
------
- Security: Data intended for admins only is accessible to any client with the API surface privileges.
- Deployment/runtime: Enabling RLS without policies will lock the table (no rows accessible) until policies are added — this can break runtime if admin JWTs or policies aren't in place.

Recommended approach
--------------------
Because this application is admin-only (only backend devs and admins should access templates), enable RLS and add admin-only policies. The simplest DB-side check is to base policies on a JWT claim: `auth.jwt() ->> 'role' = 'admin'`.

SQL to apply (run in Supabase SQL editor or via psql as an admin)
------------------------------------------------------------
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

Operational notes and testing
-----------------------------
- After enabling RLS, no rows are accessible until policies exist. Ensure admin users' JWTs include `role: "admin"` in their claims (e.g. `app_metadata.role` surfaced via `auth.jwt()`).
- If your JWT uses a different path (for example `app_metadata ->> 'role'`), adapt the policy condition accordingly: `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`.
- To test: log in as an admin, call the PostgREST endpoint for `templates`, and confirm SELECT/INSERT/UPDATE/DELETE work. Then test an authenticated non-admin and ensure access is denied.

Rollback
--------
If you need to undo quickly (not recommended for long-term), you can disable RLS:
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;

Decision required
-----------------
- Confirm which JWT claim holds admin status (`auth.jwt() ->> 'role'` vs `auth.jwt() -> 'app_metadata' ->> 'role'`).
- Confirm that admin users' tokens will be updated to include the claim before deploying.

References
----------
- Supabase docs: Row Level Security and policies
- PostgREST: exposing tables through the API
