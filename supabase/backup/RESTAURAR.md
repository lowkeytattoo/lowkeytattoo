# Restaurar una copia de seguridad — Lowkey Tattoo

Las copias las hace cada noche `.github/workflows/backup.yml` y se guardan cifradas en
Backblaze B2 (UE) durante **30 días**. Cada copia es un único fichero
`lowkey-AAAA-MM-DDTHHMMZ.tar.gz.gpg` que contiene:

| Carpeta / fichero | Contenido |
|---|---|
| `db/roles.sql` | Roles de la base de datos |
| `db/schema.sql` | Estructura: tablas, reglas RLS, funciones, triggers |
| `db/data.sql` | Datos de todas las tablas (incluidos usuarios del panel y metadatos de Storage) |
| `storage/<bucket>/…` | Todos los archivos: consentimientos PDF, fotos de clientes, blog, avatares, documentos internos |
| `buckets.txt` | Lista de buckets copiados |
| `MANIFEST.sha256` | Huella SHA-256 de cada fichero, para comprobar que nada está dañado |

> ⚠️ La copia contiene **datos de salud**. Descífrala solo en un ordenador del estudio, con
> el disco cifrado, y borra los ficheros descifrados al terminar. No la subas a ningún otro
> servicio ni la envíes por email o WhatsApp.

Necesitas: la **contraseña de cifrado** (la tienen Pablo, Sergio y el técnico), acceso a la
cuenta de **Backblaze**, `gpg` y, para restaurar la base de datos, `psql` y la
[CLI de Supabase](https://supabase.com/docs/guides/cli).

---

## 1. Descargar y descifrar

1. Backblaze → **Buckets** → el bucket de copias → **Browse Files** → descarga la copia de la
   fecha que necesites.
2. Descifra y descomprime en una carpeta de trabajo:

   ```bash
   mkdir -p ~/restauracion && cd ~/restauracion
   gpg -d lowkey-AAAA-MM-DDTHHMMZ.tar.gz.gpg | tar -xz
   # gpg pedirá la contraseña de cifrado
   ```

3. Comprueba que todo está íntegro (debe decir `OK` en cada línea):

   ```bash
   shasum -a 256 -c MANIFEST.sha256      # macOS
   # sha256sum -c MANIFEST.sha256        # Linux
   ```

## 2. Recuperar solo un archivo (caso más habitual)

Por ejemplo, un PDF de consentimiento borrado o dañado: está en
`storage/consent-documents/<id_cliente>/<tipo>_<fecha>.pdf`. Ábrelo para comprobarlo y
vuelve a subirlo desde Supabase → **Storage** → `consent-documents` → carpeta del cliente →
**Upload file**, con exactamente el mismo nombre.

Si además falta la fila del consentimiento en la base de datos, búscala en `db/data.sql`
(sección `COPY public.consent_forms`) y pide ayuda al técnico para reinsertarla.

## 3. Restauración completa (si se pierde el proyecto de Supabase)

**Siempre primero en un proyecto nuevo de prueba**, nunca encima del de producción.

1. Crea un proyecto nuevo en Supabase (región **North EU – Stockholm**) y copia su cadena
   de conexión **Session pooler** (Project → Connect).
2. Restaura roles, estructura y datos:

   ```bash
   export NEW_DB_URL='postgresql://postgres.<ref>:<contraseña>@aws-0-eu-north-1.pooler.supabase.com:5432/postgres'
   psql "$NEW_DB_URL" -f db/roles.sql
   psql "$NEW_DB_URL" -f db/schema.sql
   psql "$NEW_DB_URL" -c "SET session_replication_role = replica;" -f db/data.sql
   ```

3. Crea los mismos buckets (ver `buckets.txt`; todos privados salvo `avatars` y
   `blog-images`) y sube los archivos con las claves S3 del proyecto nuevo:

   ```bash
   # Configura un remoto "nuevo" en rclone (tipo s3, proveedor Other, endpoint
   # https://<ref>.storage.supabase.co/storage/v1/s3, región eu-north-1)
   for b in $(cat buckets.txt); do rclone copy "storage/$b" "nuevo:$b"; done
   ```

4. Comprueba en el proyecto nuevo: iniciar sesión en el panel con un usuario, abrir dos
   fichas de cliente y sus PDFs de consentimiento.
5. **Reaplica las supresiones**: si desde la fecha de la copia se borraron datos por una
   solicitud de supresión o un consentimiento anulado, vuelve a borrarlos antes de usar el
   proyecto. Consulta el registro de derechos, `consent_deletion_log` (consentimientos anulados
   borrados) y `audit_events` con `action = 'purge'` o `'delete'` posteriores a la fecha de la
   copia (panel → RGPD → Registro de actividad).
6. Para pasar a producción: cambia `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel,
   vuelve a desplegar las Edge Functions y sus secretos, y vuelve a programar los trabajos
   de `pg_cron` si no se han restaurado.

## 4. Prueba trimestral (obligatoria)

Una vez cada tres meses, haz los pasos 1 y 2 con la copia más reciente (descargar,
descifrar, comprobar `MANIFEST.sha256` y abrir dos PDFs). Anota el resultado en el
registro de pruebas de copia (dossier RGPD, apartado 14.5): fecha, copia usada, resultado
y quién la hizo. Borra los ficheros descifrados al terminar.

## 5. Si la copia nocturna falla

Llega un email de GitHub y un WhatsApp al admin. Revisa la ejecución en GitHub →
**Actions** → *Backup diario cifrado*. Causas habituales:

| Error | Solución |
|---|---|
| `Faltan secretos` | Revisa los secretos en GitHub → Settings → Secrets and variables → Actions |
| Fallo en *Exportar base de datos* | La contraseña de la base de datos cambió: actualiza `SUPABASE_DB_URL` |
| Fallo en *Descargar archivos* | Claves S3 de Supabase revocadas: genera otras y actualiza los secretos |
| Fallo en *Subir a Backblaze* | Clave de Backblaze caducada o sin permiso `writeFiles` |

Se puede lanzar una copia a mano en cualquier momento: GitHub → Actions → *Backup diario
cifrado* → **Run workflow**.
