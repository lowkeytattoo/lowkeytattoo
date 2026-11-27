import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useAuditEvents, useClientNames, type AuditEvent } from "@admin/hooks/useCompliance";

// Registro de actividad (auditoría RGPD): quién creó, modificó, borró o
// consultó qué y cuándo. Solo dueños. Se conserva 2 años.

const ACTION_LABEL: Record<AuditEvent["action"], string> = {
  insert: "Creó",
  update: "Modificó",
  delete: "Borró",
  view: "Consultó",
  download: "Descargó",
  purge: "Borrado por caducidad",
};

const TABLE_LABEL: Record<string, string> = {
  clients: "Ficha de cliente",
  sessions: "Sesión",
  client_photos: "Foto",
  consent_forms: "Consentimiento",
  web_bookings: "Solicitud web",
  artist_legal_info: "Datos legales de artista",
  profiles: "Perfil del equipo",
};

const FIELD_LABEL: Record<string, string> = {
  name: "nombre", phone: "teléfono", email: "email", notes: "notas", allergies: "alergias",
  birthday: "nacimiento", primary_artist_id: "artista principal", date: "fecha", start_time: "hora",
  type: "tipo", price: "precio", deposit: "señal", paid: "pagado", duration_minutes: "duración",
  body_zone: "zona", style: "estilo", status: "estado", is_cover: "foto de perfil", description: "descripción",
  role: "rol", display_name: "nombre", avatar_url: "avatar", available_services: "servicios",
  calendar_id: "calendario", nif: "DNI/NIE", sanitary_cert: "certificado",
  retention_hold_until: "conservar hasta", retention_hold_reason: "motivo de conservación",
  purge_approved_at: "aprobación de borrado", annul_reason: "motivo de anulación",
  annul_requested_by: "anulación solicitada por", annul_requested_at: "fecha de solicitud",
  annul_resolved_by: "anulación resuelta por", annul_resolved_at: "fecha de resolución",
};

const PAGE = 200;
const field = "h-9 rounded-md border border-border bg-background px-2 text-sm";

export default function ActivityLog() {
  const [params, setParams] = useSearchParams();
  const clientId = params.get("client") ?? "";
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [table, setTable] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const { data: profiles } = useArtistProfiles();
  const { data: events, isLoading } = useAuditEvents({ actor, action, table, clientId, from, to, limit });
  const clientIds = [...new Set((events ?? []).map((e) => e.client_id).filter((x): x is string => !!x))];
  const { data: clientNames } = useClientNames(clientIds);
  const profileName = (id: string | null) =>
    id ? (profiles ?? []).find((p) => p.id === id)?.display_name ?? "Usuario eliminado" : "Sistema (automático)";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6" /> Registro de actividad
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Quién creó, modificó, borró o consultó datos de clientes, y cuándo. Solo se guardan los nombres de los
            campos, nunca su contenido. Las consultas de PDF se anotan desde el panel (orientativo). Se conserva 2 años
            y nadie puede modificarlo.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/rgpd"><ArrowLeft className="w-4 h-4 mr-1" /> RGPD</Link>
        </Button>
      </div>

      {clientId && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span>Mostrando solo la actividad de <strong>{clientNames?.[clientId] ?? "este cliente"}</strong></span>
          <button type="button" className="text-xs underline text-muted-foreground" onClick={() => setParams({})}>Ver todo</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Persona</Label>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={`${field} w-full`}>
            <option value="">Todas</option>
            {(profiles ?? []).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            <option value="system">Sistema (automático)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Acción</Label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={`${field} w-full`}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sobre</Label>
          <select value={table} onChange={(e) => setTable(e.target.value)} className={`${field} w-full`}>
            <option value="">Todo</option>
            {Object.entries(TABLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : (events ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin actividad con estos filtros</p>
        ) : (
          (events ?? []).map((e) => (
            <div key={e.id} className="px-4 py-2.5 text-sm flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-['IBM_Plex_Mono'] text-xs text-muted-foreground w-32 shrink-0">
                {format(new Date(e.at), "d MMM yyyy HH:mm", { locale: es })}
              </span>
              <span className="font-medium">{profileName(e.actor)}</span>
              <Badge variant={e.action === "delete" || e.action === "purge" ? "destructive" : "outline"} className="text-[10px]">
                {ACTION_LABEL[e.action] ?? e.action}
              </Badge>
              <span className="text-muted-foreground">{TABLE_LABEL[e.table_name] ?? e.table_name}</span>
              {e.client_id && (
                clientNames?.[e.client_id] ? (
                  <Link to={`/admin/clients/${e.client_id}`} className="underline">{clientNames[e.client_id]}</Link>
                ) : (
                  <span className="text-muted-foreground font-mono text-xs">cliente {e.client_id.slice(0, 8)} (eliminado)</span>
                )
              )}
              {e.changed_fields && e.changed_fields.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {e.changed_fields.map((f) => FIELD_LABEL[f] ?? f).join(", ")}
                </span>
              )}
              {e.detail && <span className="text-xs text-muted-foreground">· {e.detail}</span>}
            </div>
          ))
        )}
      </div>

      {(events ?? []).length >= limit && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Cargar más</Button>
        </div>
      )}
    </div>
  );
}
