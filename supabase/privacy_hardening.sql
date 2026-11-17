-- ════════════════════════════════════════════════════════════════════════════
-- privacy_hardening.sql — RGPD hardening (noviembre 2026)
-- Ejecutar UNA vez en Supabase Dashboard → SQL Editor → pegar todo → Run.
-- Es seguro ejecutarlo más de una vez.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. profiles: ocultar emails y roles del equipo al público ───────────────
-- La web pública solo necesita artist_config_id, available_services y
-- calendar_id (servicios de cada artista y disponibilidad del calendario).
REVOKE SELECT ON public.profiles FROM anon;
GRANT  SELECT (artist_config_id, available_services, calendar_id) ON public.profiles TO anon;


-- ── 2. Storage: fichas de consentimiento y fotos de clientes ────────────────
-- Dueños: acceso total. Artistas: solo archivos de SUS clientes
-- (cliente asignado a ellos o con alguna sesión suya).
--   consent-documents → ruta "<client_id>/<archivo>.pdf"
--   client-photos     → ruta "clients/<client_id>/<archivo>.webp"

-- 2a. Borrar las políticas anteriores de estos dos buckets
--     (daban acceso a cualquier usuario con sesión).
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') || coalesce(with_check, '')) ~ '(consent-documents|client-photos)'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 2b. Funciones auxiliares
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner');
$$;

CREATE OR REPLACE FUNCTION public.artist_can_access_client(client_id_text text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id::text = client_id_text
      AND (
        c.primary_artist_id = auth.uid()
        OR EXISTS (SELECT 1 FROM sessions s WHERE s.client_id = c.id AND s.artist_id = auth.uid())
      )
  );
$$;

-- 2c. Políticas nuevas
CREATE POLICY "consent_docs_owner_or_artist" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'consent-documents'
    AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[1]))
  )
  WITH CHECK (
    bucket_id = 'consent-documents'
    AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[1]))
  );

CREATE POLICY "client_photos_owner_or_artist" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[2]))
  )
  WITH CHECK (
    bucket_id = 'client-photos'
    AND (public.is_owner() OR public.artist_can_access_client((storage.foldername(name))[2]))
  );


-- ── 3. Borrado automático de solicitudes web con más de 12 meses ───────────
-- web_bookings guarda las solicitudes de cita y los mensajes de contacto.
-- Los clientes reales tienen su propia ficha en "clients", que no se toca.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'purge-old-web-bookings',
  '0 4 * * *',   -- todos los días a las 04:00 UTC
  $$DELETE FROM public.web_bookings WHERE created_at < now() - interval '12 months'$$
);


-- ── Comprobaciones (deben salir 2 políticas y 1 tarea) ──────────────────────
SELECT policyname FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname IN ('consent_docs_owner_or_artist', 'client_photos_owner_or_artist');

SELECT jobname, schedule FROM cron.job WHERE jobname = 'purge-old-web-bookings';
