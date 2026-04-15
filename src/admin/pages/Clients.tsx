import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useClientsPaged, useCreateClient, useUpdateClient, useDeleteClient, useClientCoverPhotos } from "@admin/hooks/useClients";
import { useArtistProfiles } from "@admin/hooks/useArtistProfiles";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, UserCircle, Pencil, Trash2 } from "lucide-react";
import { ArtistAvatar } from "@admin/components/ArtistAvatar";
import { PhoneInput, formatPhone } from "@admin/components/PhoneInput";
import type { Client } from "@shared/types/index";

export default function Clients() {
  const navigate = useNavigate();
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";

  const { data: artists } = useArtistProfiles();
  const { data: coverPhotos } = useClientCoverPhotos();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

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
  const [newNotes, setNewNotes] = useState("");
  const [newAllergies, setNewAllergies] = useState("");
  const [newBirthday, setNewBirthday] = useState("");
  const [newArtist, setNewArtist] = useState("");

  // Edit client state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editArtist, setEditArtist] = useState("");

  const openEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditName(client.name);
    setEditPhone(client.phone ?? "");
    setEditEmail(client.email ?? "");
    setEditNotes(client.notes ?? "");
    setEditAllergies(client.allergies ?? "");
    setEditBirthday(client.birthday ?? "");
    setEditArtist((client as any).primary_artist_id ?? "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      await updateClient.mutateAsync({
        id: editingClient.id,
        name: editName,
        phone: editPhone || null,
        email: editEmail || null,
        notes: editNotes || null,
        allergies: editAllergies || null,
        birthday: editBirthday || null,
        primary_artist_id: editArtist || null,
      });
      setEditingClient(null);
    } catch {
      toast.error("Error al guardar los cambios.");
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const handleDelete = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setDeleteTarget(client);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient.mutateAsync({
        name: newName,
        phone: newPhone || null,
        email: newEmail || null,
        notes: newNotes || null,
        allergies: newAllergies || null,
        birthday: newBirthday || null,
        primary_artist_id: newArtist || null,
      });
      setShowCreate(false);
      setNewName(""); setNewPhone(""); setNewEmail("");
      setNewNotes(""); setNewAllergies(""); setNewBirthday("");
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
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border w-full"
          />
        </div>
        {isOwner && (
          <Select value={filterArtist} onValueChange={setFilterArtist}>
            <SelectTrigger className="w-36 sm:w-40 bg-background border-border shrink-0">
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
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider hidden sm:table-cell">Teléfono</TableHead>
              <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider hidden sm:table-cell">Email</TableHead>
              {isOwner && (
                <TableHead className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                  <span className="hidden sm:inline">Artista</span>
                </TableHead>
              )}
              <TableHead className="w-20" />
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
                  className="border-border cursor-pointer hover:bg-muted/30 transition-colors group"
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
                  <TableCell className="font-['IBM_Plex_Mono'] text-sm text-muted-foreground hidden sm:table-cell">
                    {client.phone ? formatPhone(client.phone) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {client.email ?? "—"}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <span className="sm:hidden"><ArtistAvatar name={client.primary_artist?.display_name} /></span>
                      <span className="hidden sm:inline text-sm text-muted-foreground">{client.primary_artist?.display_name ?? "—"}</span>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => openEdit(e, client)}
                        title="Editar cliente"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, client)}
                        title="Eliminar cliente"
                        disabled={deleteClient.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
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
          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Teléfono</Label>
              <PhoneInput value={newPhone} onChange={setNewPhone} />
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Alergias</Label>
                <Input value={newAllergies} onChange={(e) => setNewAllergies(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nacimiento</Label>
                <DatePickerInput value={newBirthday} onChange={setNewBirthday} fromYear={1930} toYear={new Date().getFullYear()} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="bg-background border-border" rows={2} />
            </div>
            {isOwner && (
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</Label>
                <Select value={newArtist || "none"} onValueChange={(v) => setNewArtist(v === "none" ? "" : v)}>
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" className="cta-button" disabled={createClient.isPending}>
                {createClient.isPending ? "Guardando..." : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => { if (!open) setEditingClient(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Teléfono</Label>
              <PhoneInput value={editPhone} onChange={setEditPhone} />
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Alergias</Label>
                <Input value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nacimiento</Label>
                <DatePickerInput value={editBirthday} onChange={setEditBirthday} fromYear={1930} toYear={new Date().getFullYear()} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="bg-background border-border" rows={2} />
            </div>
            {isOwner && (
              <div className="space-y-1">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Artista</Label>
                <Select value={editArtist || "none"} onValueChange={(v) => setEditArtist(v === "none" ? "" : v)}>
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditingClient(null)}>Cancelar</Button>
              <Button type="submit" className="cta-button" disabled={updateClient.isPending}>
                {updateClient.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteClient.mutateAsync(deleteTarget.id);
                  toast.success("Cliente eliminado");
                } catch {
                  toast.error("Error al eliminar el cliente.");
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
