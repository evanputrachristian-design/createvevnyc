-- 3_uji_mandiri_0002a.sql
-- TEST ONLY. Run only after 0002a is successfully applied.
-- The final intentional exception aborts this DO statement and rolls back all test inserts.
-- The error message contains PASS/FAIL lines; an error alone does NOT mean tests passed.
-- Preconditions: public.orders has >=1 row and public.user_roles has an admin.
-- NOT EXECUTED against PostgreSQL.

DO $test$
DECLARE
  v_admin uuid; v_src uuid; v_a uuid; v_b uuid; v_c uuid;
  v_ok boolean; v_locked timestamptz; v_early boolean := false;
  v_state boolean; v_after boolean; v_hash text := md5(gen_random_uuid()::text || clock_timestamp()::text);
  v_status text; v_code text; v_by uuid; v_reason text; v_legacy boolean;
  v_report text := ''; i integer;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles
  WHERE role = 'admin'::public.app_role LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Uji dibatalkan: tidak ada admin di public.user_roles.';
  END IF;

  SELECT id, is_legacy_order INTO v_src, v_legacy
  FROM public.orders ORDER BY created_at LIMIT 1;
  IF v_src IS NULL THEN
    RAISE EXCEPTION 'Uji dibatalkan: tabel orders kosong.';
  END IF;

  CREATE TEMP TABLE _uji_src ON COMMIT DROP AS
    SELECT * FROM public.orders WHERE id = v_src;

  v_a := gen_random_uuid();
  UPDATE _uji_src SET id = v_a, status = 'baru',
    is_legacy_order = false, payment_flow_status = 'menunggu_pembayaran',
    waiting_token_hash = NULL, access_code = NULL, confirmed_at = NULL,
    confirmed_by = NULL, rejected_at = NULL, rejected_by = NULL, rejection_reason = NULL;
  INSERT INTO public.orders SELECT * FROM _uji_src;

  v_b := gen_random_uuid();
  UPDATE _uji_src SET id = v_b;
  INSERT INTO public.orders SELECT * FROM _uji_src;

  v_c := gen_random_uuid();
  UPDATE _uji_src SET id = v_c;
  INSERT INTO public.orders SELECT * FROM _uji_src;

  -- T0: legacy order cannot transition.
  IF v_legacy THEN
    BEGIN
      v_ok := public.transition_order_payment_status(v_src, 'menunggu_pembayaran', 'menunggu_konfirmasi');
      v_report := v_report || CASE WHEN v_ok IS FALSE THEN 'PASS' ELSE 'FAIL' END
        || E' - T0 pesanan legacy ditolak transisi\n';
    EXCEPTION WHEN OTHERS THEN
      v_report := v_report || 'FAIL - T0 error: ' || SQLERRM || E'\n';
    END;
  ELSE
    v_report := v_report || E'SKIP - T0 (pesanan sumber bukan legacy)\n';
  END IF;

  -- T1: payment pending -> waiting confirmation.
  BEGIN
    v_ok := public.transition_order_payment_status(v_a, 'menunggu_pembayaran', 'menunggu_konfirmasi');
    v_report := v_report || CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END
      || E' - T1 transisi ke menunggu_konfirmasi\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || 'FAIL - T1 error: ' || SQLERRM || E'\n';
  END;

  -- T2: compare-and-set rejects a repeated transition.
  BEGIN
    v_ok := public.transition_order_payment_status(v_a, 'menunggu_pembayaran', 'menunggu_konfirmasi');
    v_report := v_report || CASE WHEN v_ok IS FALSE THEN 'PASS' ELSE 'FAIL' END
      || E' - T2 transisi ganda ditolak\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || 'FAIL - T2 error: ' || SQLERRM || E'\n';
  END;

  -- T3: admin confirms and code is persisted.
  BEGIN
    v_ok := public.transition_order_payment_status(v_a, 'menunggu_konfirmasi', 'dikonfirmasi', v_admin, 'ABCDEFGH', NULL);
    SELECT payment_flow_status, access_code, confirmed_by
      INTO v_status, v_code, v_by FROM public.orders WHERE id = v_a;
    v_report := v_report || CASE WHEN v_ok AND v_status = 'dikonfirmasi'
      AND v_code = 'ABCDEFGH' AND v_by = v_admin THEN 'PASS' ELSE 'FAIL' END
      || E' - T3 konfirmasi admin\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || 'FAIL - T3 error: ' || SQLERRM || E'\n';
  END;

  -- T4: invalid transition must raise.
  BEGIN
    PERFORM public.transition_order_payment_status(v_a, 'dikonfirmasi', 'ditolak', v_admin, NULL, 'uji');
    v_report := v_report || E'FAIL - T4 transisi tidak valid diterima\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || E'PASS - T4 transisi tidak valid ditolak\n';
  END;

  -- T5: rejection path and COALESCE/NULLIF branch.
  BEGIN
    v_ok := public.transition_order_payment_status(v_b, 'menunggu_pembayaran', 'menunggu_konfirmasi');
    v_ok := v_ok AND public.transition_order_payment_status(v_b, 'menunggu_konfirmasi', 'ditolak', v_admin, NULL, 'alasan uji');
    SELECT payment_flow_status, rejection_reason, rejected_by
      INTO v_status, v_reason, v_by FROM public.orders WHERE id = v_b;
    v_report := v_report || CASE WHEN v_ok AND v_status = 'ditolak'
      AND v_reason = 'alasan uji' AND v_by = v_admin THEN 'PASS' ELSE 'FAIL' END
      || E' - T5 jalur penolakan admin\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || 'FAIL - T5 error: ' || SQLERRM || E'\n';
  END;

  -- Prepare C outside the exception sub-block so its state remains waiting_confirmation.
  v_ok := public.transition_order_payment_status(v_c, 'menunggu_pembayaran', 'menunggu_konfirmasi');
  IF v_ok IS NOT TRUE THEN
    v_report := v_report || E'FAIL - persiapan T6/T7 gagal\n';
  END IF;

  -- T6: a random non-admin UUID must not confirm.
  BEGIN
    PERFORM public.transition_order_payment_status(v_c, 'menunggu_konfirmasi', 'dikonfirmasi', gen_random_uuid(), 'JKLMNPQR', NULL);
    v_report := v_report || E'FAIL - T6 non-admin diterima\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || E'PASS - T6 non-admin ditolak\n';
  END;

  -- T7: code collision must raise unique_violation. T3 should already own ABCDEFGH.
  BEGIN
    PERFORM public.transition_order_payment_status(v_c, 'menunggu_konfirmasi', 'dikonfirmasi', v_admin, 'ABCDEFGH', NULL);
    v_report := v_report || E'FAIL - T7 kode duplikat diterima\n';
  EXCEPTION
    WHEN unique_violation THEN v_report := v_report || E'PASS - T7 kode duplikat ditolak\n';
    WHEN OTHERS THEN v_report := v_report || 'FAIL - T7 error lain: ' || SQLERRM || E'\n';
  END;

  -- T8: direct incomplete confirmation must violate the CHECK constraint.
  BEGIN
    UPDATE public.orders SET payment_flow_status = 'dikonfirmasi' WHERE id = v_c;
    v_report := v_report || E'FAIL - T8 constraint konfirmasi tidak lengkap dilewati\n';
  EXCEPTION
    WHEN check_violation THEN v_report := v_report || E'PASS - T8 constraint konfirmasi bekerja\n';
    WHEN OTHERS THEN v_report := v_report || 'FAIL - T8 error lain: ' || SQLERRM || E'\n';
  END;

  -- T9: four failures do not lock; fifth locks; reset removes order-scope lock.
  BEGIN
    FOR i IN 1..4 LOOP
      v_locked := public.record_order_access_failure('order', v_hash, v_a);
      IF v_locked IS NOT NULL THEN v_early := true; END IF;
    END LOOP;
    v_locked := public.record_order_access_failure('order', v_hash, v_a);
    v_state := public.is_order_access_locked('order', v_hash);
    PERFORM public.reset_order_access_attempts(v_hash);
    v_after := public.is_order_access_locked('order', v_hash);
    v_report := v_report || CASE WHEN NOT v_early AND v_locked IS NOT NULL AND v_state AND NOT v_after
      THEN 'PASS' ELSE 'FAIL' END || E' - T9 lima kegagalan dan reset\n';
  EXCEPTION WHEN OTHERS THEN
    v_report := v_report || 'FAIL - T9 error: ' || SQLERRM || E'\n';
  END;

  RAISE EXCEPTION E'HASIL UJI (exception ini disengaja untuk rollback):\n%', v_report;
END;
$test$;
