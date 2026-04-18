import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, X } from "lucide-react";
import { useAllCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, type CalendarEvent, type CalendarEventWithSource } from "@admin/hooks/useGoogleCalendar";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { ARTISTS } from "@shared/config/artists";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import { ArtistAvatar } from "@admin/components/ArtistAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Color helpers ────────────────────────────────────────────────────────────

const CALENDAR_PALETTE = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
];

function buildColorMap(calendarIds: string[]): Record<string, string> {
  return Object.fromEntries(
    calendarIds.map((id, i) => [id, CALENDAR_PALETTE[i % CALENDAR_PALETTE.length]])
  );
}

function eventTime(ev: CalendarEvent): string {
  if (!ev.start.dateTime) return "Todo el día";
  return format(parseISO(ev.start.dateTime), "HH:mm");
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EventPill({ ev, colorClass }: { ev: CalendarEvent; colorClass: string }) {
  return (
    <div className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${colorClass}`}>
      {eventTime(ev) !== "Todo el día" && (
        <span className="opacity-70 mr-1">{eventTime(ev)}</span>
      )}
      {ev.summary}
    </div>
  );
}

function EventCard({ ev, colorClass, onDelete }: { ev: CalendarEvent; colorClass: string; onDelete: (ev: CalendarEvent) => void }) {
  const start = ev.start.dateTime ? format(parseISO(ev.start.dateTime), "HH:mm") : null;
  const end   = ev.end.dateTime   ? format(parseISO(ev.end.dateTime),   "HH:mm") : null;

  return (
    <div className={`rounded-lg border p-3 space-y-1 ${colorClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm leading-tight">{ev.summary}</div>
        <button
          onClick={() => onDelete(ev)}
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
  allCalendarIds,
  colorMap,
  labelMap,
  onClose,
}: {
  open: boolean;
  defaultDate: Date | null;
  calendarId: string | null;
  allCalendarIds: string[];
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
  onClose: () => void;
}) {
  const createEvent = useCreateCalendarEvent(calendarId);
  const [form, setForm] = useState<NewEventForm>({
    summary: "",
    date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    startTime: "11:00",
    endTime: "12:00",
    description: "",
    allDay: false,
  });
  const [targetCalendarId, setTargetCalendarId] = useState<string>(calendarId ?? "");

  useEffect(() => {
    if (!open) {
      setForm({
        summary: "",
        date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        startTime: "11:00",
        endTime: "12:00",
        description: "",
        allDay: false,
      });
      setTargetCalendarId(calendarId ?? "");
    } else if (defaultDate) {
      setForm((f) => ({ ...f, date: format(defaultDate, "yyyy-MM-dd") }));
    }
  }, [open, defaultDate, calendarId]);

  const set = (k: keyof NewEventForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.summary.trim()) return;

    const timing = form.allDay
      ? { start: { date: form.date }, end: { date: form.date } }
      : {
          start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone: "Atlantic/Canary" },
          end:   { dateTime: `${form.date}T${form.endTime}:00`,   timeZone: "Atlantic/Canary" },
        };

    try {
      await createEvent.mutateAsync({
        calendarId: targetCalendarId || undefined,
        summary: form.summary,
        description: form.description || undefined,
        location: "Calle Dr. Allart, 50, Santa Cruz de Tenerife",
        ...timing,
      });
      toast.success(`Evento creado en ${labelMap[targetCalendarId] ?? "calendario"}`);
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

          {/* Calendar selector */}
          {allCalendarIds.length > 1 && (
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Calendario</Label>
              <div className="flex flex-wrap gap-2">
                {allCalendarIds.map((id) => {
                  const isSelected = targetCalendarId === id;
                  const dotColor = colorMap[id] ?? CALENDAR_PALETTE[0];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTargetCalendarId(id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full border ${dotColor}`} />
                      {labelMap[id] ?? id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha *</Label>
            <DatePickerInput value={form.date} onChange={(v) => set("date", v)} required />
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
  const { data: artistProfiles = [] } = useArtistProfiles();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const timeMin = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();
  const timeMax = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();

  // Collect all calendar IDs: current user + all artists (deduped)
  const allCalendarIds = [...new Set([
    ...(calendarId ? [calendarId] : []),
    ...artistProfiles.map((p) => p.calendar_id).filter((id): id is string => !!id),
  ])];

  const { events, isLoading, failedCalendarIds } = useAllCalendarEvents(timeMin, timeMax, allCalendarIds);
  const deleteEvent = useDeleteCalendarEvent(calendarId);
  const colorMap = buildColorMap(allCalendarIds);

  // Label map: calendarId → artist display name
  const labelMap: Record<string, string> = {};
  if (calendarId) labelMap[calendarId] = profile?.display_name ?? "Estudio";
  for (const p of artistProfiles) {
    if (p.calendar_id) labelMap[p.calendar_id] = p.display_name;
  }

  if (!calendarId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <CalendarDays className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          No tienes un calendario de Google configurado.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Pide al propietario que asigne tu Calendar ID en Admin → Artistas.
        </p>
      </div>
    );
  }

  const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsForDay = (day: Date) =>
    (events as CalendarEventWithSource[]).filter((ev) => {
      const d = ev.start.dateTime ? parseISO(ev.start.dateTime) : ev.start.date ? parseISO(ev.start.date) : null;
      return d ? isSameDay(d, day) : false;
    });

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const handleDelete = (ev: CalendarEvent) => setDeleteTarget(ev);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast.success("Evento eliminado");
    } catch {
      toast.error("Error al eliminar el evento");
    } finally {
      setDeleteTarget(null);
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

      {/* Legend */}
      {allCalendarIds.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {allCalendarIds.map((id) => (
            <div key={id} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full border ${colorMap[id]}`} />
              <span className="text-xs text-muted-foreground">{labelMap[id] ?? id}</span>
            </div>
          ))}
        </div>
      )}

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
            {failedCalendarIds.length > 0 && (
              <div className="px-4 py-2 text-xs text-amber-400 bg-amber-400/10 border-b border-amber-400/20">
                Sin acceso a: {failedCalendarIds.map((id) => labelMap[id] ?? id).join(", ")}. Comparte el calendario con la cuenta de servicio de Google.
              </div>
            )}
            <div className="grid grid-cols-7 border-b border-border">
              {weekdays.map((d) => (
                <div key={d} className="py-2 text-center font-['IBM_Plex_Mono'] text-xs text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground text-sm">Cargando eventos...</div>
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
                          <EventPill key={ev.id} ev={ev} colorClass={colorMap[ev._calendarId] ?? CALENDAR_PALETTE[0]} />
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

        {/* Desktop side panel */}
        <div className="hidden lg:block space-y-3">
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
                  <EventCard key={ev.id} ev={ev} colorClass={colorMap[(ev as CalendarEventWithSource)._calendarId] ?? CALENDAR_PALETTE[0]} onDelete={handleDelete} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile centered overlay */}
      {selectedDay && (
        <div className="lg:hidden fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/50">
          <Card className="bg-card border-border shadow-xl w-full max-w-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground truncate pr-2">
                  {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setNewEventOpen(true)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Añadir evento este día"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin eventos
                </p>
              ) : (
                selectedEvents.map((ev) => (
                  <EventCard key={ev.id} ev={ev} colorClass={colorMap[(ev as CalendarEventWithSource)._calendarId] ?? CALENDAR_PALETTE[0]} onDelete={handleDelete} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <NewEventDialog
        open={newEventOpen}
        defaultDate={selectedDay}
        calendarId={calendarId}
        allCalendarIds={allCalendarIds}
        colorMap={colorMap}
        labelMap={labelMap}
        onClose={() => setNewEventOpen(false)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.summary}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
