import { useState } from "react";
import { useArtistProfiles, useUpdateProfile } from "@admin/hooks/useArtistProfiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { UserCircle, Pencil } from "lucide-react";
import { ARTISTS } from "@shared/config/artists";
import type { Profile } from "@shared/types/index";

export default function Artists() {
  const { data: profiles, isLoading } = useArtistProfiles();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"owner" | "artist">("artist");
  const [editConfigId, setEditConfigId] = useState("");

  const startEdit = (p: Profile) => {
    setEditing(p);
    setEditName(p.display_name);
    setEditRole(p.role);
    setEditConfigId(p.artist_config_id ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateProfile.mutateAsync({
      id: editing.id,
      display_name: editName,
      role: editRole,
      artist_config_id: editConfigId || null,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Artistas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de cuentas y roles del equipo
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(profiles ?? []).map((p) => (
            <Card key={p.id} className="bg-card border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="shrink-0">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{p.display_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={p.role === "owner" ? "default" : "outline"}
                      className="text-xs font-['IBM_Plex_Mono'] uppercase"
                    >
                      {p.role}
                    </Badge>
                    {p.artist_config_id && (
                      <span className="text-xs text-muted-foreground font-['IBM_Plex_Mono']">
                        @{ARTISTS.find((a) => a.id === p.artist_config_id)?.handle ?? p.artist_config_id}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(p)}
                  className="shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar artista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Rol</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as "owner" | "artist")}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                Artista config (web)
              </Label>
              <Select value={editConfigId || "none"} onValueChange={(v) => setEditConfigId(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {ARTISTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.handle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="cta-button" onClick={saveEdit} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
