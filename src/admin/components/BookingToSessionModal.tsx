import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, UserCheck, UserPlus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useClientsPaged, useCreateClient } from "@admin/hooks/useClients";
import { useCreateSession } from "@admin/hooks/useSessions";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useCreateCalendarEvent, buildBookingEvent } from "@admin/hooks/useGoogleCalendar";
import { sendCalendarEmail, formatEventDate, formatEventTime, formatDuration } from "@admin/lib/calendarEmail";
import { CALENDAR_COLOR } from "@shared/config/calendar";
import { supabase } from "@shared/lib/supabase";
import type { WebBooking, SessionType } from "@shared/types/index";

// ── Schema ────────────────────────────────────────────────────────────────────

const sessionSchema = z.object({
  type:             z.enum(["tattoo", "piercing", "laser", "retoque"] as const),
  date:             z.string().min(1, "Fecha requerida"),
  startTime:        z.string().min(1, "Hora de inicio requerida"),
  duration_minutes: z.coerce.number().min(15).default(60),
  price:            z.coerce.number().min(0).optional(),
  deposit:          z.coerce.number().min(0).default(0),
  paid:             z.boolean().default(false),
  body_zone:        z.string().optional(),
  notes:            z.string().optional(),
});

type SessionForm = z.infer<typeof sessionSchema>;

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  tattoo:   "Tatuaje",
  piercing: "Piercing",
  laser:    "Láser",
  retoque:  "Retoque",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  booking: WebBooking;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingToSessionModal({ open, onClose, booking }: Props) {
  const navigate = useNavigate();

  const [step, setStep]                             = useState<1 | 2>(1);
  const [existingClientId, setExistingClientId]     = useState<string | null>(null);
  const [existingClientName, setExistingClientName] = useState("");
  const [useExisting, setUseExisting]               = useState(false);

  const { data: artistProfiles = [] } = useArtistProfiles();
  const createClient  = useCreateClient();
  const createSession = useCreateSession();
  const createEvent   = useCreateCalendarEvent();

  // ── Resolución de artista ─────────────────────────────────────────────────
  const artistProfile = artistProfiles.find(
    (p) => p.artist_config_id === booking.artist_config_id
  );

  // ── Buscar cliente existente al abrir ─────────────────────────────────────
  const { data: matchData } = useClientsPaged({
    search: booking.client_phone || booking.client_email || undefined,
    pageSize: 3,
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setExistingClientId(null);
      setExistingClientName("");
      setUseExisting(false);
      clientNameInput.current = "";
      form.reset(defaultValues());
      return;
    }
    // Auto-seleccionar si hay coincidencia exacta
    const match = matchData?.clients?.[0];
    if (match) {
      setExistingClientId(match.id);
      setExistingClientName(match.name);
      setUseExisting(true);
    }
  }, [open, matchData]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientNameInput = { current: booking.client_name ?? "" };

  const defaultValues = (): SessionForm => ({
    type:             (booking.service_type as SessionType) ?? "tattoo",
    date:             booking.preferred_date ?? "",
    startTime:        booking.preferred_time ?? "11:00",
    duration_minutes: 60,
    deposit:          0,
    paid:             false,
    body_zone:        booking.body_zone ?? "",
    notes:            booking.description ?? "",
  });

  const form = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: defaultValues(),
  });

  // Resetear valores cuando cambia la reserva
  useEffect(() => {
    if (open) form.reset(defaultValues());
  }, [booking.id, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (values: SessionForm) => {
    let clientId   = existingClientId;
    let clientName = existingClientName;

    try {
      // 1. Crear cliente si no existe
      if (!clientId) {
        const newClient = await createClient.mutateAsync({
          name:              booking.client_name ?? "Sin nombre",
          phone:             booking.client_phone ?? null,
          email:             booking.client_email ?? null,
          notes:             null,
          allergies:         null,
          primary_artist_id: artistProfile?.id ?? null,
          birthday:          null,
        });
        clientId   = newClient.id;
        clientName = newClient.name;
      }

      // 2. Calcular start/end ISO
      const startIso = `${values.date}T${values.startTime}:00`;
      const endMinutes = (values.duration_minutes ?? 60);
      const endDate  = new Date(new Date(startIso).getTime() + endMinutes * 60000);
      const endIso   = endDate.toISOString().replace("Z", "").slice(0, 19); // local-ish

      // 3. Crear sesión en BD
      await createSession.mutateAsync({
        client_id:        clientId!,
        artist_id:        artistProfile?.id ?? null,
        date:             values.date,
        type:             values.type,
        price:            values.price ?? null,
        deposit:          values.deposit ?? 0,
        paid:             values.paid ?? false,
        body_zone:        values.body_zone || null,
        style:            null,
        notes:            values.notes || null,
        duration_minutes: values.duration_minutes ?? null,
      });

      // 4. Crear evento en Google Calendar (color azul = reserva web confirmada)
      if (artistProfile?.calendar_id) {
        const calEvent = {
          ...buildBookingEvent({
            clientName,
            serviceLabel: SESSION_TYPE_LABELS[values.type],
            date:     values.date,
            time:     values.startTime,
            notes:    values.notes ?? booking.description ?? null,
            bodyZone: values.body_zone ?? booking.body_zone ?? null,
            phone:    booking.client_phone ?? null,
          }),
          colorId:    CALENDAR_COLOR.SESSION_FROM_BOOKING,
          calendarId: artistProfile.calendar_id,
        };
        await createEvent.mutateAsync(calEvent);
      }

      // 5. Marcar reserva como confirmada
      await supabase
        .from("web_bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

      // 6. Enviar emails — falla silencioso
      await sendCalendarEmail({
        action:      "Reserva confirmada",
        artistId:    booking.artist_config_id ?? "",
        clientName,
        clientPhone: booking.client_phone ?? undefined,
        clientEmail: booking.client_email ?? undefined,
        sessionType: SESSION_TYPE_LABELS[values.type],
        eventTitle:  `${SESSION_TYPE_LABELS[values.type]} — ${clientName}`,
        eventDate:   formatEventDate(new Date(startIso)),
        eventTime:   formatEventTime(startIso, endIso),
        duration:    formatDuration(startIso, endIso),
        notes:       values.notes,
        isFirstTime: booking.is_first_time ?? false,
        adminUrl:    `${window.location.origin}/admin/clients/${clientId}`,
      });

      toast.success(`Reserva confirmada y sesión registrada para ${clientName}`);
      onClose();
      navigate(`/admin/clients/${clientId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al confirmar la reserva. Inténtalo de nuevo.");
    }
  };

  const isPending = createClient.isPending || createSession.isPending || createEvent.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['IBM_Plex_Mono'] text-sm uppercase tracking-wider">
            Confirmar y registrar reserva
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {booking.client_name} · {booking.service_type}
            {booking.preferred_date && ` · ${booking.preferred_date}`}
          </p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Paso 1: Verificar cliente ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Paso 1 — Cliente
              </p>

              {useExisting && existingClientId ? (
                <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
                  <UserCheck className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{existingClientName}</p>
                    <p className="text-xs text-muted-foreground">Cliente existente encontrado</p>
                  </div>
                  <button
                    onClick={() => { setUseExisting(false); setExistingClientId(null); setExistingClientName(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                  >
                    Crear nuevo
                  </button>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium">{booking.client_name ?? "Sin nombre"}</p>
                  </div>
                  {booking.client_phone && <p className="text-xs text-muted-foreground pl-6">{booking.client_phone}</p>}
                  {booking.client_email && <p className="text-xs text-muted-foreground pl-6">{booking.client_email}</p>}
                  <p className="text-xs text-muted-foreground pl-6 italic">Se creará como cliente nuevo</p>
                </div>
              )}

              <Button className="w-full cta-button" onClick={() => setStep(2)}>
                Continuar →
              </Button>
            </motion.div>
          )}

          {/* ── Paso 2: Datos de sesión ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
            >
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Paso 2 — Sesión
              </p>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Tipo */}
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Tipo *</Label>
                    <Select
                      value={form.watch("type")}
                      onValueChange={(v) => form.setValue("type", v as SessionType)}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(SESSION_TYPE_LABELS) as [SessionType, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha y hora */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Fecha *</Label>
                    <Input type="date" {...form.register("date")} className="bg-background border-border" />
                    {form.formState.errors.date && (
                      <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Hora inicio *</Label>
                    <Input type="time" {...form.register("startTime")} className="bg-background border-border" />
                  </div>

                  {/* Duración y precio */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Duración (min)</Label>
                    <Input type="number" min={15} step={15} {...form.register("duration_minutes")} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Precio (€)</Label>
                    <Input type="number" min={0} step={0.01} {...form.register("price")} className="bg-background border-border" />
                  </div>

                  {/* Depósito y pagado */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Depósito (€)</Label>
                    <Input type="number" min={0} step={0.01} {...form.register("deposit")} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...form.register("paid")} className="accent-primary" />
                      <span className="text-xs font-mono uppercase tracking-wider">Pagado</span>
                    </label>
                  </div>

                  {/* Zona y notas */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Zona corporal</Label>
                    <Input {...form.register("body_zone")} className="bg-background border-border" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Notas</Label>
                    <Textarea {...form.register("notes")} rows={2} className="bg-background border-border resize-none" />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Volver
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1 cta-button gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar y registrar
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
