-- 1_jalankan_0002a.sql
-- REVIEW DRAFT: jalankan sekali saja setelah backup dan setelah ditinjau.
-- Belum pernah dieksekusi/divalidasi di PostgreSQL. Jangan jalankan bersamaan.
BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_flow_status text NOT NULL DEFAULT 'menunggu_pembayaran',
  ADD COLUMN IF NOT EXISTS is_legacy_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waiting_token_hash text,
  ADD COLUMN IF NOT EXISTS access_code text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Snapshot existing orders as legacy before any new flow is accepted.
UPDATE public.orders SET is_legacy_order = true WHERE is_legacy_order = false;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_flow_status_check
    CHECK (payment_flow_status IN ('menunggu_pembayaran','menunggu_konfirmasi','dikonfirmasi','ditolak')),
  ADD CONSTRAINT orders_access_code_format_check
    CHECK (access_code IS NULL OR access_code ~ '^[A-HJ-NP-Z2-9]{8,10}$'),
  ADD CONSTRAINT orders_payment_confirmation_check
    CHECK (payment_flow_status <> 'dikonfirmasi' OR
      (confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL AND access_code IS NOT NULL)),
  ADD CONSTRAINT orders_payment_rejection_check
    CHECK (payment_flow_status <> 'ditolak' OR
      (rejected_at IS NOT NULL AND rejected_by IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS orders_access_code_uidx
  ON public.orders (access_code) WHERE access_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_waiting_token_hash_uidx
  ON public.orders (waiting_token_hash) WHERE waiting_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_payment_flow_status_idx
  ON public.orders (payment_flow_status, created_at DESC);

-- Temporary compatibility policy. Restrict customer-controlled fields.
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    payment_flow_status = 'menunggu_pembayaran'
    AND is_legacy_order = false
    AND status = 'baru'
    AND access_code IS NULL AND waiting_token_hash IS NULL
    AND confirmed_at IS NULL AND confirmed_by IS NULL
    AND rejected_at IS NULL AND rejected_by IS NULL AND rejection_reason IS NULL
  );

CREATE TABLE public.order_access_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_scope text NOT NULL CHECK (attempt_scope IN ('order','ip')),
  subject_hash text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_access_attempts_scope_subject_key UNIQUE (attempt_scope, subject_hash)
);
CREATE INDEX order_access_attempts_locked_idx
  ON public.order_access_attempts (locked_until) WHERE locked_until IS NOT NULL;
ALTER TABLE public.order_access_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_access_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_access_attempts TO service_role;
REVOKE ALL ON SEQUENCE public.order_access_attempts_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.order_access_attempts_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.is_order_access_locked(p_scope text, p_subject_hash text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.order_access_attempts a
    WHERE a.attempt_scope = p_scope AND a.subject_hash = p_subject_hash
      AND a.locked_until > pg_catalog.now()
  );
$function$;
REVOKE ALL ON FUNCTION public.is_order_access_locked(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_access_locked(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_order_access_failure(
  p_scope text, p_subject_hash text, p_order_id uuid DEFAULT NULL
) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE v_locked_until timestamptz;
BEGIN
  IF p_scope NOT IN ('order','ip') OR p_subject_hash IS NULL
     OR pg_catalog.length(p_subject_hash) < 32 THEN
    RAISE EXCEPTION 'Subjek pembatasan tidak valid';
  END IF;

  INSERT INTO public.order_access_attempts AS current_attempt
    (attempt_scope, subject_hash, order_id, failed_attempts, locked_until, window_started_at, updated_at)
  VALUES (p_scope, p_subject_hash,
    CASE WHEN p_scope = 'order' THEN p_order_id ELSE NULL END,
    1, NULL, pg_catalog.now(), pg_catalog.now())
  ON CONFLICT (attempt_scope, subject_hash) DO UPDATE SET
    order_id = CASE WHEN EXCLUDED.attempt_scope = 'order' THEN EXCLUDED.order_id ELSE NULL END,
    failed_attempts = CASE
      WHEN current_attempt.locked_until > pg_catalog.now() THEN current_attempt.failed_attempts
      WHEN current_attempt.locked_until IS NOT NULL AND current_attempt.locked_until <= pg_catalog.now() THEN 1
      WHEN current_attempt.window_started_at < pg_catalog.now() - interval '15 minutes' THEN 1
      ELSE current_attempt.failed_attempts + 1 END,
    window_started_at = CASE
      WHEN current_attempt.locked_until > pg_catalog.now() THEN current_attempt.window_started_at
      WHEN current_attempt.locked_until IS NOT NULL AND current_attempt.locked_until <= pg_catalog.now() THEN pg_catalog.now()
      WHEN current_attempt.window_started_at < pg_catalog.now() - interval '15 minutes' THEN pg_catalog.now()
      ELSE current_attempt.window_started_at END,
    locked_until = CASE
      WHEN current_attempt.locked_until > pg_catalog.now() THEN current_attempt.locked_until
      WHEN current_attempt.locked_until IS NOT NULL AND current_attempt.locked_until <= pg_catalog.now() THEN NULL
      WHEN current_attempt.window_started_at < pg_catalog.now() - interval '15 minutes' THEN NULL
      WHEN current_attempt.failed_attempts + 1 >= 5 THEN pg_catalog.now() + interval '15 minutes'
      ELSE NULL END,
    updated_at = pg_catalog.now()
  RETURNING locked_until INTO v_locked_until;
  RETURN v_locked_until;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_order_access_failure(text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_access_failure(text,text,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.reset_order_access_attempts(p_order_subject_hash text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  DELETE FROM public.order_access_attempts
  WHERE attempt_scope = 'order' AND subject_hash = p_order_subject_hash;
$function$;
REVOKE ALL ON FUNCTION public.reset_order_access_attempts(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_order_access_attempts(text) TO service_role;

CREATE OR REPLACE FUNCTION public.transition_order_payment_status(
  p_order_id uuid, p_expected_status text, p_new_status text,
  p_actor uuid DEFAULT NULL, p_access_code text DEFAULT NULL, p_rejection_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE v_updated integer;
BEGIN
  IF (
    (p_expected_status = 'menunggu_pembayaran' AND p_new_status = 'menunggu_konfirmasi')
    OR (p_expected_status = 'menunggu_konfirmasi' AND p_new_status IN ('dikonfirmasi','ditolak'))
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'Transisi status tidak valid';
  END IF;

  IF p_new_status IN ('dikonfirmasi','ditolak') THEN
    IF p_actor IS NULL OR NOT public.has_role(p_actor, 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Aktor admin tidak valid';
    END IF;
  END IF;

  IF p_new_status = 'dikonfirmasi' THEN
    IF p_access_code IS NULL OR p_access_code !~ '^[A-HJ-NP-Z2-9]{8,10}$' THEN
      RAISE EXCEPTION 'Kode akses tidak valid';
    END IF;
    UPDATE public.orders SET payment_flow_status = 'dikonfirmasi', access_code = p_access_code,
      confirmed_at = pg_catalog.now(), confirmed_by = p_actor
    WHERE id = p_order_id AND payment_flow_status = p_expected_status AND is_legacy_order = false;
  ELSIF p_new_status = 'ditolak' THEN
    UPDATE public.orders SET payment_flow_status = 'ditolak', rejected_at = pg_catalog.now(),
      rejected_by = p_actor,
      rejection_reason = NULLIF(left(COALESCE(p_rejection_reason, ''), 1000), '')
    WHERE id = p_order_id AND payment_flow_status = p_expected_status AND is_legacy_order = false;
  ELSE
    UPDATE public.orders SET payment_flow_status = p_new_status
    WHERE id = p_order_id AND payment_flow_status = p_expected_status AND is_legacy_order = false;
  END IF;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$function$;
REVOKE ALL ON FUNCTION public.transition_order_payment_status(uuid,text,text,uuid,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order_payment_status(uuid,text,text,uuid,text,text) TO service_role;

COMMIT;
