import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients, useCreateClient, useClientCoverPhotos } from "@admin/hooks/useClients";
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

  const { data: clients, isLoading } = useClients();
  const { data: artists } = useArtistProfiles();
  const { data: coverPhotos } = useClientCoverPhotos();
  const createClient = useCreateClient();

  const [search, setSearch] = useState("");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  // New client form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newArtist, setNewArtist] = useState("");

  const filtered = (clients ?? []).filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search);
    const matchArtist =
      filterArtist === "all" || c.primary_artist_id === filterArtist;
    return matchSearch && matchArtist;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} clientes</p>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 4 : 3} className="text-center py-12 text-muted-foreground">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => (
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
                      {(client as any).primary_artist?.display_name ? (
                        <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono']">
                          {(client as any).primary_artist.display_name}
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
