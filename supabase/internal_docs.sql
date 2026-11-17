-- ════════════════════════════════════════════════════════════════════════════
-- internal_docs.sql — Bucket privado "internal-docs" para la documentación
-- interna RGPD (registro de tratamientos, análisis de riesgos, compromisos de
-- confidencialidad firmados...). SOLO los usuarios con rol "owner".
--
-- Requiere haber ejecutado antes privacy_hardening.sql (función is_owner()).
-- Ejecutar en Supabase Dashboard → SQL Editor → pegar todo → Run.
-- Es seguro ejecutarlo más de una vez.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Bucket privado (no público), máx. 20 MB por archivo
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('internal-docs', 'internal-docs', false, 20971520)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 20971520;

-- 2. Solo dueños: ver, subir, reemplazar y borrar
DROP POLICY IF EXISTS "internal_docs_owner_only" ON storage.objects;
CREATE POLICY "internal_docs_owner_only" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'internal-docs' AND public.is_owner())
  WITH CHECK (bucket_id = 'internal-docs' AND public.is_owner());

-- Comprobación (debe salir 1 fila con public = false)
SELECT id, public FROM storage.buckets WHERE id = 'internal-docs';
