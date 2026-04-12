import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useCreateSession } from "@admin/hooks/useSessions";
import { useClients, useCreateClient } from "@admin/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Reply, AlertTriangle } from "lucide-react";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import type { WebBooking, WebBookingStatus } from "@shared/types/index";
import { useCreateCalendarEvent, buildBookingEvent } from "@admin/hooks/useGoogleCalendar";
import { useArtistBusyDays } from "@web/hooks/useCalendarAvailability";
import { ARTISTS } from "@shared/config/artists";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { toast } from "sonner";

function buildWhatsAppUrl(booking: WebBooking): string {
  const phone = (booking.client_phone ?? "").replace(/\D/g, "");
  const name = booking.client_name ?? "cliente";
  const serviceLabel = SERVICE_LABELS[booking.service_type] ?? booking.service_type;
  const date = booking.preferred_date
    ? format(new Date(booking.preferred_date + "T00:00:00"), "d 'de' MMMM", { locale: es })
    : "la fecha solicitada";
  const text = `Hola ${name}, te contactamos desde Lowkey Tattoo sobre tu solicitud de ${serviceLabel.toLowerCase()} para el ${date}. `;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildGmailUrl(booking: WebBooking): string {
  const name = booking.client_name ?? "cliente";
  const serviceLabel = SERVICE_LABELS[booking.service_type] ?? booking.service_type;
  const date = booking.preferred_date
    ? format(new Date(booking.preferred_date + "T00:00:00"), "d 'de' MMMM", { locale: es })
    : "la fecha solicitada";
  const time = booking.preferred_time ? ` a las ${booking.preferred_time}` : "";

  const lines: string[] = [
    `Hola ${name},`,
    "",
    `Gracias por solicitar cita de ${serviceLabel.toLowerCase()} en Lowkey Tattoo para el ${date}${time}.`,
    "",
    "[Escribe tu respuesta aquí]",
    "",
    "Un saludo,",
    "Lowkey Tattoo",
    "Calle Dr. Allart, 50 · Santa Cruz de Tenerife",
    "tattoolowkey.com",
  ];

  const details: string[] = [];
  if (booking.body_zone) details.push(`Zona: ${booking.body_zone}`);
  if (booking.description) details.push(`Descripción: ${booking.description}`);
  if (booking.is_first_time) details.push("Primera vez en el estudio: Sí");

  if (details.length > 0) {
    lines.push("", "────────────────────────", "Detalles de la solicitud:", ...details);
  }

  return [
    "https://mail.google.com/mail/?view=cm",
    `to=${encodeURIComponent(booking.client_email ?? "")}`,
    `su=${encodeURIComponent(`Re: tu solicitud de ${serviceLabel.toLowerCase()} — Lowkey Tattoo`)}`,
    `body=${encodeURIComponent(lines.join("\n"))}`,
  ].join("&");
}

const STATUS_LABELS: Record<WebBookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<WebBookingStatus, "default" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
};

const SERVICE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
};

// Per-row conflict badge — fetches busy days for the artist and checks the booking date
function ConflictBadge({ booking }: { booking: WebBooking }) {
  const { data: profiles } = useArtistProfiles();
  const artistConfig = ARTISTS.find((a) => a.id === booking.artist_config_id);
  const profileOverride = (profiles ?? []).find((p) => p.artist_config_id === booking.artist_config_id);
  const calendarId = profileOverride?.calendar_id ?? artistConfig?.calendarId ?? null;

  const { blockedDays, partialDays } = useArtistBusyDays(calendarId || null);

  if (!booking.preferred_date || !calendarId) return null;

  const isBlocked = blockedDays.has(booking.preferred_date);
  const isPartial  = partialDays.has(booking.preferred_date);

  if (!isBlocked && !isPartial) return null;

  return (
    <span
      title={isBlocked ? "Día completamente ocupado en el calendario" : "El artista tiene otras citas ese día"}
      className="inline-flex items-center"
    >
      <AlertTriangle className={`w-3.5 h-3.5 ${isBlocked ? "text-destructive" : "text-amber-400"}`} />
    </span>
  );
}

function ConflictWarning({ booking }: { booking: WebBooking }) {
  const { data: profiles } = useArtistProfiles();
  const artistConfig = ARTISTS.find((a) => a.id === booking.artist_config_id);
  const profileOverride = (profiles ?? []).find((p) => p.artist_config_id === booking.artist_config_id);
  const calendarId = profileOverride?.calendar_id ?? artistConfig?.calendarId ?? null;

  const { blockedDays, partialDays } = useArtistBusyDays(calendarId || null);

  if (!booking.preferred_date || !calendarId) return null;

  const isBlocked = blockedDays.has(booking.preferred_date);
  const isPartial  = partialDays.has(booking.preferred_date);

  if (!isBlocked && !isPartial) return null;

  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${isBlocked ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-amber-500/40 bg-amber-500/10 text-amber-400"}`}>
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        {isBlocked
          ? "El artista tiene el día completo ocupado en Google Calendar."
          : "El artista ya tiene citas ese día. Confirma que hay disponibilidad."}
      </span>
    </div>
  );
}

export default function WebBookings() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const qc = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["web-bookings", profile?.artist_config_id],
    queryFn: async () => {
      let query = supabase
        .from("web_bookings")
        .select("*")
        .not("preferred_date", "is", null)
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as WebBooking[];
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WebBookingStatus }) => {
      const { error } = await supabase.from("web_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["web-bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings-pending-count"] });
    },
  });

  const createSession = useCreateSession();
  const createClient = useCreateClient();
  const createCalendarEvent = useCreateCalendarEvent();
  const { data: clients } = useClients();

  const [convertBooking, setConvertBooking] = useState<WebBooking | null>(null);
  const [convertClientId, setConvertClientId] = useState("");
  const [convertDate, setConvertDate] = useState("");
  const [convertPrice, setConvertPrice] = useState("");
  const [convertNotes, setConvertNotes] = useState("");

  const openConvert = (b: WebBooking) => {
    setConvertBooking(b);
    setConvertDate(b.preferred_date ?? format(new Date(), "yyyy-MM-dd"));
    setConvertNotes(b.description ?? "");
    setConvertPrice("");
    setConvertClientId("");
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertBooking) return;

    let clientId = convertClientId;

    // Auto-create client if not selected but name exists
    if (!clientId && convertBooking.client_name) {
      const newClient = await createClient.mutateAsync({
        name: convertBooking.client_name,
        phone: convertBooking.client_phone ?? null,
        email: convertBooking.client_email ?? null,
        notes: null,
        allergies: null,
        birthday: null,
        primary_artist_id: profile?.id ?? null,
      });
      clientId = newClient.id;
    }

    if (!clientId) return;

    await createSession.mutateAsync({
      client_id: clientId,
      artist_id: profile?.id ?? null,
      date: convertDate,
      type: (convertBooking.service_type as "tattoo" | "piercing" | "laser") ?? "tattoo",
      price: convertPrice ? parseFloat(convertPrice) : null,
      deposit: 0,
      paid: false,
      duration_minutes: null,
      body_zone: convertBooking.body_zone ?? null,
      style: null,
      notes: convertNotes || null,
    });

    await updateBooking.mutateAsync({ id: convertBooking.id, status: "confirmed" });

    // Create Google Calendar event (non-blocking — don't fail the whole flow if calendar errors)
    try {
      const event = buildBookingEvent({
        clientName: convertBooking.client_name ?? "Cliente",
        serviceLabel: SERVICE_LABELS[convertBooking.service_type] ?? convertBooking.service_type,
        date: convertDate,
        time: convertBooking.preferred_time,
        notes: convertNotes || null,
        bodyZone: convertBooking.body_zone ?? null,
        phone: convertBooking.client_phone ?? null,
      });
      await createCalendarEvent.mutateAsync(event);
      toast.success("Cita confirmada y añadida al calendario");
    } catch {
      toast.success("Cita confirmada");
      toast.warning("No se pudo añadir al calendario de Google");
    }

    setConvertBooking(null);
  };

  const filteredBookings = isOwner
    ? (bookings ?? [])
    : (bookings ?? []).filter((b) => b.artist_config_id === profile?.artist_config_id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Citas Web</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filteredBookings.filter((b) => b.status === "pending").length} pendientes
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Recibida</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cliente</TableHead>
              {isOwner && <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</TableHead>}
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Servicio</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha preferida</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 7 : 6} className="text-center py-12 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 7 : 6} className="text-center py-12 text-muted-foreground">Sin citas</TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((b) => (
                <TableRow key={b.id} className="border-border">
                  <TableCell className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground">
                    {format(new Date(b.created_at), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{b.client_name ?? "—"}</div>
                    {b.client_phone && (
                      <div className="text-xs text-muted-foreground font-['IBM_Plex_Mono']">{b.client_phone}</div>
                    )}
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-sm text-muted-foreground">
                      {b.artist_config_id ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono'] capitalize">
                      {SERVICE_LABELS[b.service_type] ?? b.service_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-['IBM_Plex_Mono']">
                    <div className="flex items-center gap-1.5">
                      <span>
                        {b.preferred_date
                          ? format(new Date(b.preferred_date + "T00:00:00"), "d MMM yyyy", { locale: es })
                          : "—"}
                        {b.preferred_time && ` ${b.preferred_time}`}
                      </span>
                      {b.status === "pending" && <ConflictBadge booking={b} />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[b.status]} className="text-xs font-['IBM_Plex_Mono']">
                      {STATUS_LABELS[b.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Botones de respuesta — visibles siempre que haya datos de contacto */}
                      {b.client_phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 text-green-500 hover:text-green-400 hover:bg-green-500/10 px-2"
                          asChild
                        >
                          <a href={buildWhatsAppUrl(b)} target="_blank" rel="noopener noreferrer">
                            <Phone className="w-3 h-3" />
                            WA
                          </a>
                        </Button>
                      )}
                      {b.client_email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 px-2"
                          asChild
                        >
                          <a href={buildGmailUrl(b)} target="_blank" rel="noopener noreferrer">
                            <Reply className="w-3 h-3" />
                            Gmail
                          </a>
                        </Button>
                      )}
                      {/* Acciones de estado — solo para pendientes */}
                      {b.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs px-2"
                            onClick={() => openConvert(b)}
                          >
                            Convertir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:text-destructive px-2"
                            onClick={() => updateBooking.mutate({ id: b.id, status: "cancelled" })}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Convert to session dialog */}
      <Dialog open={!!convertBooking} onOpenChange={(open) => !open && setConvertBooking(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Convertir en sesión</DialogTitle>
          </DialogHeader>
          {convertBooking && (
            <>
              <div className="bg-background border border-border rounded-lg p-3 text-sm space-y-1 mt-2">
                <div><strong>Cliente:</strong> {convertBooking.client_name}</div>
                {convertBooking.description && <div><strong>Descripción:</strong> {convertBooking.description}</div>}
                {convertBooking.body_zone && <div><strong>Zona:</strong> {convertBooking.body_zone}</div>}
              </div>
              <ConflictWarning booking={convertBooking} />
            </>
          )}
          <form onSubmit={handleConvert} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                Cliente existente (opcional)
              </Label>
              <Select value={convertClientId || "none"} onValueChange={(v) => setConvertClientId(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Crear nuevo cliente automáticamente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nuevo cliente</SelectItem>
                  {(clients ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha *</Label>
                <DatePickerInput value={convertDate} onChange={setConvertDate} required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Precio (€)</Label>
                <Input type="number" min="0" step="0.01" value={convertPrice} onChange={(e) => setConvertPrice(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={convertNotes} onChange={(e) => setConvertNotes(e.target.value)} className="bg-background border-border" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConvertBooking(null)}>Cancelar</Button>
              <Button
                type="submit"
                className="cta-button"
                disabled={createSession.isPending || createClient.isPending}
              >
                {createSession.isPending ? "Guardando..." : "Convertir en sesión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
