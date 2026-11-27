-- ============================================================================
-- RGPD · Retoques técnicos (28/11/2026)
-- 1. web_bookings: límites de longitud en la base de datos (WEB-01): aunque
--    alguien se salte el formulario, no se aceptan textos desmesurados.
-- 2. photo_publications: dónde se ha publicado cada foto (canal, URL, fecha)
--    para poder retirarla si el cliente retira su autorización (E04, E05).
--    Solo se puede registrar en un canal autorizado y no retirado.
-- 3. review_status(): añade las publicaciones pendientes de retirar.
-- ============================================================================

BEGIN;

-- ── 1. Límites de longitud en solicitudes web ───────────────────────────────
ALTER TABLE public.web_bookings
  DROP CONSTRAINT IF EXISTS web_bookings_lengths,
  ADD CONSTRAINT web_bookings_lengths CHECK (
    coalesce(length(client_name), 0)    <= 120 AND
    coalesce(length(client_phone), 0)   <= 40  AND
    coalesce(length(client_email), 0)   <= 160 AND
    coalesce(length(description), 0)    <= 4000 AND
    coalesce(length(body_zone), 0)      <= 80  AND
    coalesce(length(preferred_time), 0) <= 20
  );

-- ── 2. Publicaciones de fotos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photo_publications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id   uuid NOT NULL REFERENCES public.consent_forms(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('studioWeb', 'studioSocial', 'artistSocial')),
  url          text NOT NULL CHECK (length(url) BETWEEN 8 AND 500),
  published_on date NOT NULL,
  created_by   uuid DEFAULT auth.uid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  removed_at   timestamptz,
  removed_by   uuid
);
CREATE INDEX IF NOT EXISTS photo_publications_consent_idx ON public.photo_publications(consent_id);
ALTER TABLE public.photo_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photo_publications_select" ON public.photo_publications;
CREATE POLICY "photo_publications_select" ON public.photo_publications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.consent_forms cf
                 WHERE cf.id = photo_publications.consent_id
                   AND (public.is_owner() OR public.artist_can_access_client(cf.client_id::text))));
-- Escritura solo mediante las funciones siguientes.

CREATE OR REPLACE FUNCTION public.register_publication(p_consent_id uuid, p_channel text, p_url text, p_published_on date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid; v_status text; v_granted boolean;
BEGIN
  SELECT client_id, status, (form_data -> 'consents' -> 'image' ->> p_channel)::boolean
    INTO v_client, v_status, v_granted
    FROM consent_forms WHERE id = p_consent_id;
  IF v_client IS NULL THEN RAISE EXCEPTION 'El consentimiento no existe'; END IF;
  IF NOT (is_owner() OR artist_can_access_client(v_client::text)) THEN RAISE EXCEPTION 'Sin permiso sobre este cliente'; END IF;
  IF v_status <> 'firmado' THEN RAISE EXCEPTION 'El consentimiento no está vigente'; END IF;
  IF v_granted IS NOT TRUE THEN RAISE EXCEPTION 'El cliente no autorizó publicar en ese canal'; END IF;
  IF EXISTS (SELECT 1 FROM consent_image_withdrawals w WHERE w.consent_id = p_consent_id AND w.permission = p_channel) THEN
    RAISE EXCEPTION 'El cliente retiró la autorización para ese canal';
  END IF;
  IF p_url !~* '^https?://' THEN RAISE EXCEPTION 'La URL debe empezar por http:// o https://'; END IF;
  INSERT INTO photo_publications (consent_id, channel, url, published_on)
  VALUES (p_consent_id, p_channel, trim(p_url), coalesce(p_published_on, current_date));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_publication_removed(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid;
BEGIN
  SELECT cf.client_id INTO v_client
    FROM photo_publications p JOIN consent_forms cf ON cf.id = p.consent_id
   WHERE p.id = p_id AND p.removed_at IS NULL;
  IF v_client IS NULL THEN RAISE EXCEPTION 'La publicación no existe o ya está retirada'; END IF;
  IF NOT (is_owner() OR artist_can_access_client(v_client::text)) THEN RAISE EXCEPTION 'Sin permiso sobre este cliente'; END IF;
  UPDATE photo_publications SET removed_at = now(), removed_by = auth.uid() WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_publication(uuid, text, text, date) FROM public, anon;
REVOKE ALL ON FUNCTION public.mark_publication_removed(uuid)               FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_publication(uuid, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_publication_removed(uuid)               TO authenticated;

-- Registro de actividad también para las publicaciones
DROP TRIGGER IF EXISTS trg_audit ON public.photo_publications;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.photo_publications
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

-- audit_row(): las publicaciones se filtran por cliente a través del consentimiento
CREATE OR REPLACE FUNCTION public.audit_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  v_row jsonb := coalesce(v_new, v_old);
  v_fields text[];
  v_client uuid;
  v_record text;
  v_detail text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(k ORDER BY k) INTO v_fields
      FROM jsonb_object_keys(v_new) AS k
     WHERE k NOT IN ('updated_at') AND (v_new -> k) IS DISTINCT FROM (v_old -> k);
    IF v_fields IS NULL THEN RETURN NULL; END IF;
  END IF;

  v_record := coalesce(v_row ->> 'id', v_row ->> 'profile_id');
  v_client := CASE TG_TABLE_NAME
                WHEN 'clients' THEN (v_row ->> 'id')::uuid
                WHEN 'sessions' THEN (v_row ->> 'client_id')::uuid
                WHEN 'client_photos' THEN (v_row ->> 'client_id')::uuid
                WHEN 'consent_forms' THEN (v_row ->> 'client_id')::uuid
                WHEN 'photo_publications' THEN (SELECT cf.client_id FROM consent_forms cf WHERE cf.id = (v_row ->> 'consent_id')::uuid)
                ELSE NULL END;

  IF TG_TABLE_NAME = 'consent_forms' AND TG_OP = 'UPDATE' AND 'status' = ANY (v_fields) THEN
    v_detail := 'estado: ' || coalesce(v_old ->> 'status', '?') || ' → ' || coalesce(v_new ->> 'status', '?');
  END IF;
  IF TG_TABLE_NAME = 'photo_publications' THEN
    v_detail := 'canal: ' || coalesce(v_row ->> 'channel', '?');
  END IF;

  INSERT INTO audit_events (actor, action, table_name, record_id, client_id, changed_fields, detail)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, v_record, v_client, v_fields, v_detail);
  RETURN NULL;
END;
$$;

-- ── 3. Revisión anual: publicaciones pendientes de retirar ──────────────────
CREATE OR REPLACE FUNCTION public.review_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE r jsonb;
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'Solo dueños'; END IF;
  SELECT jsonb_build_object(
    'web_purge_last_ok', (SELECT max(d.end_time) FROM cron.job_run_details d JOIN cron.job j USING (jobid)
                           WHERE j.jobname = 'purge-old-web-bookings' AND d.status = 'succeeded'),
    'web_purge_last_fail', (SELECT max(d.end_time) FROM cron.job_run_details d JOIN cron.job j USING (jobid)
                           WHERE j.jobname = 'purge-old-web-bookings' AND d.status = 'failed'),
    'audit_purge_last_ok', (SELECT max(d.end_time) FROM cron.job_run_details d JOIN cron.job j USING (jobid)
                           WHERE j.jobname = 'purge-old-audit-events' AND d.status = 'succeeded'),
    'oldest_web_booking', (SELECT min(created_at) FROM web_bookings),
    'withdrawals_12m', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                           'client_id', cf.client_id, 'client_name', c.name, 'permission', w.permission,
                           'withdrawn_at', w.withdrawn_at, 'note', w.note) ORDER BY w.withdrawn_at DESC), '[]'::jsonb)
                          FROM consent_image_withdrawals w
                          JOIN consent_forms cf ON cf.id = w.consent_id
                          LEFT JOIN clients c ON c.id = cf.client_id
                         WHERE w.withdrawn_at > now() - interval '12 months'),
    'publications_pending_removal', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                           'client_id', cf.client_id, 'client_name', c.name, 'channel', p.channel,
                           'url', p.url, 'withdrawn_at', w.withdrawn_at) ORDER BY w.withdrawn_at), '[]'::jsonb)
                          FROM photo_publications p
                          JOIN consent_image_withdrawals w ON w.consent_id = p.consent_id AND w.permission = p.channel
                          JOIN consent_forms cf ON cf.id = p.consent_id
                          LEFT JOIN clients c ON c.id = cf.client_id
                         WHERE p.removed_at IS NULL)
  ) INTO r;
  RETURN r;
END;
$$;

COMMIT;
