import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import {
  useRetentionCandidates, useAccessReview, useReviewStatus, useAnnualReviews, useCompleteAnnualReview,
  useSetRetentionHold, useRevokeAccess, usePurgeExpiredClient, type RetentionCandidate,
} from "@admin/hooks/useCompliance";

// Revisión anual de conservación (cada enero). Cumple lo que promete la
// política de privacidad: "una vez al año revisamos los datos que han
// superado los plazos y los eliminamos o bloqueamos".

const fmt = (iso: string | null | undefined, withTime = false) =>
  iso ? format(new Date(iso), withTime ? "d MMM yyyy HH:mm" : "d MMM yyyy", { locale: es }) : "—";

const PERMISSION_LABEL: Record<string, string> = {
  internal: "foto interna", studioWeb: "web Lowkey", studioSocial: "redes Lowkey",
  artistPortfolio: "portfolio del artista", artistSocial: "redes del artista",
};

const MANUAL_ITEMS: { key: string; label: string }[] = [
  { key: "paper", label: "Archivo en papel: destruidos los documentos que han superado su plazo, con acta de destrucción (o no había ninguno)." },
  { key: "calendar", label: "Google Calendar: revisados y borrados los eventos de citas de más de 2 años." },
  { key: "gmail", label: "Bajas de artistas del año: comprobado que han borrado o devuelto los correos y fotos del estudio (declaración firmada)." },
  { key: "devices", label: "Móviles y tablets: sin copias de consentimientos ni fotos de clientes que ya no hagan falta; sin nubes personales no autorizadas." },
  { key: "accounts", label: "Cuentas del panel: cada persona tiene la suya, se han dado de baja las que ya no se usan y los roles son correctos." },
  { key: "providers", label: "Proveedores: sin cambios, o los nuevos están en la carpeta de contratos de tratamiento." },
];

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-4 space-y-3">
    <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-foreground">{n} · {title}</h2>
    {children}
  </section>
);

export default function AnnualReview() {
  const { profile } = useAdminAuth();
  const year = new Date().getFullYear();
  const { data: candidates } = useRetentionCandidates();
  const { data: access } = useAccessReview();
  const { data: status } = useReviewStatus();
  const { data: reviews } = useAnnualReviews();
  const { data: profiles } = useArtistProfiles();
  const complete = useCompleteAnnualReview();
  const setHold = useSetRetentionHold();
  const revoke = useRevokeAccess();
  const purge = usePurgeExpiredClient();

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [restoreDate, setRestoreDate] = useState("");
  const [notes, setNotes] = useState("");
  const [holdTarget, setHoldTarget] = useState<RetentionCandidate | null>(null);
  const [holdUntil, setHoldUntil] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [purgeTarget, setPurgeTarget] = useState<RetentionCandidate | null>(null);
  const [purgeReason, setPurgeReason] = useState("");

  const thisYear = (reviews ?? []).find((r) => r.review_year === year);
  const nameOf = (id: string) => (profiles ?? []).find((p) => p.id === id)?.display_name ?? "—";

  const oldestOk = !status?.oldest_web_booking ||
    new Date(status.oldest_web_booking) > new Date(Date.now() - 366 * 24 * 3600 * 1000);
  const autoOk = !!status?.web_purge_last_ok && oldestOk;

  const allItems = ["candidates", "web", "backup", "access", "withdrawals", ...MANUAL_ITEMS.map((i) => i.key)];
  const missing = allItems.filter((k) => !checks[k]).length + (restoreDate ? 0 : 1);
  const tick = (k: string) => (v: boolean | "indeterminate") => setChecks((c) => ({ ...c, [k]: !!v }));

  const onComplete = () => {
    if (!profile) return;
    complete.mutate(
      {
        review_year: year,
        completed_by: profile.id,
        notes,
        checklist: {
          ...checks,
          restore_test_date: restoreDate,
          candidates_pending: (candidates ?? []).filter((c) => !c.hold_until).length,
          access_pending: (access ?? []).length,
          web_purge_last_ok: status?.web_purge_last_ok ?? null,
        },
      },
      {
        onSuccess: () => toast.success(`Revisión ${year} registrada`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-6 h-6" /> Revisión anual {year}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Una vez al año (en enero) se revisan los datos que han superado sus plazos y se eliminan o se conservan
            con motivo. Al terminar, pulsa «Revisión completada»: queda constancia de quién la hizo y cuándo.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/rgpd"><ArrowLeft className="w-4 h-4 mr-1" /> RGPD</Link>
        </Button>
      </div>

      {thisYear && (
        <div className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm">
          Revisión {year} completada el {fmt(thisYear.completed_at, true)} por {nameOf(thisYear.completed_by)}.
        </div>
      )}

      <Section n={1} title="Clientes con más de 5 años sin actividad">
        <p className="text-xs text-muted-foreground">
          Más de 5 años desde su última sesión o consentimiento y sin citas futuras. Hasta 2031 no debería aparecer
          ninguno del sistema digital (empezó en 2026).
        </p>
        {(candidates ?? []).length === 0 ? (
          <p className="text-sm">Ningún cliente ha superado el plazo.</p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {(candidates ?? []).map((c) => (
              <div key={c.client_id} className="px-3 py-2 text-sm flex flex-wrap items-center gap-2">
                <Link to={`/admin/clients/${c.client_id}`} className="font-medium underline">{c.client_name}</Link>
                <span className="text-xs text-muted-foreground">
                  última actividad {fmt(c.last_activity)} · {c.consents} consentimiento(s)
                  {c.hold_until && ` · conservar hasta ${fmt(c.hold_until)} (${c.hold_reason ?? "sin motivo"})`}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => { setHoldUntil(c.hold_until ?? ""); setHoldReason(c.hold_reason ?? ""); setHoldTarget(c); }}>
                    Conservar
                  </Button>
                  {!c.hold_until && (
                    <Button size="sm" variant="destructive" className="h-7 text-xs"
                      onClick={() => { setPurgeReason(""); setPurgeTarget(c); }}>
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={!!checks.candidates} onCheckedChange={tick("candidates")} className="mt-0.5" />
          Revisados: eliminados los que procede y los demás marcados como «Conservar» con motivo.</label>
      </Section>

      <Section n={2} title="Borrado automático de solicitudes web (12 meses)">
        <ul className="text-sm space-y-1">
          <li>Última ejecución correcta: <strong>{fmt(status?.web_purge_last_ok, true)}</strong></li>
          {status?.web_purge_last_fail && <li className="text-destructive">Último fallo: {fmt(status.web_purge_last_fail, true)}</li>}
          <li>Solicitud más antigua guardada: {fmt(status?.oldest_web_booking)} {oldestOk ? "✓" : "⚠️ tiene más de 12 meses"}</li>
          <li>Limpieza del registro de actividad (2 años): última {fmt(status?.audit_purge_last_ok, true)}</li>
        </ul>
        {!autoOk && <p className="text-xs text-destructive">Revisa las tareas programadas en Supabase (pg_cron).</p>}
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={!!checks.web} onCheckedChange={tick("web")} className="mt-0.5" />
          Comprobado que el borrado automático funciona.</label>
      </Section>

      <Section n={3} title="Copias de seguridad">
        <p className="text-xs text-muted-foreground">
          La copia diaria se hace sola (GitHub Actions → Backblaze). Una vez al trimestre hay que probar una
          restauración siguiendo supabase/backup/RESTAURAR.md.
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Fecha de la última prueba de restauración</Label>
          <Input type="date" value={restoreDate} onChange={(e) => setRestoreDate(e.target.value)} className="h-9 w-44" />
        </div>
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={!!checks.backup} onCheckedChange={tick("backup")} className="mt-0.5" />
          Las copias de los últimos días están en Backblaze y la última prueba de restauración funcionó.</label>
      </Section>

      <Section n={4} title="Accesos de artistas a clientes antiguos">
        <p className="text-xs text-muted-foreground">
          Artistas que atendieron a un cliente hace más de 2 años y siguen pudiendo ver sus consentimientos y fotos.
          Si ya no lo necesitan, retira el acceso (si vuelven a atenderle, lo recuperan con la nueva sesión).
        </p>
        {(access ?? []).length === 0 ? (
          <p className="text-sm">Ningún acceso antiguo pendiente.</p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {(access ?? []).map((a) => (
              <div key={`${a.client_id}-${a.artist_id}`} className="px-3 py-2 text-sm flex flex-wrap items-center gap-2">
                <span><strong>{a.artist_name}</strong> → {a.client_name}</span>
                <span className="text-xs text-muted-foreground">última sesión {fmt(a.last_session)}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" disabled={revoke.isPending}
                  onClick={() => revoke.mutate({ clientId: a.client_id, artistId: a.artist_id }, {
                    onSuccess: () => toast.success("Acceso retirado"),
                    onError: (e) => toast.error((e as Error).message),
                  })}>
                  Retirar acceso
                </Button>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={!!checks.access} onCheckedChange={tick("access")} className="mt-0.5" />
          Revisados los accesos antiguos.</label>
      </Section>

      <Section n={5} title="Autorizaciones de imagen retiradas (últimos 12 meses)">
        {(status?.withdrawals_12m ?? []).length === 0 ? (
          <p className="text-sm">No se ha retirado ninguna autorización.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {(status?.withdrawals_12m ?? []).map((w, i) => (
              <li key={i}>
                {fmt(w.withdrawn_at)} · {w.client_name ?? "cliente eliminado"} · {PERMISSION_LABEL[w.permission] ?? w.permission}
                {w.note && <span className="text-muted-foreground"> · {w.note}</span>}
              </li>
            ))}
          </ul>
        )}
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={!!checks.withdrawals} onCheckedChange={tick("withdrawals")} className="mt-0.5" />
          Comprobado que esas fotos ya no están publicadas en la web ni en las redes del estudio, y que los artistas lo han hecho en las suyas.</label>
      </Section>

      <Section n={6} title="Comprobaciones manuales">
        {MANUAL_ITEMS.map((i) => (
          <label key={i.key} className="flex items-start gap-2 text-sm">
            <Checkbox checked={!!checks[i.key]} onCheckedChange={tick(i.key)} className="mt-0.5" />{i.label}
          </label>
        ))}
        <div className="space-y-1">
          <Label className="text-xs">Notas de la revisión (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        {missing > 0 && <span className="text-xs text-muted-foreground">Faltan {missing} comprobaciones</span>}
        <Button className="cta-button" disabled={missing > 0 || complete.isPending} onClick={onComplete}>
          Revisión completada
        </Button>
      </div>

      {(reviews ?? []).length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider mb-2">Revisiones anteriores</h2>
          <ul className="text-sm space-y-1">
            {(reviews ?? []).map((r) => (
              <li key={r.id}>
                {r.review_year} · {fmt(r.completed_at, true)} · {nameOf(r.completed_by)}
                {r.notes && <span className="text-muted-foreground"> · {r.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Conservar */}
      <AlertDialog open={!!holdTarget} onOpenChange={(o) => { if (!o) setHoldTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Conservar a {holdTarget?.client_name}</AlertDialogTitle>
            <AlertDialogDescription>
              Por ejemplo, si hay una reclamación abierta. No se podrá eliminar hasta la fecha indicada. Déjalo vacío para quitar la conservación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Conservar hasta</Label>
            <Input type="date" value={holdUntil} onChange={(e) => setHoldUntil(e.target.value)} />
            <Label className="text-xs">Motivo</Label>
            <Input value={holdReason} onChange={(e) => setHoldReason(e.target.value)} maxLength={300} placeholder="Ej.: reclamación abierta" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!holdUntil && holdReason.trim().length < 3}
              onClick={() => holdTarget && setHold.mutate(
                { clientId: holdTarget.client_id, until: holdUntil || null, reason: holdUntil ? holdReason.trim() : null },
                { onSuccess: () => toast.success("Guardado"), onError: (e) => toast.error((e as Error).message) },
              )}
            >
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar caducado */}
      <AlertDialog open={!!purgeTarget} onOpenChange={(o) => { if (!o) setPurgeTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {purgeTarget?.client_name} definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran su ficha, sesiones, fotos y consentimientos (todos con más de 5 años). No se puede deshacer.
              Las copias de seguridad lo conservan 30 días más. Queda constancia del borrado sin datos personales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Motivo</Label>
            <Input value={purgeReason} onChange={(e) => setPurgeReason(e.target.value)} maxLength={150} placeholder="Ej.: plazo de conservación cumplido" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={purgeReason.trim().length < 5 || purge.isPending}
              onClick={() => purgeTarget && purge.mutate(
                { clientId: purgeTarget.client_id, reason: purgeReason.trim() },
                { onSuccess: () => toast.success("Cliente eliminado"), onError: (e) => toast.error((e as Error).message) },
              )}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
