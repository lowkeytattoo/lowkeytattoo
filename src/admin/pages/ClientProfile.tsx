import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClient, useUpdateClient, useSetCoverPhoto, useClientPhotos, useDeleteClientPhoto } from "@admin/hooks/useClients";
import { useSessions, useCreateSession, useUpdateSession } from "@admin/hooks/useSessions";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import { PhoneInput, formatPhone } from "@admin/components/PhoneInput";
import { supabase } from "@shared/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Camera, Plus, Star, Upload, Trash2, Pencil, Phone, AlertCircle, Cake, Clock, Link2, UserCircle } from "lucide-react";
import type { SessionType } from "@shared/types/index";
import { format } from "date-fns";
import { formatLocalDate } from "@shared/lib/formatDate";
import { es } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

const MAX_PX = 1920;
const WEBP_QUALITY = 0.85;

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_PX || h > MAX_PX) {
        if (w >= h) { h = Math.round((h * MAX_PX) / w); w = MAX_PX; }
        else        { w = Math.round((w * MAX_PX) / h); h = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("WebP conversion failed"))),
        "image/webp",
        WEBP_QUALITY
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

const SESSION_TYPES = ["tattoo", "piercing", "laser", "retoque"] as const;
const SESSION_TYPE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
  retoque: "Retoque",
};

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAdminAuth();
  const qc = useQueryClient();

  const { data: client, isLoading } = useClient(id!);
  const { data: sessions } = useSessions({ clientId: id });
  const updateClient = useUpdateClient();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const setCoverPhoto = useSetCoverPhoto();
  const deletePhoto = useDeleteClientPhoto();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editBirthday, setEditBirthday] = useState("");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sessionType, setSessionType] = useState<SessionType>("tattoo");
  const [sessionPrice, setSessionPrice] = useState("");
  const [sessionDeposit, setSessionDeposit] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionZone, setSessionZone] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");

  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<{ id: string; storage_path: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo-session linking
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [linkSessionId, setLinkSessionId] = useState<string>("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: photos } = useClientPhotos(id!);

  // Session quick-edit state
  const [editingSession, setEditingSession] = useState<{
    id: string; paid: boolean; price: number | null; notes: string | null; duration_minutes: number | null;
  } | null>(null);
  const [editPaid, setEditPaid] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editSessionNotes, setEditSessionNotes] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const openEditSession = (s: any) => {
    setEditingSession({ id: s.id, paid: s.paid, price: s.price, notes: s.notes, duration_minutes: s.duration_minutes });
    setEditPaid(s.paid);
    setEditPrice(s.price != null ? String(s.price) : "");
    setEditSessionNotes(s.notes ?? "");
    setEditDuration(s.duration_minutes != null ? String(s.duration_minutes) : "");
  };

  const handleEditSession = async () => {
    if (!editingSession) return;
    await updateSession.mutateAsync({
      id: editingSession.id,
      paid: editPaid,
      price: editPrice ? parseFloat(editPrice) : null,
      notes: editSessionNotes || null,
      duration_minutes: editDuration ? parseInt(editDuration) : null,
    });
    setEditingSession(null);
  };

  const startEdit = () => {
    if (!client) return;
    setEditName(client.name);
    setEditPhone(client.phone ?? "");
    setEditEmail(client.email ?? "");
    setEditNotes(client.notes ?? "");
    setEditAllergies(client.allergies ?? "");
    setEditBirthday(client.birthday ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateClient.mutateAsync({
      id: id!,
      name: editName,
      phone: editPhone || null,
      email: editEmail || null,
      notes: editNotes || null,
      allergies: editAllergies || null,
      birthday: editBirthday || null,
    });
    setEditing(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession.mutateAsync({
      client_id: id!,
      artist_id: profile?.id ?? null,
      date: sessionDate,
      type: sessionType,
      price: sessionPrice ? parseFloat(sessionPrice) : null,
      deposit: sessionDeposit ? parseFloat(sessionDeposit) : 0,
      paid: false,
      duration_minutes: sessionDuration ? parseInt(sessionDuration) : null,
      body_zone: sessionZone || null,
      style: null,
      notes: sessionNotes || null,
    });
    setShowSessionModal(false);
    setSessionPrice("");
    setSessionDeposit("");
    setSessionNotes("");
    setSessionZone("");
    setSessionDuration("");
  };

  // Step 1 — file selected: store it, open link dialog
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setLinkSessionId("");
    setShowLinkDialog(true);
    e.target.value = ""; // reset so same file can be re-selected
  };

  // Step 2 — user confirms: upload with optional session_id
  const handleConfirmUpload = async () => {
    if (!pendingFile || !id) return;
    setShowLinkDialog(false);
    setUploading(true);
    try {
      const webpBlob = await convertToWebP(pendingFile);
      const photoId = crypto.randomUUID();
      const path = `clients/${id}/${photoId}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("client-photos")
        .upload(path, webpBlob, { contentType: "image/webp" });
      if (uploadError) throw uploadError;

      await supabase.from("client_photos").insert({
        client_id: id,
        session_id: linkSessionId || null,
        storage_path: path,
        is_cover: (photos ?? []).length === 0,
      });
      qc.invalidateQueries({ queryKey: ["client-photos", id] });
      qc.invalidateQueries({ queryKey: ["client-cover-photos"] });
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // ── Derived stats ────────────────────────────────────────
  const sessionList = sessions ?? [];
  const totalSpent   = sessionList.reduce((s, x) => s + (x.paid ? (x.price ?? 0) : 0), 0);
  const pendingDebt  = sessionList.reduce((s, x) => s + (!x.paid && x.price ? x.price : 0), 0);
  const sortedDates  = sessionList.map((x) => x.date).sort();
  const firstVisit   = sortedDates[0];
  const lastVisit    = sortedDates[sortedDates.length - 1];

  // Photos grouped by session_id for timeline display
  const photosBySession = (photos ?? []).reduce<Record<string, { id: string; signedUrl: string; storage_path: string }[]>>(
    (acc, p) => {
      if (p.session_id) {
        (acc[p.session_id] ??= []).push(p);
      }
      return acc;
    },
    {}
  );

  const whatsappHref = client?.phone
    ? (() => {
        const raw = client.phone.trim();
        const digits = raw.startsWith("+") || raw.startsWith("00")
          ? raw.replace(/\D/g, "")
          : "34" + raw.replace(/\D/g, "");
        return `https://wa.me/+${digits}`;
      })()
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Cliente no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/clients")}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold bg-background border-border"
              />
              <PhoneInput value={editPhone} onChange={setEditPhone} />
              <Input placeholder="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-background border-border" />
              <Textarea placeholder="Notas" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="bg-background border-border" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Alergias" value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} className="bg-background border-border" />
                <DatePickerInput value={editBirthday} onChange={setEditBirthday} placeholder="Fecha de nacimiento" fromYear={1930} toYear={new Date().getFullYear()} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="cta-button" disabled={updateClient.isPending}>Guardar</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {(() => {
                const cover = (photos ?? []).find((p) => p.is_cover) ?? (photos ?? [])[0];
                return cover ? (
                  <img
                    src={cover.signedUrl}
                    alt={client.name}
                    className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-border mt-0.5"
                  />
                ) : (
                  <UserCircle className="w-14 h-14 text-muted-foreground shrink-0 mt-0.5" />
                );
              })()}
              <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {client.phone && (
                  <span className="flex items-center gap-1.5 font-['IBM_Plex_Mono']">
                    {formatPhone(client.phone)}
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir en WhatsApp"
                        className="inline-flex items-center gap-1 text-green-500 hover:text-green-400 transition-colors text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        WA
                      </a>
                    )}
                  </span>
                )}
                {client.email && <span>{client.email}</span>}
                {client.birthday && (
                  <span className="flex items-center gap-1.5">
                    <Cake className="w-3.5 h-3.5" />
                    {formatLocalDate(client.birthday, "d MMM yyyy", { locale: es })}
                  </span>
                )}
                {client.allergies && (
                  <Badge variant="destructive" className="text-xs">
                    Alergias: {client.allergies}
                  </Badge>
                )}
              </div>
              {client.notes && <p className="text-sm text-muted-foreground mt-2">{client.notes}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending debt alert */}
      {pendingDebt > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-sm font-medium text-destructive">
            Deuda pendiente:{" "}
            <span className="font-['IBM_Plex_Mono'] font-bold">€{pendingDebt.toFixed(0)}</span>
          </span>
        </div>
      )}

      {/* Stats */}
      {sessionList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-wider">Total gastado</div>
              <div className="text-xl font-bold mt-1 font-['IBM_Plex_Mono']">€{totalSpent.toFixed(0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-wider">Sesiones</div>
              <div className="text-xl font-bold mt-1 font-['IBM_Plex_Mono']">{sessionList.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-wider">Primera visita</div>
              <div className="text-sm font-medium mt-1">
                {firstVisit ? formatLocalDate(firstVisit, "d MMM yyyy", { locale: es }) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-wider">Última visita</div>
              <div className="text-sm font-medium mt-1">
                {lastVisit ? formatLocalDate(lastVisit, "d MMM yyyy", { locale: es }) : "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
            Historial de sesiones
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSessionModal(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar sesión
          </Button>
        </CardHeader>
        <CardContent>
          {(sessions ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Sin sesiones registradas</p>
          ) : (
            <div className="space-y-3">
              {(sessions ?? []).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-background border border-border group space-y-2"
                >
                  {/* Row 1: date · type · zone */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground shrink-0">
                      {formatLocalDate(s.date, "d MMM yyyy", { locale: es })}
                    </div>
                    <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono'] shrink-0">
                      {SESSION_TYPE_LABELS[s.type]}
                    </Badge>
                    {s.body_zone && (
                      <span className="text-sm text-muted-foreground truncate min-w-0">{s.body_zone}</span>
                    )}
                  </div>
                  {/* Row 2: duration · price · paid badge · edit */}
                  <div className="flex items-center gap-2">
                    {s.duration_minutes != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-['IBM_Plex_Mono'] shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDuration(s.duration_minutes)}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {s.price != null && (
                        <span className="font-['IBM_Plex_Mono'] text-sm shrink-0">€{s.price.toFixed(0)}</span>
                      )}
                      <Badge variant={s.paid ? "default" : "destructive"} className="text-xs shrink-0">
                        {s.paid ? "Pagado" : "Pendiente"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => openEditSession(s)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Linked photos */}
                  {(photosBySession[s.id]?.length ?? 0) > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {photosBySession[s.id].map((p) => (
                        <img
                          key={p.id}
                          src={p.signedUrl}
                          alt=""
                          className="w-12 h-12 rounded object-cover cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                          onClick={() => setLightboxPhoto(p.signedUrl)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
            Fotos
          </CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Subir foto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(photos ?? []).length === 0 ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Sin fotos aún. Sube la primera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {(photos ?? []).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-md overflow-hidden bg-muted group"
                >
                  <img
                    src={photo.signedUrl}
                    alt=""
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxPhoto(photo.signedUrl)}
                  />
                  {photo.is_cover && (
                    <div className="absolute top-1 left-1 bg-primary rounded-full p-0.5 pointer-events-none">
                      <Star className="w-3 h-3 text-primary-foreground fill-current" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!photo.is_cover && (
                      <button
                        onClick={() => setCoverPhoto.mutate({ photoId: photo.id, clientId: id! })}
                        title="Usar como foto de perfil"
                        className="flex flex-col items-center gap-0.5"
                      >
                        <Star className="w-4 h-4 text-white" />
                        <span className="text-white text-[9px] font-['IBM_Plex_Mono']">Perfil</span>
                      </button>
                    )}
                    <button
                      onClick={() => setDeletePhotoTarget({ id: photo.id, storage_path: photo.storage_path })}
                      title="Eliminar foto"
                      className="flex flex-col items-center gap-0.5"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-[9px] font-['IBM_Plex_Mono']">Borrar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <img
            src={lightboxPhoto}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Session quick-edit modal */}
      <Dialog open={!!editingSession} onOpenChange={(open) => { if (!open) setEditingSession(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Precio (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Duración (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="15"
                  placeholder="ej. 90"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Estado</Label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="edit-paid"
                  checked={editPaid}
                  onCheckedChange={(v) => setEditPaid(!!v)}
                />
                <Label htmlFor="edit-paid" className="text-sm cursor-pointer">Sesión pagada</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea
                value={editSessionNotes}
                onChange={(e) => setEditSessionNotes(e.target.value)}
                className="bg-background border-border"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditingSession(null)}>Cancelar</Button>
            <Button className="cta-button" onClick={handleEditSession} disabled={updateSession.isPending}>
              {updateSession.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo-session link dialog */}
      <Dialog open={showLinkDialog} onOpenChange={(open) => { if (!open) { setShowLinkDialog(false); setPendingFile(null); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Vincular foto a sesión
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              Puedes vincular esta foto a una sesión concreta o subirla sin asociar.
            </p>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Sesión (opcional)</Label>
              <Select value={linkSessionId || "none"} onValueChange={(v) => setLinkSessionId(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {(sessions ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatLocalDate(s.date, "d MMM yyyy", { locale: es })} — {SESSION_TYPE_LABELS[s.type]}
                      {s.body_zone ? ` · ${s.body_zone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setShowLinkDialog(false); setPendingFile(null); }}>Cancelar</Button>
            <Button className="cta-button" onClick={handleConfirmUpload} disabled={uploading}>
              {uploading ? "Subiendo..." : "Subir foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session modal */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Registrar sesión</DialogTitle>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowSessionModal(false)}>Cancelar</Button>
                <Button type="submit" form="session-form" size="sm" className="cta-button" disabled={createSession.isPending}>
                  {createSession.isPending ? "Guardando..." : "Registrar"}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <form id="session-form" onSubmit={handleCreateSession} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Fecha *</Label>
                <DatePickerInput value={sessionDate} onChange={setSessionDate} required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Tipo</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
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
                <Input type="number" min="0" step="0.01" value={sessionPrice} onChange={(e) => setSessionPrice(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Señal (€)</Label>
                <Input type="number" min="0" step="0.01" value={sessionDeposit} onChange={(e) => setSessionDeposit(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Zona del cuerpo</Label>
                <Input value={sessionZone} onChange={(e) => setSessionZone(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Duración (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="15"
                  placeholder="ej. 90"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} className="bg-background border-border" rows={2} />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePhotoTarget} onOpenChange={(open) => !open && setDeletePhotoTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletePhotoTarget) {
                  deletePhoto.mutate({ photoId: deletePhotoTarget.id, storagePath: deletePhotoTarget.storage_path, clientId: id! });
                }
                setDeletePhotoTarget(null);
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
