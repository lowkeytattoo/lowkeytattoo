import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Search, UserPlus, ChevronRight, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
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
import { useUpdateCalendarEvent } from "@admin/hooks/useGoogleCalendar";
import { sendCalendarEmail, formatEventDate, formatEventTime, formatDuration } from "@admin/lib/calendarEmail";
import { CALENDAR_COLOR } from "@shared/config/calendar";
import type { CalendarEventWithSource } from "@admin/hooks/useGoogleCalendar";
import type { SessionType } from "@shared/types/index";

// ── Schemas ───────────────────────────────────────────────────────────────────

const newClientSchema = z.object({
  name:      z.string().min(2, "Nombre requerido"),
  phone:     z.string().optional(),
  email:     z.string().email("Email inválido").optional().or(z.literal("")),
  notes:     z.string().optional(),
  allergies: z.string().optional(),
});

const sessionSchema = z.object({
  type:             z.enum(["tattoo", "piercing", "laser", "retoque"] as const),
  price:            z.coerce.number().min(0).optional(),
  deposit:          z.coerce.number().min(0).default(0),
  paid:             z.boolean().default(false),
  body_zone:        z.string().optional(),
  style:            z.string().optional(),
  notes:            z.string().optional(),
  duration_minutes: z.coerce.number().min(0).optional(),
});

type NewClientForm = z.infer<typeof newClientSchema>;
type SessionForm   = z.infer<typeof sessionSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  event: CalendarEventWithSource;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcDurationMinutes(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  tattoo:   "Tatuaje",
  piercing: "Piercing",
  laser:    "Láser",
  retoque:  "Retoque",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionFromEventModal({ open, onClose, event }: Props) {
  const navigate    = useNavigate();
  const startIso    = event.start.dateTime ?? "";
  const endIso      = event.end.dateTime   ?? "";

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep]                   = useState<1 | 2 | 3>(1);
  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [creatingNew, setCreatingNew]     = useState(false);

  // ── Debounce búsqueda ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Reset al cerrar ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSearch("");
      setDebouncedSearch("");
      setSelectedClientId(null);
      setSelectedClientName("");
      setCreatingNew(false);
      clientForm.reset();
      sessionForm.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hooks de datos ─────────────────────────────────────────────────────────
  const { data: clientsData, isLoading: clientsLoading } = useClientsPaged({
    search: debouncedSearch || undefined,
    pageSize: 8,
  });
  const { data: artistProfiles = [] } = useArtistProfiles();
  const createClient   = useCreateClient();
  const createSession  = useCreateSession();
  const updateEvent    = useUpdateCalendarEvent();

  // ── Resolución de artista ──────────────────────────────────────────────────
  const artistProfile = artistProfiles.find(
    (p) => p.calendar_id === event._calendarId
  );

  // ── Forms ──────────────────────────────────────────────────────────────────
  const clientForm = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "", allergies: "" },
  });

  const sessionForm = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      type:             "tattoo",
      deposit:          0,
      paid:             false,
      duration_minutes: startIso && endIso ? calcDurationMinutes(startIso, endIso) : undefined,
      notes:            event.description ?? "",
    },
  });

  // ── Seleccionar cliente existente ──────────────────────────────────────────
  const selectClient = useCallback((id: string, name: string) => {
    setSelectedClientId(id);
    setSelectedClientName(name);
    setCreatingNew(false);
    setStep(3);
  }, []);

  // ── Submit final ───────────────────────────────────────────────────────────
  const handleSubmit = async (values: SessionForm) => {
    if (!artistProfile) {
      toast.error("No se pudo vincular el evento a un artista. Configura el Calendar ID en Admin → Artistas.");
      return;
    }

    let clientId   = selectedClientId;
    let clientName = selectedClientName;

    try {
      // 1. Crear cliente si es nuevo
      if (!clientId) {
        const clientData = clientForm.getValues();
        const newClient  = await createClient.mutateAsync({
          name:               clientData.name,
          phone:              clientData.phone || null,
          email:              clientData.email || null,
          notes:              clientData.notes || null,
          allergies:          clientData.allergies || null,
          primary_artist_id:  artistProfile.id,
          birthday:           null,
        });
        clientId   = newClient.id;
        clientName = newClient.name;
      }

      // 2. Crear sesión
      await createSession.mutateAsync({
        client_id:        clientId!,
        artist_id:        artistProfile.id,
        date:             startIso.split("T")[0],
        type:             values.type,
        price:            values.price ?? null,
        deposit:          values.deposit ?? 0,
        paid:             values.paid ?? false,
        body_zone:        values.body_zone || null,
        style:            values.style || null,
        notes:            values.notes || null,
        duration_minutes: values.duration_minutes ?? null,
      });

      // 3. Actualizar evento en Google Calendar (título + color verde)
      await updateEvent.mutateAsync({
        calendarId:  event._calendarId,
        eventId:     event.id,
        summary:     `${SESSION_TYPE_LABELS[values.type]} — ${clientName}`,
        description: values.notes || event.description,
        colorId:     CALENDAR_COLOR.SESSION_FROM_EVENT,
      });

      // 4. Enviar emails (artista + admin) — falla silencioso
      if (startIso && endIso) {
        await sendCalendarEmail({
          action:      "Sesión registrada",
          artistId:    artistProfile.artist_config_id ?? "",
          clientName,
          sessionType: SESSION_TYPE_LABELS[values.type],
          eventTitle:  `${SESSION_TYPE_LABELS[values.type]} — ${clientName}`,
          eventDate:   formatEventDate(new Date(startIso)),
          eventTime:   formatEventTime(startIso, endIso),
          duration:    formatDuration(startIso, endIso),
          notes:       values.notes,
          adminUrl:    `${window.location.origin}/admin/clients/${clientId}`,
        });
      }

      toast.success(`Sesión registrada para ${clientName}`);
      onClose();
      navigate(`/admin/clients/${clientId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar la sesión. Inténtalo de nuevo.");
    }
  };

  const isPending = createClient.isPending || createSession.isPending || updateEvent.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['IBM_Plex_Mono'] text-sm uppercase tracking-wider">
            Registrar sesión
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {event.summary}
            {startIso && (
              <> · {formatEventDate(new Date(startIso))} · {startIso && endIso && formatEventTime(startIso, endIso)}</>
            )}
          </p>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 py-1">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono border transition-colors
                ${step === n ? "bg-primary text-primary-foreground border-primary" : step > n ? "bg-muted text-muted-foreground border-border" : "border-border text-muted-foreground/50"}`}>
                {n}
              </span>
              {n < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
          <span className="ml-1 text-xs text-muted-foreground">
            {step === 1 ? "Cliente" : step === 2 ? "Datos del cliente" : "Sesión"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Paso 1: Buscar cliente ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {!artistProfile && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  Este evento no está vinculado a ningún artista de la app. Configura el Calendar ID en Admin → Artistas.
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre, teléfono o email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background border-border"
                  autoFocus
                />
              </div>

              {clientsLoading && debouncedSearch && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Buscando…
                </div>
              )}

              {(clientsData?.clients ?? []).length > 0 && (
                <ul className="divide-y divide-border border border-border rounded-md overflow-hidden max-h-48 overflow-y-auto">
                  {clientsData!.clients.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => selectClient(c.id, c.name)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {debouncedSearch && !clientsLoading && (clientsData?.clients ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No se encontraron clientes con ese término.
                </p>
              )}

              <div className="pt-1 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full"
                  onClick={() => { setCreatingNew(true); setStep(2); }}
                >
                  <UserPlus className="w-4 h-4" />
                  Crear nuevo cliente
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Paso 2: Datos nuevo cliente ── */}
          {step === 2 && creatingNew && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Nombre *</Label>
                  <Input {...clientForm.register("name")} className="bg-background border-border" autoFocus />
                  {clientForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{clientForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Teléfono</Label>
                  <Input {...clientForm.register("phone")} className="bg-background border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Email</Label>
                  <Input {...clientForm.register("email")} type="email" className="bg-background border-border" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Alergias</Label>
                  <Input {...clientForm.register("allergies")} className="bg-background border-border" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Notas</Label>
                  <Textarea {...clientForm.register("notes")} rows={2} className="bg-background border-border resize-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </Button>
                <Button
                  size="sm"
                  className="flex-1 cta-button"
                  onClick={async () => {
                    const ok = await clientForm.trigger();
                    if (ok) setStep(3);
                  }}
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Paso 3: Datos de sesión ── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
            >
              <form onSubmit={sessionForm.handleSubmit(handleSubmit)} className="space-y-3">
                {selectedClientName && (
                  <p className="text-xs text-muted-foreground">
                    Cliente: <span className="text-foreground font-medium">{selectedClientName}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Tipo */}
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Tipo *</Label>
                    <Select
                      value={sessionForm.watch("type")}
                      onValueChange={(v) => sessionForm.setValue("type", v as SessionType)}
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

                  {/* Precio y depósito */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Precio (€)</Label>
                    <Input
                      type="number" min={0} step={0.01}
                      {...sessionForm.register("price")}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Depósito (€)</Label>
                    <Input
                      type="number" min={0} step={0.01}
                      {...sessionForm.register("deposit")}
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Duración */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Duración (min)</Label>
                    <Input
                      type="number" min={0}
                      {...sessionForm.register("duration_minutes")}
                      className="bg-background border-border"
                    />
                  </div>

                  {/* Pagado */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...sessionForm.register("paid")}
                        className="accent-primary"
                      />
                      <span className="text-xs font-mono uppercase tracking-wider">Pagado</span>
                    </label>
                  </div>

                  {/* Zona y estilo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Zona corporal</Label>
                    <Input {...sessionForm.register("body_zone")} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Estilo</Label>
                    <Input {...sessionForm.register("style")} className="bg-background border-border" />
                  </div>

                  {/* Notas */}
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Notas</Label>
                    <Textarea
                      {...sessionForm.register("notes")}
                      rows={2}
                      className="bg-background border-border resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => setStep(creatingNew ? 2 : 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !artistProfile}
                    className="flex-1 cta-button gap-2"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Registrar sesión
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
