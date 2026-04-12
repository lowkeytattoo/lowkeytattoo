import { useState } from "react";
import { useSessions, useCreateSession, useUpdateSession, useDeleteSession } from "@admin/hooks/useSessions";
import { useClients } from "@admin/hooks/useClients";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Plus, Pencil, CalendarIcon, Trash2, Search } from "lucide-react";
import { ArtistAvatar } from "@admin/components/ArtistAvatar";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@shared/lib/utils";
import type { Session } from "@shared/types/index";

const SESSION_TYPES = ["tattoo", "piercing", "laser", "retoque"] as const;
const SESSION_TYPE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
  retoque: "Retoque",
};

type SessionRow = Session & { client?: { id: string; name: string } | null; artist?: { id: string; display_name: string } | null };

function useSessionForm() {
  const [clientId, setClientId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState("tattoo");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [duration, setDuration] = useState("");
  const [zone, setZone] = useState("");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);

  const reset = () => {
    setClientId(""); setArtistId(""); setDate(format(new Date(), "yyyy-MM-dd"));
    setType("tattoo"); setPrice(""); setDeposit(""); setDuration(""); setZone("");
    setStyle(""); setNotes(""); setPaid(false);
  };

  const fill = (s: SessionRow) => {
    setClientId(s.client_id);
    setArtistId(s.artist_id ?? "");
    setDate(s.date);
    setType(s.type);
    setPrice(s.price != null ? String(s.price) : "");
    setDeposit(s.deposit != null ? String(s.deposit) : "");
    setDuration(s.duration_minutes != null ? String(s.duration_minutes) : "");
    setZone(s.body_zone ?? "");
    setStyle(s.style ?? "");
    setNotes(s.notes ?? "");
    setPaid(s.paid);
  };

  return { clientId, setClientId, artistId, setArtistId, date, setDate, type, setType,
    price, setPrice, deposit, setDeposit, duration, setDuration, zone, setZone,
    style, setStyle, notes, setNotes, paid, setPaid, reset, fill };
}

export default function Sessions() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";

  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterArtist, setFilterArtist] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionRow | null>(null);

  const { data: sessions, isLoading } = useSessions({
    artistId: isOwner ? (filterArtist !== "all" ? filterArtist : undefined) : profile?.id,
    from: filterFrom || undefined,
    to: filterTo || undefined,
    type: filterType !== "all" ? filterType : undefined,
  });

  const { data: clients } = useClients();
  const { data: artists } = useArtistProfiles();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const form = useSessionForm();

  const filteredSessions = filterSearch
    ? (sessions ?? []).filter((s) =>
        ((s.client as any)?.name ?? "").toLowerCase().includes(filterSearch.toLowerCase())
      )
    : (sessions ?? []);

  const totalRevenue = filteredSessions.reduce((s, sess) => s + (sess.price ?? 0), 0);
  const paidRevenue = filteredSessions.filter((s) => s.paid).reduce((s, sess) => s + (sess.price ?? 0), 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  const openCreate = () => {
    form.reset();
    if (!isOwner) form.setArtistId(profile?.id ?? "");
    setEditingSession(null);
    setShowModal(true);
  };

  const openEdit = (s: SessionRow) => {
    form.fill(s);
    setEditingSession(s);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      client_id: form.clientId,
      artist_id: form.artistId || null,
      date: form.date,
      type: form.type as Session["type"],
      price: form.price ? parseFloat(form.price) : null,
      deposit: form.deposit ? parseFloat(form.deposit) : 0,
      paid: form.paid,
      duration_minutes: form.duration ? parseInt(form.duration) : null,
      body_zone: form.zone || null,
      style: form.style || null,
      notes: form.notes || null,
    };

    if (editingSession) {
      await updateSession.mutateAsync({ id: editingSession.id, ...payload });
    } else {
      await createSession.mutateAsync(payload);
    }
    closeModal();
  };

  const togglePaid = async (id: string, paid: boolean) => {
    await updateSession.mutateAsync({ id, paid: !paid });
  };

  const isPending = createSession.isPending || updateSession.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sesiones</h1>
          <p className="text-muted-foreground text-sm mt-1">{(sessions ?? []).length} registros</p>
        </div>
        <Button onClick={openCreate} className="cta-button gap-2">
          <Plus className="w-4 h-4" />
          Nueva sesión
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: `€${totalRevenue.toFixed(0)}` },
          { label: "Cobrado", value: `€${paidRevenue.toFixed(0)}` },
          { label: "Pendiente", value: `€${pendingRevenue.toFixed(0)}`, danger: pendingRevenue > 0 },
        ].map(({ label, value, danger }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1">
              {label}
            </div>
            <div className={`text-xl font-bold ${danger ? "text-destructive" : "text-foreground"}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="pl-9 w-44 bg-background border-border"
          />
        </div>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-36 bg-background border-border" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-36 bg-background border-border" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-background border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {SESSION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{SESSION_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isOwner && (
          <Select value={filterArtist} onValueChange={setFilterArtist}>
            <SelectTrigger className="w-40 bg-background border-border">
              <SelectValue placeholder="Artista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(artists ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(filterSearch || filterFrom || filterTo || filterType !== "all" || filterArtist !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterSearch(""); setFilterFrom(""); setFilterTo(""); setFilterType("all"); setFilterArtist("all"); }}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cliente</TableHead>
              {isOwner && (
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                  <span className="hidden sm:inline">Artista</span>
                </TableHead>
              )}
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Tipo</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider hidden sm:table-cell">Zona</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-right">€</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-right hidden sm:table-cell">Dur.</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Pago</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 9 : 8} className="text-center py-12 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 9 : 8} className="text-center py-12 text-muted-foreground">Sin sesiones</TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((s) => (
                <TableRow key={s.id} className="border-border group">
                  <TableCell className="text-xs font-['IBM_Plex_Mono'] whitespace-nowrap">
                    <span className="hidden sm:inline">{format(new Date(s.date + "T00:00:00"), "d MMM yyyy", { locale: es })}</span>
                    <span className="sm:hidden">{format(new Date(s.date + "T00:00:00"), "d MMM", { locale: es })}</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[100px] truncate">{(s.client as any)?.name ?? "—"}</TableCell>
                  {isOwner && (
                    <TableCell>
                      <span className="sm:hidden"><ArtistAvatar name={(s.artist as any)?.display_name} /></span>
                      <span className="hidden sm:inline text-sm">{(s.artist as any)?.display_name ?? "—"}</span>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-['IBM_Plex_Mono'] whitespace-nowrap">
                      {SESSION_TYPE_LABELS[s.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[80px] truncate">
                    {s.body_zone ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-['IBM_Plex_Mono'] text-sm whitespace-nowrap">
                    {s.price != null ? `€${s.price.toFixed(0)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-['IBM_Plex_Mono'] text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {s.duration_minutes != null ? `${s.duration_minutes}m` : "—"}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => togglePaid(s.id, s.paid)}>
                      <Badge
                        variant={s.paid ? "default" : "destructive"}
                        className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                      >
                        {s.paid ? "✓" : "Pdte."}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(s as SessionRow)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`¿Eliminar sesión de ${(s.client as any)?.name ?? "este cliente"}?`)) {
                              deleteSession.mutate(s.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Editar sesión" : "Nueva sesión"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Cliente — solo editable al crear */}
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cliente *</Label>
              {editingSession ? (
                <div className="px-3 py-2 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                  {(editingSession.client as any)?.name ?? form.clientId}
                </div>
              ) : (
                <Select value={form.clientId} onValueChange={form.setClientId} required>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !form.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date
                        ? format(parseISO(form.date), "d MMM yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date ? parseISO(form.date) : undefined}
                      onSelect={(day) => day && form.setDate(format(day, "yyyy-MM-dd"))}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Tipo</Label>
                <Select value={form.type} onValueChange={form.setType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{SESSION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Precio (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => form.setPrice(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Señal (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deposit}
                  onChange={(e) => form.setDeposit(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            {isOwner && (
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</Label>
                <Select value={form.artistId || "none"} onValueChange={(v) => form.setArtistId(v === "none" ? "" : v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {(artists ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Zona del cuerpo</Label>
                <Input
                  value={form.zone}
                  onChange={(e) => form.setZone(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Estilo</Label>
                <Input
                  value={form.style}
                  onChange={(e) => form.setStyle(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Duración (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="15"
                  value={form.duration}
                  onChange={(e) => form.setDuration(e.target.value)}
                  className="bg-background border-border"
                  placeholder="120"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                className="bg-background border-border"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="paid"
                checked={form.paid}
                onCheckedChange={(v) => form.setPaid(!!v)}
              />
              <Label htmlFor="paid" className="text-sm cursor-pointer">Sesión pagada</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button
                type="submit"
                className="cta-button"
                disabled={isPending || (!editingSession && !form.clientId)}
              >
                {isPending ? "Guardando..." : editingSession ? "Guardar cambios" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
