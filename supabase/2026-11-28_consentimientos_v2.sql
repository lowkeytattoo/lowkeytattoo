-- ============================================================================
-- RGPD · Consentimientos Fase 1 (formulario v2) · integridad en el servidor
-- Plan: docs/PLAN_MEJORA_CONSENTIMIENTOS_2026-11-27.md
--
-- 1. Columnas pdf_sha256 (huella del PDF) y replaces_id (documento anulado al
--    que sustituye).
-- 2. Hora del servidor: server_now() para imprimirla en el PDF; el trigger
--    acepta esa hora solo si está a menos de 10 min de now() (si no, pone now()).
-- 3. El trigger fija created_by = usuario de la sesión y el estado inicial;
--    nadie puede crear un consentimiento ya "anulado" ni con otro autor.
-- 4. Storage consent-documents:
--    - el borrado de un consentimiento ANULADO incluye la foto del documento
--      del representante (form_data.minor.documentPhotoPath);
--    - quien acaba de subir un archivo puede borrarlo durante 15 min si aún no
--      lo referencia ningún consentimiento (limpieza si falla el guardado).
--
-- Los restores con session_replication_role = replica no ejecutan triggers,
-- así que una restauración conserva signed_at/created_by originales.
-- ============================================================================

BEGIN;

-- ── 1. Columnas ─────────────────────────────────────────────────────────────
ALTER TABLE public.consent_forms
  ADD COLUMN IF NOT EXISTS pdf_sha256 text
    CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS replaces_id uuid
    REFERENCES public.consent_forms(id) ON DELETE SET NULL;

-- ── 2. Hora del servidor ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.server_now()
RETURNS timestamptz LANGUAGE sql STABLE AS $$ SELECT now() $$;
REVOKE ALL ON FUNCTION public.server_now() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.server_now() TO authenticated;

-- ── 3. Trigger de alta ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consent_forms_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.signed_at IS NULL OR abs(extract(epoch FROM (now() - NEW.signed_at))) > 600 THEN
    NEW.signed_at := now();
  END IF;
  NEW.created_by         := auth.uid();
  NEW.status             := 'firmado';
  NEW.annul_reason       := NULL;
  NEW.annul_requested_by := NULL;
  NEW.annul_requested_at := NULL;
  NEW.annul_resolved_by  := NULL;
  NEW.annul_resolved_at  := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consent_forms_before_insert ON public.consent_forms;
CREATE TRIGGER trg_consent_forms_before_insert
  BEFORE INSERT ON public.consent_forms
  FOR EACH ROW EXECUTE FUNCTION public.consent_forms_before_insert();

-- ── 4. Storage consent-documents ────────────────────────────────────────────
DROP POLICY IF EXISTS "consent_docs_delete_annulled" ON storage.objects;
CREATE POLICY "consent_docs_delete_annulled" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'consent-documents'
         AND public.is_owner()
         AND EXISTS (SELECT 1 FROM public.consent_forms cf
                     WHERE cf.status = 'anulado'
                       AND (cf.pdf_storage_path = storage.objects.name
                            OR cf.form_data -> 'minor' ->> 'documentPhotoPath' = storage.objects.name)));

DROP POLICY IF EXISTS "consent_docs_delete_own_orphan" ON storage.objects;
CREATE POLICY "consent_docs_delete_own_orphan" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'consent-documents'
         AND owner_id = auth.uid()::text
         AND created_at > now() - interval '15 minutes'
         AND NOT EXISTS (SELECT 1 FROM public.consent_forms cf
                         WHERE cf.pdf_storage_path = storage.objects.name
                            OR cf.form_data -> 'minor' ->> 'documentPhotoPath' = storage.objects.name));

COMMIT;
