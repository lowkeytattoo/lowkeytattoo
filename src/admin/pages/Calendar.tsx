import { useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, X, UserPlus } from "lucide-react";
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, type CalendarEvent } from "@admin/hooks/useGoogleCalendar";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { ARTISTS } from "@shared/config/artists";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Color helpers ────────────────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  Tatuaje:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Piercing: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Láser:    "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

function eventColor(summary: string) {
  for (const [key, cls] of Object.entries(SERVICE_COLORS)) {
    if (summary.includes(key)) return cls;
  }
  return "bg-primary/20 text-primary border-primary/30";
}

function eventTime(ev: CalendarEvent): string {
  if (!ev.start.dateTime) return "Todo el día";
  return format(parseISO(ev.start.dateTime), "HH:mm");
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EventPill({ ev }: { ev: CalendarEvent }) {
  return (
    <div className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${eventColor(ev.summary)}`}>
      {eventTime(ev) !== "Todo el día" && (
        <span className="opacity-70 mr-1">{eventTime(ev)}</span>
      )}
      {ev.summary}
    </div>
  );
}

function EventCard({ ev, onDelete }: { ev: CalendarEvent; onDelete: (id: string) => void }) {
  const start = ev.start.dateTime ? format(parseISO(ev.start.dateTime), "HH:mm") : null;
  const end   = ev.end.dateTime   ? format(parseISO(ev.end.dateTime),   "HH:mm") : null;

  return (
    <div className={`rounded-lg border p-3 space-y-1 ${eventColor(ev.summary)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm leading-tight">{ev.summary}</div>
        <button
          onClick={() => onDelete(ev.id)}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          title="Eliminar evento"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {(start || end) && (
        <div className="flex items-center gap-1 text-xs opacity-80">
          <Clock className="w-3 h-3" />
          {start}{end && end !== start ? ` — ${end}` : ""}
        </div>
      )}
      {ev.location && (
        <div className="flex items-center gap-1 text-xs opacity-70">
          <MapPin className="w-3 h-3" />
          {ev.location}
        </div>
      )}
      {ev.description && (
        <div className="text-xs opacity-70 whitespace-pre-line pt-1 border-t border-current/20">
          {ev.description}
        </div>
      )}
    </div>
  );
}

// ── New event form ───────────────────────────────────────────────────────────

interface NewEventForm {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  allDay: boolean;
}

function NewEventDialog({
  open,
  defaultDate,
  calendarId,
  onClose,
}: {
  open: boolean;
  defaultDate: Date | null;
  calendarId: string | null;
  onClose: () => void;
}) {
  const createEvent = useCreateCalendarEvent(calendarId);
  const { data: artistProfiles = [] } = useArtistProfiles();
  const [form, setForm] = useState<NewEventForm>({
    summary: "",
    date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    startTime: "11:00",
    endTime: "12:00",
    description: "",
    allDay: false,
  });
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  // Keep date in sync when defaultDate changes
  const dateStr = defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const set = (k: keyof NewEventForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const attendees = invitedIds
    .map((profileId) => {
      const profile = artistProfiles.find((p) => p.id === profileId);
      if (!profile?.artist_config_id) return null;
      const email = ARTISTS.find((a) => a.id === profile.artist_config_id)?.email ?? null;
      return email ? { email, displayName: profile.display_name } : null;
    })
    .filter((a): a is { email: string; displayName: string } => a !== null);

  const toggleInvite = (id: string) =>
    setInvitedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.summary.trim()) return;

    try {
      const base = {
        summary: form.summary,
        description: form.description || undefined,
        location: "Calle Dr. Allart, 50, Santa Cruz de Tenerife",
        attendees: attendees.length > 0 ? attendees : undefined,
      };
      if (form.allDay) {
        await createEvent.mutateAsync({ ...base, start: { date: form.date }, end: { date: form.date } });
      } else {
        await createEvent.mutateAsync({
          ...base,
          start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone: "Atlantic/Canary" },
          end:   { dateTime: `${form.date}T${form.endTime}:00`,   timeZone: "Atlantic/Canary" },
        });
      }
      toast.success(attendees.length > 0 ? `Evento creado e invitación enviada a ${attendees.map(a => a.displayName).join(", ")}` : "Evento creado");
      setInvitedIds([]);
      onClose();
    } catch {
      toast.error("Error al crear el evento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nueva cita manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Título *</Label>
            <Input
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Ej. Tatuaje — Juan García"
              className="bg-background border-border"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha *</Label>
            <DatePickerInput value={form.date || dateStr} onChange={(v) => set("date", v)} required />
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between rounded-sm border border-border bg-background px-3 py-2.5">
            <span className="text-sm text-foreground">Todo el día</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.allDay}
              onClick={() => set("allDay", !form.allDay)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.allDay ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${form.allDay ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Time range */}
          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Hora inicio</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Hora fin</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Cliente, zona, detalles..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          {/* Invite artists */}
          {artistProfiles.filter((p) => p.artist_config_id && ARTISTS.find((a) => a.id === p.artist_config_id)?.email).length > 0 && (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                Invitar artista
              </div>
              <div className="flex flex-wrap gap-2">
                {artistProfiles
                  .filter((p) => p.artist_config_id && ARTISTS.find((a) => a.id === p.artist_config_id)?.email)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleInvite(p.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
                        invitedIds.includes(p.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {p.display_name}
                    </button>
                  ))}
              </div>
              {attendees.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Google Calendar enviará una invitación por email a {attendees.map(a => a.displayName).join(" y ")}.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="cta-button" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creando..." : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { profile } = useAdminAuth();
  const calendarId = profile?.calendar_id ?? null;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [newEventOpen, setNewEventOpen] = useState(false);

  const timeMin = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();
  const timeMax = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();

  const { data: events = [], isLoading, error } = useCalendarEvents(timeMin, timeMax, calendarId);
  const deleteEvent = useDeleteCalendarEvent(calendarId);

  const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsForDay = (day: Date) =>
    events.filter((ev) => {
      const d = ev.start.dateTime ? parseISO(ev.start.dateTime) : ev.start.date ? parseISO(ev.start.date) : null;
      return d ? isSameDay(d, day) : false;
    });

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast.success("Evento eliminado");
    } catch {
      toast.error("Error al eliminar el evento");
    }
  };

  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-1">Citas y eventos del estudio</p>
        </div>
        <Button
          className="cta-button gap-2"
          onClick={() => setNewEventOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Calendar grid */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
                  className="px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {weekdays.map((d) => (
                <div key={d} className="py-2 text-center font-['IBM_Plex_Mono'] text-xs text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground text-sm">Cargando eventos...</div>
            ) : error ? (
              <div className="py-20 text-center text-destructive text-sm">
                Error al cargar el calendario.<br />
                <span className="text-xs text-muted-foreground">Asegúrate de que el calendario está compartido con la cuenta de servicio.</span>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const dayEvents = eventsForDay(day);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        min-h-[80px] p-1.5 text-left border-b border-r border-border transition-colors
                        ${isSelected ? "bg-primary/10" : "hover:bg-muted/30"}
                        ${i % 7 === 6 ? "border-r-0" : ""}
                      `}
                    >
                      <span className={`
                        inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-mono mb-1
                        ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""}
                        ${!isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                      `}>
                        {format(day, "d")}
                      </span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <EventPill key={ev.id} ev={ev} />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day detail panel */}
        <div className="space-y-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                  {selectedDay
                    ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
                    : "Selecciona un día"}
                </CardTitle>
                {selectedDay && (
                  <button
                    onClick={() => setNewEventOpen(true)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Añadir evento este día"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin eventos
                </p>
              ) : (
                selectedEvents.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onDelete={handleDelete} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NewEventDialog
        open={newEventOpen}
        defaultDate={selectedDay}
        calendarId={calendarId}
        onClose={() => setNewEventOpen(false)}
      />
    </div>
  );
}
