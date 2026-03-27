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
import type { WebBooking, WebBookingStatus } from "@shared/types/index";

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["web-bookings"] }),
  });

  const createSession = useCreateSession();
  const createClient = useCreateClient();
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
      type: "tattoo",
      price: convertPrice ? parseFloat(convertPrice) : null,
      deposit: 0,
      paid: false,
      duration_minutes: null,
      body_zone: convertBooking.body_zone ?? null,
      style: null,
      notes: convertNotes || null,
    });

    await updateBooking.mutateAsync({ id: convertBooking.id, status: "confirmed" });
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
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha preferida</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 6 : 5} className="text-center py-12 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 6 : 5} className="text-center py-12 text-muted-foreground">Sin citas</TableCell>
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
                  <TableCell className="text-sm font-['IBM_Plex_Mono']">
                    {b.preferred_date
                      ? format(new Date(b.preferred_date + "T00:00:00"), "d MMM yyyy", { locale: es })
                      : "—"}
                    {b.preferred_time && ` ${b.preferred_time}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[b.status]} className="text-xs font-['IBM_Plex_Mono']">
                      {STATUS_LABELS[b.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {b.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => openConvert(b)}
                          >
                            Convertir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:text-destructive"
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
            <div className="bg-background border border-border rounded-lg p-3 text-sm space-y-1 mt-2">
              <div><strong>Cliente:</strong> {convertBooking.client_name}</div>
              {convertBooking.description && <div><strong>Descripción:</strong> {convertBooking.description}</div>}
              {convertBooking.body_zone && <div><strong>Zona:</strong> {convertBooking.body_zone}</div>}
            </div>
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
                <Input type="date" value={convertDate} onChange={(e) => setConvertDate(e.target.value)} required className="bg-background border-border" />
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
