# Payment-flow SQL review package

**Status: review draft only.** These scripts have not been executed against PostgreSQL/Supabase and have not received live-schema validation. Do not treat them as production-approved SQL.

## Required order

1. Review and back up the database before considering any migration.
2. Review `1_jalankan_0002a.sql`. It is intended to run once, in a controlled maintenance window. It wraps changes in a transaction; do not assume it is safely repeatable just because some additions use `IF NOT EXISTS`.
3. Run the read-only queries in `2_verifikasi_setelah_0002a.sql` and compare each result with its comments. Save outputs.
4. Run `3_uji_mandiri_0002a.sql` only in a non-production test database or a controlled environment with a known admin account and at least one order. The test creates temporary test rows inside a single `DO` statement and deliberately raises an exception at the end so the statement rolls back.
5. Read the complete exception message from step 4. An exception is expected, but it is **not** evidence that tests passed. Every required T-test must say `PASS`; any `FAIL`, unexpected error, missing output, or ambiguous result means stop and investigate. `T0` may say `SKIP` only if the selected source row is not legacy; after a successful 0002a run, existing orders are expected to be marked legacy, so T0 should ordinarily run.
6. Keep `4_NANTI_0002b_dan_rollback.sql` as reference only. All SQL in it is commented out intentionally. Do not apply 0002b until server-side order creation and the new payment routes are implemented and tested; do not use either rollback section without reviewing its warnings.

## Important security sequencing

- 0002a is a transitional schema and leaves a restricted INSERT policy for compatibility. It is not the final server-only write posture.
- 0002b removes direct INSERT for `anon` and `authenticated`; applying it before the replacement server-side order-creation route is live will break the current client flow.
- The service-role key must remain server-side and must never be placed in browser code or sent to the client.
- Never give the anonymous role SELECT access to `public.orders`; the verification script explicitly checks this.
- The payment workflow status is separate from the existing operational `orders.status` field.
- Rollback 0002a drops the new data and objects and restores the original permissive INSERT policy. It is destructive and reduces security.

## Static-review notes / limitations

- No SQL was executed, and no PostgreSQL parser or live database was used for this review.
- Validate the exact production schema, existing grants/policies, enum definitions, function ownership, and Supabase role behavior before approving the migration.
- The test script uses the existing `public.user_roles` table to find an admin and assumes its `user_id` and `role` columns match the repository's current schema.
- The lockout helpers are designed for server-side calls using service role only. They do not replace a global IP throttle at the Worker layer.
- These files are not authorization to run a migration, deploy code, merge a branch, or apply the later 0002b tightening step.
