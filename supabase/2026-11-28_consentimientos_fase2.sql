-- ============================================================================
-- RGPD · Consentimientos Fase 2 (28/11/2026)
-- 1. consent_copy_log: constancia de cada copia enviada al cliente
--    (email desde el servidor, WhatsApp o Gmail desde el panel).
-- 2. consent_image_withdrawals: retirada de autorizaciones de imagen. El PDF
--    firmado no cambia; la retirada se registra aparte y prevalece.
-- Ambas tablas: solo lectura para quien tiene acceso al cliente; se escriben
-- únicamente mediante funciones que comprueban el acceso. Sin UPDATE/DELETE.
-- ============================================================================

BEGIN;

-- ── 1. Copias enviadas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consent_copy_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id  uuid NOT NULL REFERENCES public.consent_forms(id) ON DELETE CASCADE,
  channel     text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'gmail')),
  sent_by     uuid,
  sent_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_copy_log_consent_idx ON public.consent_copy_log(consent_id);
ALTER TABLE public.consent_copy_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_copy_log_select" ON public.consent_copy_log;
CREATE POLICY "consent_copy_log_select" ON public.consent_copy_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.consent_forms cf
                 WHERE cf.id = consent_copy_log.consent_id
                   AND (public.is_owner() OR public.artist_can_access_client(cf.client_id::text))));

-- WhatsApp y Gmail se abren en el dispositivo: el panel deja constancia aquí.
-- (El envío por email lo registra la Edge Function send-consent-copy.)
CREATE OR REPLACE FUNCTION public.log_consent_copy(p_consent_id uuid, p_channel text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid;
BEGIN
  IF p_channel NOT IN ('whatsapp', 'gmail') THEN
    RAISE EXCEPTION 'Canal no válido';
  END IF;
  SELECT client_id INTO v_client FROM consent_forms WHERE id = p_consent_id AND status = 'firmado';
  IF v_client IS NULL THEN
    RAISE EXCEPTION 'Solo se puede enviar copia de un consentimiento vigente';
  END IF;
  IF NOT (is_owner() OR artist_can_access_client(v_client::text)) THEN
    RAISE EXCEPTION 'Sin permiso sobre este cliente';
  END IF;
  INSERT INTO consent_copy_log (consent_id, channel, sent_by) VALUES (p_consent_id, p_channel, auth.uid());
END;
$$;

-- ── 2. Retirada de autorizaciones de imagen ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consent_image_withdrawals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id   uuid NOT NULL REFERENCES public.consent_forms(id) ON DELETE CASCADE,
  permission   text NOT NULL CHECK (permission IN ('internal', 'studioWeb', 'studioSocial', 'artistPortfolio', 'artistSocial')),
  note         text CHECK (note IS NULL OR length(note) <= 300),
  recorded_by  uuid,
  withdrawn_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consent_id, permission)
);
ALTER TABLE public.consent_image_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_image_withdrawals_select" ON public.consent_image_withdrawals;
CREATE POLICY "consent_image_withdrawals_select" ON public.consent_image_withdrawals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.consent_forms cf
                 WHERE cf.id = consent_image_withdrawals.consent_id
                   AND (public.is_owner() OR public.artist_can_access_client(cf.client_id::text))));

CREATE OR REPLACE FUNCTION public.record_image_withdrawal(p_consent_id uuid, p_permission text, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid; v_granted boolean;
BEGIN
  SELECT client_id, (form_data -> 'consents' -> 'image' ->> p_permission)::boolean
    INTO v_client, v_granted
    FROM consent_forms WHERE id = p_consent_id;
  IF v_client IS NULL THEN
    RAISE EXCEPTION 'El consentimiento no existe';
  END IF;
  IF NOT (is_owner() OR artist_can_access_client(v_client::text)) THEN
    RAISE EXCEPTION 'Sin permiso sobre este cliente';
  END IF;
  IF v_granted IS NOT TRUE THEN
    RAISE EXCEPTION 'Esa autorización no se había concedido';
  END IF;
  INSERT INTO consent_image_withdrawals (consent_id, permission, note, recorded_by)
  VALUES (p_consent_id, p_permission, nullif(left(trim(coalesce(p_note, '')), 300), ''), auth.uid())
  ON CONFLICT (consent_id, permission) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.log_consent_copy(uuid, text)                FROM public, anon;
REVOKE ALL ON FUNCTION public.record_image_withdrawal(uuid, text, text)   FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_consent_copy(uuid, text)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_image_withdrawal(uuid, text, text) TO authenticated;

COMMIT;
