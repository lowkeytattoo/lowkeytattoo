import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useClientsPaged, useCreateClient, useClientCoverPhotos } from "@admin/hooks/useClients";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, UserCircle } from "lucide-react";

export default function Clients() {
  const navigate = useNavigate();
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";

  const { data: artists } = useArtistProfiles();
  const { data: coverPhotos } = useClientCoverPhotos();
  const createClient = useCreateClient();

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  // Debounce: espera 300ms tras dejar de escribir antes de lanzar la query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // El artistId efectivo combina control de acceso (artistas) y filtro UI (owner)
  const effectiveArtistId = isOwner
    ? (filterArtist !== "all" ? filterArtist : undefined)
    : profile?.id;

  const { data, isLoading } = useClientsPaged({
    artistId: effectiveArtistId,
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });

  const clients = data?.clients ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // New client form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newArtist, setNewArtist] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient.mutateAsync({
        name: newName,
        phone: newPhone || null,
        email: newEmail || null,
        notes: null,
        allergies: null,
        birthday: null,
        primary_artist_id: newArtist || null,
      });
      setShowCreate(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewArtist("");
    } catch {
      toast.error("Error al crear el cliente. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} clientes</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="cta-button gap-2">
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
        {isOwner && (
          <Select value={filterArtist} onValueChange={setFilterArtist}>
            <SelectTrigger className="w-40 bg-background border-border">
              <SelectValue placeholder="Todos los artistas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(artists ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Teléfono</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Email</TableHead>
              {isOwner && (
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 4 : 3} className="text-center py-12 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 4 : 3} className="text-center py-12 text-muted-foreground">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/admin/clients/${client.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {coverPhotos?.[client.id] ? (
                        <img
                          src={coverPhotos[client.id]}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border"
                        />
                      ) : (
                        <UserCircle className="w-8 h-8 text-muted-foreground shrink-0" />
                      )}
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-['IBM_Plex_Mono'] text-sm text-muted-foreground">
                    {client.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      {client.primary_artist?.display_name ? (
                        <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono']">
                          {client.primary_artist.display_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-['IBM_Plex_Mono']">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Teléfono</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            {isOwner && (
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</Label>
                <Select value={newArtist || "none"} onValueChange={(v) => setNewArtist(v === "none" ? "" : v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {(artists ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="cta-button" disabled={createClient.isPending}>
                {createClient.isPending ? "Guardando..." : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
