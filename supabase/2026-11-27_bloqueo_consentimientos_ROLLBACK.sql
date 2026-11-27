-- ============================================================================
-- VUELTA ATRÁS de 2026-11-27_bloqueo_consentimientos.sql
-- Restaura las reglas tal y como estaban en producción el 27/11/2026
-- (leídas de pg_policies antes del cambio). No borra las columnas nuevas ni
-- el registro de borrados, para no perder información.
-- Usar solo si el cambio da problemas.
-- ============================================================================

BEGIN;

-- consent_forms
DROP POLICY IF EXISTS "consent_forms_select" ON public.consent_forms;
DROP POLICY IF EXISTS "consent_forms_insert" ON public.consent_forms;
CREATE POLICY "artist_own_consent_forms" ON public.consent_forms FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = consent_forms.client_id AND clients.primary_artist_id = auth.uid()));
CREATE POLICY "owner_all_consent_forms" ON public.consent_forms FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));

ALTER TABLE public.consent_forms
  DROP CONSTRAINT IF EXISTS consent_forms_client_id_fkey,
  ADD  CONSTRAINT consent_forms_client_id_fkey
       FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- clients
DROP POLICY IF EXISTS "clients_artist_select" ON public.clients;
DROP POLICY IF EXISTS "clients_artist_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_artist_update" ON public.clients;
CREATE POLICY "clients_artist_own" ON public.clients FOR ALL TO authenticated
  USING (primary_artist_id = auth.uid());

-- client_photos
DROP POLICY IF EXISTS "photos_artist_select" ON public.client_photos;
DROP POLICY IF EXISTS "photos_artist_insert" ON public.client_photos;
DROP POLICY IF EXISTS "photos_artist_delete_own" ON public.client_photos;
CREATE POLICY "photos_artist_own" ON public.client_photos FOR ALL TO authenticated
  USING ((session_id IN (SELECT sessions.id FROM sessions WHERE sessions.artist_id = auth.uid()))
      OR (client_id IN (SELECT clients.id FROM clients WHERE clients.primary_artist_id = auth.uid())));

-- storage
DROP POLICY IF EXISTS "consent_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "consent_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "consent_docs_delete_annulled" ON storage.objects;
CREATE POLICY "consent_docs_owner_or_artist" ON storage.objects FOR ALL TO authenticated
  USING      ((bucket_id = 'consent-documents') AND (is_owner() OR artist_can_access_client((storage.foldername(name))[1])))
  WITH CHECK ((bucket_id = 'consent-documents') AND (is_owner() OR artist_can_access_client((storage.foldername(name))[1])));

DROP POLICY IF EXISTS "client_photos_owner_all" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_artist_select" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_artist_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_artist_delete_own" ON storage.objects;
CREATE POLICY "client_photos_owner_or_artist" ON storage.objects FOR ALL TO authenticated
  USING      ((bucket_id = 'client-photos') AND (is_owner() OR artist_can_access_client((storage.foldername(name))[2])))
  WITH CHECK ((bucket_id = 'client-photos') AND (is_owner() OR artist_can_access_client((storage.foldername(name))[2])));

COMMIT;
