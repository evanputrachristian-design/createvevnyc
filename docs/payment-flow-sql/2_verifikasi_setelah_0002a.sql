-- 2_verifikasi_setelah_0002a.sql
-- READ-ONLY checks. Run each SELECT separately if SQL Editor shows only the last result.
-- This file has NOT been run against PostgreSQL; compare actual results to notes below.

-- QUERY 1: SQL grants after 0002a.
-- Expected from the migration: anon INSERT=true, anon SELECT=false,
-- authenticated INSERT=true (temporary compatibility), service_role UPDATE=true.
-- SQL privileges are not the same as effective RLS authorization.
SELECT
  has_table_privilege('anon','public.orders','INSERT') AS anon_insert,
  has_table_privilege('anon','public.orders','SELECT') AS anon_select,
  has_table_privilege('authenticated','public.orders','INSERT') AS authenticated_insert,
  has_table_privilege('service_role','public.orders','UPDATE') AS service_role_update;

-- QUERY 2: RLS must be enabled on both tables.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('orders','order_access_attempts')
ORDER BY c.relname;

-- QUERY 3: inspect policies. orders INSERT policy should constrain new payment fields
-- and status='baru'; do not rely on text length alone.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('orders','order_access_attempts')
ORDER BY tablename, policyname;

-- QUERY 4: function ACLs. Expected: PUBLIC/anon/authenticated EXECUTE=false,
-- service_role EXECUTE=true, security_definer=true, search_path=pg_catalog.
SELECT p.oid::regprocedure AS signature,
  p.prosecdef AS security_definer,
  p.proconfig AS settings,
  EXISTS (
    SELECT 1
    FROM pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
    WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
  ) AS public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_order_access_locked','record_order_access_failure',
                    'reset_order_access_attempts','transition_order_payment_status')
ORDER BY p.proname;

-- QUERY 5: attempt table privileges. anon/authenticated should be false for all;
-- service_role should be true for SELECT/INSERT/UPDATE/DELETE.
SELECT r.role_name,
  has_table_privilege(r.role_name,'public.order_access_attempts','SELECT') AS can_select,
  has_table_privilege(r.role_name,'public.order_access_attempts','INSERT') AS can_insert,
  has_table_privilege(r.role_name,'public.order_access_attempts','UPDATE') AS can_update,
  has_table_privilege(r.role_name,'public.order_access_attempts','DELETE') AS can_delete
FROM (VALUES ('anon'),('authenticated'),('service_role')) AS r(role_name);

-- QUERY 6: sequence grants. anon/authenticated should be false; service_role true.
SELECT
  has_sequence_privilege('anon','public.order_access_attempts_id_seq','USAGE') AS anon_usage,
  has_sequence_privilege('authenticated','public.order_access_attempts_id_seq','USAGE') AS authenticated_usage,
  has_sequence_privilege('service_role','public.order_access_attempts_id_seq','USAGE') AS service_role_usage;

-- QUERY 7: counts only show current state; compare total against a pre-migration backup
-- or a recorded baseline to establish whether the row count changed.
SELECT count(*) FILTER (WHERE is_legacy_order) AS legacy_orders,
       count(*) FILTER (WHERE NOT is_legacy_order AND waiting_token_hash IS NULL) AS transition_rows,
       count(*) FILTER (WHERE NOT is_legacy_order AND waiting_token_hash IS NOT NULL) AS tokenized_orders,
       count(*) AS total
FROM public.orders;
