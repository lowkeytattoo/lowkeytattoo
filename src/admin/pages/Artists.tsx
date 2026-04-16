import { useState, useRef } from "react";
import { toast } from "sonner";
import { useArtistProfiles, useUpdateProfile } from "@admin/hooks/useArtistProfiles";
import { supabase } from "@shared/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { UserCircle, Pencil, Camera } from "lucide-react";
import { ARTISTS } from "@shared/config/artists";
import type { Profile, ServiceType } from "@shared/types/index";

const ALL_SERVICES: { value: ServiceType; label: string }[] = [
  { value: "tattoo", label: "Tatuaje" },
  { value: "piercing", label: "Piercing" },
  { value: "laser", label: "Láser" },
];

async function resizeAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 256;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round((h * MAX) / w); w = MAX; }
        else        { w = Math.round((w * MAX) / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("WebP conversion failed")),
        "image/webp",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Artists() {
  const { data: profiles, isLoading } = useArtistProfiles();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"owner" | "artist">("artist");
  const [editConfigId, setEditConfigId] = useState("");
  const [editServices, setEditServices] = useState<ServiceType[]>(["tattoo"]);
  const [editCalendarId, setEditCalendarId] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (p: Profile) => {
    setEditing(p);
    setEditName(p.display_name);
    setEditRole(p.role);
    setEditConfigId(p.artist_config_id ?? "");
    const staticServices = ARTISTS.find((a) => a.id === p.artist_config_id)?.services ?? ["tattoo"];
    setEditServices(p.available_services ?? staticServices);
    setEditCalendarId(p.calendar_id ?? "");
  };

  const toggleService = (service: ServiceType) => {
    setEditServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    e.target.value = "";
    setUploadingAvatar(true);
    try {
      const blob = await resizeAvatar(file);
      const path = `${editing.id}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile.mutateAsync({ id: editing.id, avatar_url: publicUrl });
      setEditing((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
      toast.success("Avatar actualizado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir la foto";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateProfile.mutateAsync({
        id: editing.id,
        display_name: editName,
        role: editRole,
        artist_config_id: editConfigId || null,
        available_services: editConfigId ? editServices : null,
        calendar_id: editCalendarId.trim() || null,
      });
      toast.success("Cambios guardados");
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(`Error al guardar: ${msg}`);
    }
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

      {/* Hidden file input for avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar artista</DialogTitle>
            <DialogDescription>
              Actualiza el nombre, rol, perfil web y servicios disponibles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="group relative w-20 h-20 rounded-full overflow-hidden border-2 border-border hover:border-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {editing?.avatar_url ? (
                  <img
                    src={editing.avatar_url}
                    alt={editing.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-full h-full text-muted-foreground p-1" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Pulsa para cambiar el avatar</p>
            </div>

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

            {editConfigId && (
              <div className="space-y-2">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                  Servicios disponibles (web)
                </Label>
                <div className="flex flex-col gap-2">
                  {ALL_SERVICES.map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 hover:border-muted-foreground transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editServices.includes(value)}
                        onChange={() => toggleService(value)}
                        className="h-4 w-4 accent-foreground"
                      />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Servicios que aparecerán en el modal de reserva para este artista.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                Google Calendar ID
              </Label>
              <Input
                value={editCalendarId}
                onChange={(e) => setEditCalendarId(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="bg-background border-border font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ID del calendario de Google para sincronizar disponibilidad.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="cta-button" onClick={saveEdit} disabled={updateProfile.isPending || uploadingAvatar}>
              {updateProfile.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
