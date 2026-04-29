-- ─── Tabla: consent_forms ──────────────────────────────────────────────────
-- Ejecutar en Supabase Dashboard → SQL Editor
-- También crear el bucket "consent-documents" como PRIVADO en Storage

CREATE TABLE IF NOT EXISTS consent_forms (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id       UUID        REFERENCES sessions(id) ON DELETE SET NULL,
  type             TEXT        NOT NULL CHECK (type IN ('tattoo', 'piercing', 'laser')),
  version          TEXT        NOT NULL DEFAULT '1.0',
  form_data        JSONB       NOT NULL,
  signature_data   TEXT,
  pdf_storage_path TEXT,
  signed_at        TIMESTAMPTZ,
  ip_address       TEXT,
  user_agent       TEXT,
  created_by       UUID        REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

-- Owner: acceso total
CREATE POLICY "owner_all_consent_forms"
  ON consent_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );

-- Artist: solo los consentimientos de sus propios clientes
CREATE POLICY "artist_own_consent_forms"
  ON consent_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = consent_forms.client_id
        AND clients.primary_artist_id = auth.uid()
    )
  );

-- ─── Bucket: consent-documents ─────────────────────────────────────────────
-- Crear manualmente desde Supabase Dashboard > Storage:
--   Nombre: consent-documents
--   Visibilidad: Private
--
-- Luego añadir esta política desde Storage > Policies:

-- CREATE POLICY "authenticated_consent_docs"
--   ON storage.objects FOR ALL
--   USING (
--     bucket_id = 'consent-documents'
--     AND auth.role() = 'authenticated'
--   );
