-- ============================================================================
-- RGPD · Registro de cambios (auditoría) y revisión anual de conservación
-- 28/11/2026 · Tickets B08, DASH-04, B12, B13, INT-05, F05, I08
--
-- AUDITORÍA
--   audit_events: quién, cuándo, acción, tabla, registro y NOMBRES de los
--   campos cambiados (nunca los valores: no se duplican datos de salud).
--   Lo escriben triggers en la base de datos (también si alguien se salta el
--   panel) y log_access() para consultas/descargas desde el panel
--   (orientativo). Solo lo leen los dueños; nadie puede modificarlo ni
--   borrarlo desde el panel. Conservación: 2 años (pg_cron diario).
--
-- REVISIÓN ANUAL (cada enero)
--   annual_reviews: constancia de cada revisión (quién, cuándo, lista).
--   clients.retention_hold_*: "Conservar" con motivo y fecha.
--   client_access_revocations: retirar a un artista el acceso a un cliente
--   antiguo (el acceso por sesiones pasadas era permanente).
--   retention_candidates(), access_review(), review_status(): datos de la
--   página de revisión. approve_client_purge() + purge_expired_client():
--   borrado de clientes caducados con todas las comprobaciones.
-- ============================================================================

BEGIN;

-- ═══ 1. AUDITORÍA ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_events (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at             timestamptz NOT NULL DEFAULT now(),
  actor          uuid,                 -- null = sistema (tareas programadas)
  action         text NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'view', 'download', 'purge')),
  table_name     text NOT NULL,
  record_id      text,
  client_id      uuid,                 -- para filtrar por cliente (sin FK: sobrevive al borrado)
  changed_fields text[],
  detail         text CHECK (detail IS NULL OR length(detail) <= 200)
);
CREATE INDEX IF NOT EXISTS audit_events_at_idx ON public.audit_events (at DESC);
CREATE INDEX IF NOT EXISTS audit_events_client_idx ON public.audit_events (client_id);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON public.audit_events (actor);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_events_owner_read" ON public.audit_events;
CREATE POLICY "audit_events_owner_read" ON public.audit_events
  FOR SELECT TO authenticated USING (public.is_owner());
-- Sin INSERT/UPDATE/DELETE: solo escriben los triggers y log_access().

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
    IF v_fields IS NULL THEN RETURN NULL; END IF;  -- nada cambió
  END IF;

  v_record := coalesce(v_row ->> 'id', v_row ->> 'profile_id');
  v_client := CASE TG_TABLE_NAME
                WHEN 'clients' THEN (v_row ->> 'id')::uuid
                WHEN 'sessions' THEN (v_row ->> 'client_id')::uuid
                WHEN 'client_photos' THEN (v_row ->> 'client_id')::uuid
                WHEN 'consent_forms' THEN (v_row ->> 'client_id')::uuid
                ELSE NULL END;

  -- Transiciones de estado de un consentimiento: no son datos personales
  IF TG_TABLE_NAME = 'consent_forms' AND TG_OP = 'UPDATE' AND 'status' = ANY (v_fields) THEN
    v_detail := 'estado: ' || coalesce(v_old ->> 'status', '?') || ' → ' || coalesce(v_new ->> 'status', '?');
  END IF;

  INSERT INTO audit_events (actor, action, table_name, record_id, client_id, changed_fields, detail)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, v_record, v_client, v_fields, v_detail);
  RETURN NULL;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'sessions', 'client_photos', 'consent_forms', 'web_bookings', 'artist_legal_info', 'profiles']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.audit_row()', t);
  END LOOP;
END $$;

-- Consultas y descargas desde el panel (orientativo: el panel lo anota).
CREATE OR REPLACE FUNCTION public.log_access(p_path text, p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cf record;
BEGIN
  IF p_action NOT IN ('view', 'download') THEN RAISE EXCEPTION 'Acción no válida'; END IF;
  SELECT id, client_id,
         CASE WHEN pdf_storage_path = p_path THEN 'pdf' ELSE 'documento representante' END AS what
    INTO cf
    FROM consent_forms
   WHERE pdf_storage_path = p_path OR form_data -> 'minor' ->> 'documentPhotoPath' = p_path
   LIMIT 1;
  IF cf.id IS NULL THEN RETURN; END IF;
  IF NOT (is_owner() OR artist_can_access_client(cf.client_id::text)) THEN
    RAISE EXCEPTION 'Sin permiso sobre este cliente';
  END IF;
  INSERT INTO audit_events (actor, action, table_name, record_id, client_id, detail)
  VALUES (auth.uid(), p_action, 'consent_forms', cf.id::text, cf.client_id, cf.what);
END;
$$;

-- Conservación del registro: 2 años
DO $$
BEGIN
  PERFORM cron.unschedule('purge-old-audit-events')
   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-old-audit-events');
  PERFORM cron.schedule('purge-old-audit-events', '30 4 * * *',
    $c$DELETE FROM public.audit_events WHERE at < now() - interval '2 years'$c$);
END $$;

-- ═══ 2. REVISIÓN ANUAL ══════════════════════════════════════════════════════

-- 2.1 "Conservar" un cliente (reclamación abierta, obligación…) — solo dueños
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS retention_hold_until  date,
  ADD COLUMN IF NOT EXISTS retention_hold_reason text CHECK (retention_hold_reason IS NULL OR length(retention_hold_reason) <= 300),
  ADD COLUMN IF NOT EXISTS purge_approved_at     timestamptz;

CREATE OR REPLACE FUNCTION public.clients_guard_retention_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.retention_hold_until IS DISTINCT FROM OLD.retention_hold_until
      OR NEW.retention_hold_reason IS DISTINCT FROM OLD.retention_hold_reason
      OR NEW.purge_approved_at IS DISTINCT FROM OLD.purge_approved_at)
     AND auth.uid() IS NOT NULL AND NOT is_owner() THEN
    RAISE EXCEPTION 'Solo los dueños pueden cambiar la conservación de un cliente';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_clients_guard_retention ON public.clients;
CREATE TRIGGER trg_clients_guard_retention BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.clients_guard_retention_fields();

-- 2.2 Revisiones realizadas
CREATE TABLE IF NOT EXISTS public.annual_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_year  int  NOT NULL CHECK (review_year BETWEEN 2026 AND 2100),
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid NOT NULL DEFAULT auth.uid(),
  checklist    jsonb NOT NULL,
  notes        text CHECK (notes IS NULL OR length(notes) <= 2000)
);
ALTER TABLE public.annual_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "annual_reviews_owner_read" ON public.annual_reviews;
DROP POLICY IF EXISTS "annual_reviews_owner_insert" ON public.annual_reviews;
CREATE POLICY "annual_reviews_owner_read" ON public.annual_reviews
  FOR SELECT TO authenticated USING (public.is_owner());
CREATE POLICY "annual_reviews_owner_insert" ON public.annual_reviews
  FOR INSERT TO authenticated WITH CHECK (public.is_owner() AND completed_by = auth.uid());

-- 2.3 Retirar el acceso de un artista a un cliente antiguo (F05)
CREATE TABLE IF NOT EXISTS public.client_access_revocations (
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artist_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  revoked_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid DEFAULT auth.uid(),
  PRIMARY KEY (client_id, artist_id)
);
ALTER TABLE public.client_access_revocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "access_revocations_owner_all" ON public.client_access_revocations;
CREATE POLICY "access_revocations_owner_all" ON public.client_access_revocations
  FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

-- El acceso por sesiones pasadas deja de valer si se retiró después de esa
-- sesión; una sesión nueva posterior lo devuelve. El artista principal
-- conserva el acceso (se cambia editando la ficha).
CREATE OR REPLACE FUNCTION public.artist_can_access_client(client_id_text text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id::text = client_id_text
      AND (
        c.primary_artist_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.client_id = c.id AND s.artist_id = auth.uid()
            AND NOT EXISTS (SELECT 1 FROM client_access_revocations r
                            WHERE r.client_id = c.id AND r.artist_id = auth.uid()
                              AND r.revoked_at > s.created_at)
        )
      )
  );
$function$;

-- 2.4 Datos para la página de revisión (solo dueños)
CREATE OR REPLACE FUNCTION public.retention_candidates()
RETURNS TABLE (client_id uuid, client_name text, last_activity date, consents int, hold_until date, hold_reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'Solo dueños'; END IF;
  RETURN QUERY
  WITH act AS (
    SELECT c.id, c.name, c.retention_hold_until, c.retention_hold_reason,
           greatest(c.created_at::date,
                    coalesce((SELECT max(s.date) FROM sessions s WHERE s.client_id = c.id), c.created_at::date),
                    coalesce((SELECT max(cf.signed_at)::date FROM consent_forms cf WHERE cf.client_id = c.id), c.created_at::date)) AS last_act,
           (SELECT count(*)::int FROM consent_forms cf WHERE cf.client_id = c.id) AS n
      FROM clients c
  )
  SELECT a.id, a.name, a.last_act, a.n, a.retention_hold_until, a.retention_hold_reason
    FROM act a
   WHERE a.last_act < (current_date - interval '5 years')
     AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.client_id = a.id AND s.date >= current_date)
   ORDER BY a.last_act;
END;
$$;

CREATE OR REPLACE FUNCTION public.access_review()
RETURNS TABLE (client_id uuid, client_name text, artist_id uuid, artist_name text, last_session date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'Solo dueños'; END IF;
  RETURN QUERY
  SELECT c.id, c.name, p.id, p.display_name, max(s.date)
    FROM sessions s
    JOIN clients c  ON c.id = s.client_id
    JOIN profiles p ON p.id = s.artist_id
   WHERE p.role = 'artist'
     AND c.primary_artist_id IS DISTINCT FROM p.id
     AND NOT EXISTS (SELECT 1 FROM client_access_revocations r
                     WHERE r.client_id = c.id AND r.artist_id = p.id AND r.revoked_at > s.created_at)
   GROUP BY c.id, c.name, p.id, p.display_name
  HAVING max(s.date) < current_date - interval '2 years'
   ORDER BY max(s.date);
END;
$$;

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
                         WHERE w.withdrawn_at > now() - interval '12 months')
  ) INTO r;
  RETURN r;
END;
$$;

-- 2.5 Borrado de un cliente caducado: dos pasos (aprobar → archivos → borrar)
CREATE OR REPLACE FUNCTION public.client_purge_check(p_client uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c record;
BEGIN
  SELECT * INTO c FROM clients WHERE id = p_client;
  IF c.id IS NULL THEN RETURN 'El cliente no existe'; END IF;
  IF c.retention_hold_until IS NOT NULL AND c.retention_hold_until >= current_date THEN
    RETURN 'Marcado como "Conservar" hasta ' || to_char(c.retention_hold_until, 'DD/MM/YYYY');
  END IF;
  IF EXISTS (SELECT 1 FROM sessions s WHERE s.client_id = p_client AND s.date >= current_date - interval '5 years') THEN
    RETURN 'Tiene sesiones de los últimos 5 años o citas futuras';
  END IF;
  IF EXISTS (SELECT 1 FROM consent_forms cf WHERE cf.client_id = p_client AND cf.signed_at >= now() - interval '5 years') THEN
    RETURN 'Tiene consentimientos firmados hace menos de 5 años';
  END IF;
  IF c.created_at >= now() - interval '5 years' THEN
    RETURN 'La ficha se creó hace menos de 5 años';
  END IF;
  RETURN NULL;  -- se puede borrar
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_client_purge(p_client uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_err text;
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'Solo los dueños pueden borrar clientes caducados'; END IF;
  v_err := client_purge_check(p_client);
  IF v_err IS NOT NULL THEN RAISE EXCEPTION '%', v_err; END IF;
  UPDATE clients SET purge_approved_at = now() WHERE id = p_client;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_expired_client(p_client uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_err text; v_approved timestamptz; v_counts text;
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'Solo los dueños pueden borrar clientes caducados'; END IF;
  IF length(trim(coalesce(p_reason, ''))) < 5 THEN RAISE EXCEPTION 'Indica el motivo'; END IF;
  SELECT purge_approved_at INTO v_approved FROM clients WHERE id = p_client;
  IF v_approved IS NULL OR v_approved < now() - interval '1 hour' THEN
    RAISE EXCEPTION 'Aprobación caducada: vuelve a empezar el borrado';
  END IF;
  v_err := client_purge_check(p_client);
  IF v_err IS NOT NULL THEN RAISE EXCEPTION '%', v_err; END IF;

  SELECT format('consentimientos %s, sesiones %s, fotos %s',
                (SELECT count(*) FROM consent_forms WHERE client_id = p_client),
                (SELECT count(*) FROM sessions WHERE client_id = p_client),
                (SELECT count(*) FROM client_photos WHERE client_id = p_client))
    INTO v_counts;
  -- Constancia sin datos personales (permite reaplicar la supresión tras restaurar una copia)
  INSERT INTO audit_events (actor, action, table_name, record_id, client_id, detail)
  VALUES (auth.uid(), 'purge', 'clients', p_client::text, p_client,
          left('revisión anual: ' || v_counts || ' · ' || trim(p_reason), 200));

  DELETE FROM consent_forms WHERE client_id = p_client;   -- copias y retiradas: en cascada
  DELETE FROM clients WHERE id = p_client;                 -- sesiones y fotos: en cascada
END;
$$;

-- Storage: un dueño puede borrar los archivos de un cliente cuyo borrado
-- acaba de aprobar (1 hora), antes de purge_expired_client().
DROP POLICY IF EXISTS "consent_docs_delete_purge" ON storage.objects;
CREATE POLICY "consent_docs_delete_purge" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'consent-documents' AND public.is_owner()
         AND EXISTS (SELECT 1 FROM public.clients c
                     WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
                       AND c.purge_approved_at > now() - interval '1 hour'));
-- (client-photos: los dueños ya pueden borrar con client_photos_owner_all)

REVOKE ALL ON FUNCTION public.log_access(text, text)            FROM public, anon;
REVOKE ALL ON FUNCTION public.retention_candidates()            FROM public, anon;
REVOKE ALL ON FUNCTION public.access_review()                   FROM public, anon;
REVOKE ALL ON FUNCTION public.review_status()                   FROM public, anon;
REVOKE ALL ON FUNCTION public.client_purge_check(uuid)          FROM public, anon;
REVOKE ALL ON FUNCTION public.approve_client_purge(uuid)        FROM public, anon;
REVOKE ALL ON FUNCTION public.purge_expired_client(uuid, text)  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_access(text, text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.retention_candidates()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.access_review()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_status()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_purge_check(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_client_purge(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_client(uuid, text) TO authenticated;

COMMIT;
