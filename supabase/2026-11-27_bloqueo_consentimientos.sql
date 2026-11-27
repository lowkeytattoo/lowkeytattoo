-- ============================================================================
-- RGPD · Paquete 2 · Bloqueo de borrados de consentimientos (PROPUESTA)
-- Fecha: 27/11/2026 · Tickets: DASH-02, DASH-03, DASH-06, CONS-02, B05, B06, B07
--
-- Objetivo: los consentimientos firmados (registro sanitario obligatorio,
-- Decreto 154/2004: al menos 5 años desde cada intervención) no se pueden
-- borrar ni modificar directamente desde el panel. Los errores se corrigen con
-- una anulación: el artista la solicita y un dueño la aprueba; el PDF
-- original se conserva marcado como ANULADO. Solo un consentimiento ya
-- ANULADO puede ser borrado por un dueño (opción B, decidida el 27/11/2026),
-- y cada borrado queda en consent_deletion_log.
--
-- Todo va en una transacción: si algo falla, no se aplica nada.
-- ============================================================================

BEGIN;

-- ── 1. Estado y datos de anulación en consent_forms ─────────────────────────
-- Sin claves foráneas a profiles para no impedir dar de baja a un artista;
-- los ids se conservan como rastro.
ALTER TABLE public.consent_forms
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'firmado'
    CHECK (status IN ('firmado', 'anulacion_solicitada', 'anulado')),
  ADD COLUMN IF NOT EXISTS annul_reason       text,
  ADD COLUMN IF NOT EXISTS annul_requested_by uuid,
  ADD COLUMN IF NOT EXISTS annul_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS annul_resolved_by  uuid,
  ADD COLUMN IF NOT EXISTS annul_resolved_at  timestamptz;

-- ── 2. Reglas de la tabla consent_forms: solo ver y crear ───────────────────
DROP POLICY IF EXISTS "artist_own_consent_forms" ON public.consent_forms;
DROP POLICY IF EXISTS "owner_all_consent_forms"  ON public.consent_forms;

CREATE POLICY "consent_forms_select" ON public.consent_forms
  FOR SELECT TO authenticated
  USING (public.is_owner() OR public.artist_can_access_client(client_id::text));

CREATE POLICY "consent_forms_insert" ON public.consent_forms
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner() OR public.artist_can_access_client(client_id::text));
-- Sin políticas UPDATE ni DELETE: nadie del panel puede modificar ni borrar.

-- ── 3. PDFs (bucket consent-documents): ver y subir; borrar solo dueños y solo si está ANULADO ────────────────────
DROP POLICY IF EXISTS "consent_docs_owner_or_artist" ON storage.objects;

CREATE POLICY "consent_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'consent-documents'
         AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[1])));

CREATE POLICY "consent_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consent-documents'
              AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[1])));
-- Sin UPDATE: un PDF subido no se puede sobrescribir.
-- DELETE: solo dueños y solo el PDF de un consentimiento ANULADO.
CREATE POLICY "consent_docs_delete_annulled" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'consent-documents'
         AND public.is_owner()
         AND EXISTS (SELECT 1 FROM public.consent_forms cf
                     WHERE cf.pdf_storage_path = storage.objects.name
                       AND cf.status = 'anulado'));

-- ── 4. Un cliente con consentimientos no se puede borrar ───────────────────
ALTER TABLE public.consent_forms
  DROP CONSTRAINT IF EXISTS consent_forms_client_id_fkey,
  ADD  CONSTRAINT consent_forms_client_id_fkey
       FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;

-- ── 5. Artistas: ver, crear y editar sus clientes, sin borrar ───────────────
DROP POLICY IF EXISTS "clients_artist_own" ON public.clients;

CREATE POLICY "clients_artist_select" ON public.clients
  FOR SELECT TO authenticated USING (primary_artist_id = auth.uid());
CREATE POLICY "clients_artist_insert" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (primary_artist_id = auth.uid());
CREATE POLICY "clients_artist_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (primary_artist_id = auth.uid()) WITH CHECK (primary_artist_id = auth.uid());
-- "clients_owner_all" (dueños: todo) se mantiene.

-- ── 6. Fotos: artistas ver, subir y borrar SOLO las que subieron ellos ─────
-- (por si se sube una por error). Los dueños pueden borrar cualquiera.
-- uploaded_by se rellena solo con el usuario que sube la foto. Las fotos
-- anteriores a este cambio no lo tienen: solo las pueden borrar los dueños.
ALTER TABLE public.client_photos
  ADD COLUMN IF NOT EXISTS uploaded_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "photos_artist_own" ON public.client_photos;

CREATE POLICY "photos_artist_delete_own" ON public.client_photos
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY "photos_artist_select" ON public.client_photos
  FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM public.sessions WHERE artist_id = auth.uid())
         OR client_id IN (SELECT id FROM public.clients WHERE primary_artist_id = auth.uid()));
CREATE POLICY "photos_artist_insert" ON public.client_photos
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (SELECT id FROM public.sessions WHERE artist_id = auth.uid())
              OR client_id IN (SELECT id FROM public.clients WHERE primary_artist_id = auth.uid()));
-- "photos_owner_all" (dueños: todo) se mantiene.

DROP POLICY IF EXISTS "client_photos_owner_or_artist" ON storage.objects;

CREATE POLICY "client_photos_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-photos' AND public.is_owner())
  WITH CHECK (bucket_id = 'client-photos' AND public.is_owner());
CREATE POLICY "client_photos_artist_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-photos' AND public.artist_can_access_client((storage.foldername(name))[2]));
CREATE POLICY "client_photos_artist_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-photos' AND public.artist_can_access_client((storage.foldername(name))[2]));
-- Storage guarda automáticamente quién subió cada archivo (owner_id).
CREATE POLICY "client_photos_artist_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-photos' AND owner_id = auth.uid()::text);

-- ── 7. Anulación: funciones controladas ────────────────────────────────────
-- Quién aprueba: cualquier cuenta de dueño (Pablo, Sergio, info@ y la cuenta
-- de Gmail del estudio), es decir, is_owner().

-- Solicitar: cualquier miembro del equipo con acceso a ese cliente.
CREATE OR REPLACE FUNCTION public.request_consent_annulment(p_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 5 THEN
    RAISE EXCEPTION 'Indica el motivo de la anulación';
  END IF;
  SELECT client_id INTO v_client FROM consent_forms WHERE id = p_id AND status = 'firmado';
  IF v_client IS NULL THEN
    RAISE EXCEPTION 'El consentimiento no existe o ya tiene una anulación en curso';
  END IF;
  IF NOT (is_owner() OR artist_can_access_client(v_client::text)) THEN
    RAISE EXCEPTION 'Sin permiso sobre este cliente';
  END IF;
  UPDATE consent_forms
     SET status = 'anulacion_solicitada',
         annul_reason = left(trim(p_reason), 500),
         annul_requested_by = auth.uid(),
         annul_requested_at = now(),
         annul_resolved_by = NULL,
         annul_resolved_at = NULL
   WHERE id = p_id;
END;
$$;

-- Resolver: solo dueños. Aprobar → ANULADO; rechazar → vuelve a FIRMADO.
-- El PDF original no se toca en ningún caso.
CREATE OR REPLACE FUNCTION public.resolve_consent_annulment(p_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Solo los dueños pueden aprobar o rechazar anulaciones';
  END IF;
  UPDATE consent_forms
     SET status = CASE WHEN p_approve THEN 'anulado' ELSE 'firmado' END,
         annul_resolved_by = auth.uid(),
         annul_resolved_at = now()
   WHERE id = p_id AND status = 'anulacion_solicitada';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay una solicitud de anulación pendiente para este consentimiento';
  END IF;
END;
$$;

-- ── 8. Borrado de consentimientos ANULADOS (solo dueños) + registro ─────────
-- El registro no guarda datos del cliente: solo ids, fechas, quién y por qué.
CREATE TABLE IF NOT EXISTS public.consent_deletion_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id       uuid NOT NULL,
  client_id        uuid,
  consent_type     text,
  signed_at        timestamptz,
  pdf_storage_path text,
  annul_reason     text,
  annulled_by      uuid,
  annulled_at      timestamptz,
  deleted_by       uuid NOT NULL,
  deleted_at       timestamptz NOT NULL DEFAULT now(),
  delete_reason    text NOT NULL
);
ALTER TABLE public.consent_deletion_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consent_deletion_log_owner_read" ON public.consent_deletion_log;
CREATE POLICY "consent_deletion_log_owner_read" ON public.consent_deletion_log
  FOR SELECT TO authenticated USING (public.is_owner());
-- Sin INSERT/UPDATE/DELETE para nadie del panel: solo escribe la función.

-- El panel borra primero el PDF (permitido por la política del bloque 3 porque
-- el consentimiento está ANULADO) y después llama a esta función.
CREATE OR REPLACE FUNCTION public.delete_annulled_consent(p_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cf consent_forms%ROWTYPE;
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Solo los dueños pueden borrar consentimientos';
  END IF;
  IF length(trim(coalesce(p_reason, ''))) < 5 THEN
    RAISE EXCEPTION 'Indica el motivo del borrado';
  END IF;
  SELECT * INTO cf FROM consent_forms WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El consentimiento no existe';
  END IF;
  IF cf.status <> 'anulado' THEN
    RAISE EXCEPTION 'Solo se puede borrar un consentimiento anulado';
  END IF;
  INSERT INTO consent_deletion_log
    (consent_id, client_id, consent_type, signed_at, pdf_storage_path,
     annul_reason, annulled_by, annulled_at, deleted_by, delete_reason)
  VALUES
    (cf.id, cf.client_id, cf.type, cf.signed_at, cf.pdf_storage_path,
     cf.annul_reason, cf.annul_resolved_by, cf.annul_resolved_at, auth.uid(), left(trim(p_reason), 500));
  DELETE FROM consent_forms WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_annulled_consent(uuid, text)    FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_annulled_consent(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.request_consent_annulment(uuid, text)  FROM public, anon;
REVOKE ALL ON FUNCTION public.resolve_consent_annulment(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_consent_annulment(uuid, text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_consent_annulment(uuid, boolean) TO authenticated;

COMMIT;
