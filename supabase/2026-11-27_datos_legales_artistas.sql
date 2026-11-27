-- ============================================================================
-- RGPD · Consentimientos Fase 0 · Datos legales de los artistas (27/11/2026)
--
-- DNI/NIE y nº de certificado higiénico-sanitario del aplicador, que deben
-- figurar en cada consentimiento. Van en una tabla propia (no en `profiles`,
-- que puede leer cualquier usuario del panel, ni en shared/config/artists.ts,
-- que se publica en la web):
--   - cada artista ve y edita solo los suyos;
--   - los dueños ven y editan los de todos.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.artist_legal_info (
  profile_id    uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  nif           text CHECK (nif IS NULL OR length(nif) BETWEEN 5 AND 20),
  sanitary_cert text CHECK (sanitary_cert IS NULL OR length(sanitary_cert) <= 80),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid DEFAULT auth.uid()
);

ALTER TABLE public.artist_legal_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artist_legal_select" ON public.artist_legal_info;
DROP POLICY IF EXISTS "artist_legal_insert" ON public.artist_legal_info;
DROP POLICY IF EXISTS "artist_legal_update" ON public.artist_legal_info;

CREATE POLICY "artist_legal_select" ON public.artist_legal_info
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_owner());

CREATE POLICY "artist_legal_insert" ON public.artist_legal_info
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.is_owner());

CREATE POLICY "artist_legal_update" ON public.artist_legal_info
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_owner())
  WITH CHECK (profile_id = auth.uid() OR public.is_owner());
-- Sin DELETE: se vacían los campos si hace falta.

-- Quién y cuándo modificó por última vez (servidor, no el navegador)
CREATE OR REPLACE FUNCTION public.artist_legal_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_artist_legal_touch ON public.artist_legal_info;
CREATE TRIGGER trg_artist_legal_touch
  BEFORE INSERT OR UPDATE ON public.artist_legal_info
  FOR EACH ROW EXECUTE FUNCTION public.artist_legal_touch();

COMMIT;
