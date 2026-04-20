import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { X, CalendarPlus, Pencil, Trash2, Clock, FileText, Loader2, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { useDeleteCalendarEvent, useUpdateCalendarEvent } from "@admin/hooks/useGoogleCalendar";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { sendCalendarEmail, formatEventDate, formatEventTime, formatDuration } from "@admin/lib/calendarEmail";
import { SessionFromEventModal } from "@admin/components/SessionFromEventModal";
import type { CalendarEventWithSource } from "@admin/hooks/useGoogleCalendar";

interface Props {
  event: CalendarEventWithSource | null;
  onClose: () => void;
}

interface EditForm {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

export function EventActionPanel({ event, onClose }: Props) {
  const [editing, setEditing]             = useState(false);
  const [deleteOpen, setDeleteOpen]       = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editForm, setEditForm]           = useState<EditForm | null>(null);

  const { data: artistProfiles = [] } = useArtistProfiles();
  const deleteEvent = useDeleteCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  if (!event) return null;

  const startIso = event.start.dateTime ?? "";
  const endIso   = event.end.dateTime   ?? "";
  const startDate = startIso ? parseISO(startIso) : null;
  const endDate   = endIso   ? parseISO(endIso)   : null;

  const artistProfile = artistProfiles.find((p) => p.calendar_id === event._calendarId);
  const artistConfigId = artistProfile?.artist_config_id ?? "";

  // ── Abrir formulario de edición ────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      summary:     event.summary ?? "",
      date:        startDate ? format(startDate, "yyyy-MM-dd") : "",
      startTime:   startDate ? format(startDate, "HH:mm") : "",
      endTime:     endDate   ? format(endDate,   "HH:mm") : "",
      description: event.description ?? "",
    });
    setEditing(true);
  };

  // ── Guardar edición ────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm) return;

    const oldDate = startDate ? formatEventDate(startDate) : "";
    const oldTime = startIso && endIso ? formatEventTime(startIso, endIso) : "";

    const newStart = editForm.date && editForm.startTime
      ? `${editForm.date}T${editForm.startTime}:00`
      : undefined;
    const newEnd = editForm.date && editForm.endTime
      ? `${editForm.date}T${editForm.endTime}:00`
      : undefined;

    try {
      await updateEvent.mutateAsync({
        calendarId:  event._calendarId,
        eventId:     event.id,
        summary:     editForm.summary || undefined,
        description: editForm.description,
        start:       newStart,
        end:         newEnd,
        colorId:     event.colorId, // mantener el color existente
      });

      // Email de modificación — falla silencioso
      if (artistConfigId) {
        await sendCalendarEmail({
          action:     "Cita modificada",
          artistId:   artistConfigId,
          eventTitle: editForm.summary,
          eventDate:  newStart ? formatEventDate(parseISO(newStart)) : oldDate,
          eventTime:  newStart && newEnd ? formatEventTime(newStart, newEnd) : oldTime,
          duration:   newStart && newEnd ? formatDuration(newStart, newEnd) : undefined,
          notes:      editForm.description,
          oldDate,
          oldTime,
        });
      }

      toast.success("Evento actualizado");
      setEditing(false);
      onClose();
    } catch {
      toast.error("Error al actualizar el evento");
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      // Pasamos el calendarId del propio evento (fix del bug pre-existente)
      await deleteEvent.mutateAsync({ eventId: event.id, calendarId: event._calendarId });
      toast.success("Evento eliminado");
      setDeleteOpen(false);
      onClose();
    } catch {
      toast.error("Error al eliminar el evento");
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-base font-medium text-foreground leading-tight truncate">
              {event.summary}
            </h2>
            {artistProfile && (
              <p className="text-xs text-muted-foreground mt-0.5">{artistProfile.display_name}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info del evento */}
        <div className="p-5 space-y-3 text-sm border-b border-border">
          {startDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                {startDate && endDate && (
                  <> · {format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}</>
                )}
                {startIso && endIso && (
                  <span className="ml-1 text-xs">({formatDuration(startIso, endIso)})</span>
                )}
              </span>
            </div>
          )}
          {event.description && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <FileText className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line text-xs">{event.description}</p>
            </div>
          )}
        </div>

        {/* Formulario de edición inline */}
        <AnimatePresence>
          {editing && editForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="p-5 space-y-3">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Editar evento</p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Título</Label>
                  <Input
                    value={editForm.summary}
                    onChange={(e) => setEditForm((f) => f ? { ...f, summary: e.target.value } : f)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Fecha</Label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm((f) => f ? { ...f, date: e.target.value } : f)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Inicio</Label>
                    <Input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm((f) => f ? { ...f, startTime: e.target.value } : f)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider">Fin</Label>
                    <Input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm((f) => f ? { ...f, endTime: e.target.value } : f)}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider">Descripción</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => f ? { ...f, description: e.target.value } : f)}
                    rows={2}
                    className="bg-background border-border resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button
                    size="sm" className="cta-button flex-1 gap-2"
                    onClick={handleSaveEdit}
                    disabled={updateEvent.isPending}
                  >
                    {updateEvent.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Acciones */}
        <div className="p-5 space-y-2 mt-auto">
          <Button
            className="w-full cta-button gap-2 justify-between"
            onClick={() => setSessionModalOpen(true)}
          >
            <span className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />
              Registrar sesión
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!editing && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={openEdit}
            >
              <Pencil className="w-4 h-4" />
              Editar evento
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar evento
          </Button>
        </div>
      </motion.aside>

      {/* Diálogo de confirmación de borrado */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{event.summary}</strong> del calendario de Google. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de sesión */}
      <SessionFromEventModal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        event={event}
      />
    </>
  );
}
