import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, Upload, FileDown, Trash2 } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Private bucket, owner-only (see supabase/internal_docs.sql).
// Nothing in this page's code contains the documents themselves: they live
// in Storage, so they never ship in the public JS bundle.
const BUCKET = "internal-docs";
const ACCEPT = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp";
const MAX_MB = 20;

interface DocFile {
  name: string;
  created_at: string | null;
  metadata: { size?: number } | null;
}

function prettySize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Keep the original name readable but safe as a storage key. */
function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_") || "documento";
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  return `${base}${ext}`;
}

export default function InternalDocs() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const { data: files, isLoading, error } = useQuery({
    queryKey: ["internal-docs"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name && !f.name.startsWith(".")) as DocFile[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Máximo ${MAX_MB} MB`);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(safeName(file.name), file, { upsert: true, contentType: file.type || undefined });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento subido");
      qc.invalidateQueries({ queryKey: ["internal-docs"] });
    },
    onError: (e: Error) => toast.error(`No se pudo subir: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento eliminado");
      qc.invalidateQueries({ queryKey: ["internal-docs"] });
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar: ${e.message}`),
  });

  const open = async (name: string) => {
    // Short-lived link: valid 60 s, only long enough to open the file.
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(name, 60);
    if (error || !data) {
      toast.error("No se pudo abrir el documento");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> Documentos RGPD
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Documentación interna de protección de datos y compromisos firmados. Solo la ven los
            dueños. No compartas los enlaces: caducan al minuto.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            <Upload className="w-4 h-4 mr-2" />
            {upload.isPending ? "Subiendo..." : "Subir documento"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Cargando...</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-card p-6 text-sm text-destructive">
          No se pudieron cargar los documentos. Comprueba que se ha ejecutado
          supabase/internal_docs.sql en Supabase.
        </div>
      ) : (files ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          Aún no hay documentos. Sube el PDF de la documentación RGPD y los compromisos de
          confidencialidad firmados.
        </div>
      ) : (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border">
          {(files ?? []).map((f) => (
            <li key={f.name} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono']">
                  {f.created_at ? format(new Date(f.created_at), "d MMM yyyy", { locale: es }) : ""}
                  {f.metadata?.size ? ` · ${prettySize(f.metadata.size)}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => open(f.name)}>
                <FileDown className="w-4 h-4 mr-1" /> Abrir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToDelete(f.name)}
                aria-label={`Eliminar ${f.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete} se borrará definitivamente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete);
                setToDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
