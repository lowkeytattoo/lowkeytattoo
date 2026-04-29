# Sistema de Consentimientos Digitales — Guía Técnica

> **Plataforma objetivo:** iPad (ya disponible en el estudio, usado por los artistas para diseños)  
> **Prioridad:** Integración sin fricción sobre el código existente

---

## Stack adicional necesario

```bash
npm install react-signature-canvas
npm install @types/react-signature-canvas
npm install jspdf html2canvas
```

| Paquete | Propósito |
|---|---|
| `react-signature-canvas` | Captura la firma en canvas con dedo o Apple Pencil |
| `jspdf` | Genera el PDF final del consentimiento firmado |
| `html2canvas` | Convierte el HTML del formulario a imagen para insertarlo en el PDF |

---

## Archivos a crear (sin tocar nada existente)

```
src/admin/
├── components/
│   ├── ConsentFormModal.tsx        ← Modal principal: formulario + firma
│   └── ConsentFormViewer.tsx       ← Visor/descargador de consentimientos guardados
├── hooks/
│   └── useConsentForms.ts          ← React Query hooks (fetch, create, delete)
└── pages/
    └── ConsentFormsPage.tsx        ← Listado global (fase 2, opcional)
```

**Modificación mínima en código existente:**
- `src/admin/pages/ClientProfile.tsx` → añadir botón "Nuevo consentimiento" y sección de historial de consentimientos
- `src/shared/types/index.ts` → añadir tipo `ConsentForm`
- `src/shared/config/artists.ts` → añadir campos legales al interface `Artist`

---

## Base de datos — Supabase

### Nueva tabla

```sql
CREATE TABLE consent_forms (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id    UUID        REFERENCES sessions(id) ON DELETE SET NULL,
  type          TEXT        NOT NULL CHECK (type IN ('tattoo', 'piercing', 'laser')),
  version       TEXT        NOT NULL DEFAULT '1.0',
  form_data     JSONB       NOT NULL,       -- respuestas del cuestionario
  signature_data TEXT,                      -- firma PNG en base64
  pdf_storage_path TEXT,                    -- ruta en Supabase Storage
  signed_at     TIMESTAMPTZ,
  ip_address    TEXT,
  user_agent    TEXT,
  created_by    UUID        REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
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

-- Artist: solo sus propios clientes
CREATE POLICY "artist_own_consent_forms"
  ON consent_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = consent_forms.client_id
      AND clients.primary_artist_id = auth.uid()
    )
  );

ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
```

### Nuevo bucket en Supabase Storage

Crear desde el dashboard de Supabase:
- **Nombre:** `consent-documents`
- **Visibilidad:** Privado (private)
- **Tamaño máximo por archivo:** 10 MB

```sql
-- Política de acceso al bucket (desde Storage > Policies)
-- Solo usuarios autenticados pueden leer y subir
CREATE POLICY "authenticated_consent_docs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'consent-documents'
    AND auth.role() = 'authenticated'
  );
```

---

## Cambios en `src/shared/config/artists.ts`

Añadir tres campos opcionales al interface `Artist` existente:

```typescript
export interface Artist {
  // ... campos existentes sin tocar ...

  // Campos nuevos para consentimientos informados
  nif?: string;                // DNI personal del artista (responsable legal del procedimiento)
  phone?: string;              // Teléfono de contacto para la cabecera del documento
  hygienicSanitaryCert?: string; // Nº o referencia del Certificado del Curso Higiénico-Sanitario del artista
}
```

Y rellenar los valores en el array `ARTISTS` para cada artista:

```typescript
{
  id: "pablo",
  name: "Pablo Matos",
  // ...
  nif: "XXXXXXXXX",           // ← DNI real de Pablo
  phone: "+34 XXX XXX XXX",   // ← teléfono real
  hygienicSanitaryCert: "XXXX",  // ← referencia del Certificado Higiénico-Sanitario de Pablo
},
{
  id: "sergio",
  name: "Sergio",
  // ...
  nif: "XXXXXXXXX",
  phone: "+34 XXX XXX XXX",
  hygienicSanitaryCert: "XXXX",
},
{
  id: "fifo",
  name: "Fifo",
  // ...
  nif: "XXXXXXXXX",
  phone: "+34 XXX XXX XXX",
  hygienicSanitaryCert: "XXXX",
},
```

> Los campos son opcionales (`?`) para no romper nada si aún no se han rellenado. El formulario debe validar que el artista seleccionado tenga `nif` antes de permitir generar el consentimiento.

---

## Cómo el artista determina qué datos aparecen en el PDF

El `ConsentFormModal` recibe el artista en curso como prop. La cabecera del documento se renderiza dinámicamente:

```tsx
interface ConsentFormModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  artist: Artist;   // ← artista que genera el consentimiento
  sessionId?: string;
}
```

La cabecera del PDF usa `artist.name`, `artist.nif`, `artist.phone` y `artist.sanitaryAuthNumber`. Si algún campo no está relleno, se muestra un placeholder visible `[PENDIENTE]` para que no pase desapercibido en el documento final.

El artista activo se obtiene del contexto de autenticación (`AdminAuthContext`) comparando `profile.artist_config_id` con los ids del array `ARTISTS`. Así no hace falta que el artista se seleccione manualmente: el consentimiento siempre sale firmado por quien está logado.

---

## Tipo TypeScript a añadir en `src/shared/types/index.ts`

```typescript
export type ConsentFormType = 'tattoo' | 'piercing' | 'laser';

export interface ConsentForm {
  id: string;
  client_id: string;
  session_id: string | null;
  type: ConsentFormType;
  version: string;
  form_data: Record<string, unknown>;
  signature_data: string | null;       // base64 PNG
  pdf_storage_path: string | null;
  signed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_by: string | null;
  created_at: string;
}
```

---

## Flujo completo de la feature

```
[ClientProfile] → botón "Nuevo consentimiento"
        ↓
[ConsentFormModal] abre un Dialog de shadcn/ui
        — recibe el artista logado automáticamente (del AdminAuthContext)
        — cabecera del PDF ya populada con nombre + DNI + autorización del artista
        ↓
Paso 1: Seleccionar tipo (tattoo | piercing | laser)
        — solo muestra los tipos que el artista tiene en su array services
        ↓
Paso 2: Formulario médico (React Hook Form + Zod)
        — campos dinámicos según el tipo seleccionado
        ↓
Paso 3: Resumen de riesgos + texto legal (read-only)
        ↓
Paso 4: Canvas de firma (react-signature-canvas)
        — optimizado para iPad con Apple Pencil / dedo
        — botón "Borrar" para repetir la firma
        ↓
Paso 5: Botón "Firmar y guardar"
        — html2canvas captura el formulario completo
        — jsPDF genera el PDF con datos + firma incrustada
        — PDF se sube a Supabase Storage (consent-documents/)
        — Registro se guarda en tabla consent_forms
        — Toast de confirmación
        ↓
[ClientProfile] muestra historial de consentimientos firmados
        — botón descargar / ver PDF por cada uno
```

---

## Esqueleto de ConsentFormModal.tsx

```tsx
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/shared/lib/supabase';

const STEPS = ['tipo', 'cuestionario', 'riesgos', 'firma'] as const;
type Step = typeof STEPS[number];

interface ConsentFormModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  sessionId?: string;
}

export function ConsentFormModal({
  open, onClose, clientId, clientName, sessionId
}: ConsentFormModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('tipo');
  const [formType, setFormType] = useState<'tattoo' | 'piercing' | 'laser' | null>(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const clearSignature = () => sigRef.current?.clear();

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    setSaving(true);

    // 1. Capturar firma como base64
    const signatureData = sigRef.current
      .getTrimmedCanvas()
      .toDataURL('image/png');

    // 2. Generar PDF
    const canvas = await html2canvas(formRef.current!);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // 3. Subir PDF a Supabase Storage
    const fileName = `${clientId}/${formType}_${Date.now()}.pdf`;
    const pdfBlob = pdf.output('blob');
    const { error: uploadError } = await supabase.storage
      .from('consent-documents')
      .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

    if (uploadError) { setSaving(false); return; }

    // 4. Guardar registro en la tabla
    await supabase.from('consent_forms').insert({
      client_id: clientId,
      session_id: sessionId ?? null,
      type: formType,
      form_data: formData,
      signature_data: signatureData,
      pdf_storage_path: fileName,
      signed_at: new Date().toISOString(),
      ip_address: null,   // no disponible en cliente sin backend
      user_agent: navigator.userAgent,
    });

    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>Consentimiento informado</DialogHeader>

        <div ref={formRef}>
          {/* Renderizar paso correspondiente */}
          {step === 'firma' && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Firme en el recuadro con el dedo o Apple Pencil
              </p>
              <div className="border rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="black"
                  canvasProps={{
                    width: 600,
                    height: 200,
                    className: 'w-full touch-none',
                  }}
                />
              </div>
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                Borrar firma
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])}>
            Anterior
          </Button>
          {step === 'firma' ? (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Firmar y guardar'}
            </Button>
          ) : (
            <Button onClick={() => setStep(STEPS[STEPS.indexOf(step) + 1])}>
              Siguiente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## useConsentForms.ts — hook React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { ConsentForm } from '@/shared/types';

export function useConsentForms(clientId: string) {
  return useQuery({
    queryKey: ['consent_forms', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consent_forms')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ConsentForm[];
    },
    enabled: !!clientId,
  });
}

export function useDownloadConsentPdf() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from('consent-documents')
        .download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    },
  });
}
```

---

## Consideraciones para iPad

- Usar `touch-none` en el canvas de firma para evitar scroll accidental al firmar
- El modal debe ser full-screen en móvil/tablet: `DialogContent` con `className="sm:max-w-full h-full"` o usar un `Sheet` de shadcn en lugar de `Dialog` en pantallas pequeñas
- El canvas de firma debe tener al menos **300px de alto** para que sea cómodo de firmar con el dedo
- Probar con `pointer-events: none` en el scroll del contenedor mientras se firma
- Considerar poner el paso de firma en pantalla completa (fullscreen API o simplemente ocultar el resto del modal)
- Para modo quiosco en iPad: Safari en modo Guided Access (Configuración → Accesibilidad → Guided Access) evita que el cliente salga de la app

---

## Fases de implementación sugeridas

| Fase | Alcance | Estimación |
|---|---|---|
| **Fase 1** | Tabla Supabase + Modal básico con firma + guardar PDF en Storage | 1-2 días |
| **Fase 2** | Integración en ClientProfile (botón + historial de consentimientos) | 1 día |
| **Fase 3** | Vista previa del PDF desde el admin + descarga | 0.5 días |
| **Fase 4** (opcional) | Envío del PDF firmado al email del cliente | 0.5 días |

---

## Variables de entorno

No se necesitan nuevas variables de entorno. Todo usa el cliente Supabase ya configurado (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

---

## Checklist antes de producción

- [ ] Ejecutar la SQL de la nueva tabla en Supabase (producción)
- [ ] Crear el bucket `consent-documents` como privado en Supabase Storage
- [ ] Aplicar las políticas RLS al bucket y a la tabla
- [ ] Instalar los 3 paquetes npm
- [ ] Probar el flujo completo en un iPad con Safari
- [ ] Verificar que el PDF generado es legible e incluye la firma visible
- [ ] Comprobar que el PDF se descarga correctamente desde el admin
- [ ] Rellenar en `ARTISTS` los campos `nif`, `phone` y `hygienicSanitaryCert` de cada artista
- [ ] Verificar que el PDF generado muestra el DNI correcto según el artista logado
- [ ] Comprobar que Fifo (solo `tattoo`) no ve la opción de Piercing ni Láser en el selector
