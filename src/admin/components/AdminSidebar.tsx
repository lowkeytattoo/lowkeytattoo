import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  TrendingUp,
  Package,
  UserCog,
  BookOpen,
  FileText,
  MessageSquare,
  LogOut,
  MoreVertical,
  Home,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useUpdateProfile } from "@admin/hooks/useArtistProfiles";
import { StockAlertBadge } from "@admin/components/StockAlertBadge";
import { MessagesUnreadBadge } from "@admin/components/MessagesUnreadBadge";
import { BookingsPendingBadge } from "@admin/components/BookingsPendingBadge";
import { cn } from "@shared/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ARTISTS } from "@shared/config/artists";
import type { ServiceType } from "@shared/types/index";

const ALL_SERVICES: { value: ServiceType; label: string }[] = [
  { value: "tattoo",    label: "Tatuaje"  },
  { value: "piercing",  label: "Piercing" },
  { value: "laser",     label: "Láser"    },
];

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  requiresCalendar?: boolean;
  badge?: boolean;
  messagesBadge?: boolean;
  bookingsBadge?: boolean;
}

const allNavItems: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { to: "/admin/clients",   label: "Clientes",   icon: Users },
  { to: "/admin/sessions",  label: "Sesiones",   icon: Calendar },
  { to: "/admin/calendar",  label: "Calendario", icon: CalendarDays, requiresCalendar: true },
  { to: "/admin/bookings",  label: "Citas Web",  icon: BookOpen, bookingsBadge: true },
  { to: "/admin/messages",  label: "Mensajes",   icon: MessageSquare, messagesBadge: true },
  { to: "/admin/finances",  label: "Finanzas",   icon: TrendingUp },
  { to: "/admin/stock",     label: "Stock",      icon: Package, badge: true },
  { to: "/admin/blog",      label: "Blog",       icon: FileText, ownerOnly: true },
  { to: "/admin/artists",   label: "Artistas",   icon: UserCog, ownerOnly: true },
];

// Items shown in the mobile bottom bar — dashboard is center (index 2)
const MOBILE_ITEMS = ["/admin/bookings", "/admin/calendar", "/admin/dashboard", "/admin/finances", "/admin/sessions"];

export const AdminSidebar = () => {
  const { profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const [moreOpen, setMoreOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editServices, setEditServices] = useState<ServiceType[]>(["tattoo"]);
  const [editCalendarId, setEditCalendarId] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.display_name);
    const staticServices = ARTISTS.find((a) => a.id === profile.artist_config_id)?.services ?? ["tattoo"];
    setEditServices(profile.available_services ?? staticServices);
    setEditCalendarId(profile.calendar_id ?? "");
    setEditOpen(true);
  };

  const toggleService = (service: ServiceType) => {
    setEditServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const saveEdit = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        display_name: editName,
        available_services: profile.artist_config_id ? editServices : null,
        calendar_id: editCalendarId.trim() || null,
      });
      toast.success("Cambios guardados");
      setEditOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(`Error al guardar: ${msg}`);
    }
  };

  const allItems = allNavItems.filter((i) => {
    if (i.ownerOnly) return profile?.role === "owner";
    if (i.requiresCalendar) return !!profile?.calendar_id;
    return true;
  });

  // Build mobile bar: preserve MOBILE_ITEMS order; backfill any missing slot
  // with the next available item not already in the bar — always 5 icons
  const mobileItems = (() => {
    const usedPaths = new Set(MOBILE_ITEMS);
    const backfill = allItems.filter((i) => !usedPaths.has(i.to));
    let bi = 0;
    return MOBILE_ITEMS
      .map((path) => allItems.find((i) => i.to === path) ?? backfill[bi++] ?? null)
      .filter((i): i is NonNullable<typeof i> => i != null);
  })();

  const moreItems = allItems.filter((i) => !MOBILE_ITEMS.includes(i.to));

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 bg-card border-r border-border flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <div className="font-['Pirata_One'] text-2xl text-primary tracking-wider">LOWKEY</div>
          <div className="font-['IBM_Plex_Mono'] text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-3">
            {allItems.map(({ to, label, icon: Icon, badge, messagesBadge, bookingsBadge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && <StockAlertBadge />}
                  {messagesBadge && <MessagesUnreadBadge />}
                  {bookingsBadge && <BookingsPendingBadge />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border">
          <Card
            className="bg-background border-border cursor-pointer hover:border-muted-foreground transition-colors"
            onClick={openEdit}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-9 h-9 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate leading-tight">
                  {profile?.display_name}
                </div>
                <Badge
                  variant={profile?.role === "owner" ? "default" : "outline"}
                  className="text-[10px] font-['IBM_Plex_Mono'] uppercase mt-0.5 px-1.5 py-0"
                >
                  {profile?.role}
                </Badge>
              </div>
              <button
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      {/* Backdrop — closes the "Más" secondary row when tapped */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        {/* Secondary row — slides up above the nav bar */}
        <div
          className={cn(
            "absolute bottom-full left-0 right-0 bg-card border-t border-border transition-all duration-200",
            moreOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          <ul className="flex">
            {moreItems.map(({ to, label, icon: Icon, badge, messagesBadge, bookingsBadge }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 py-2 w-full transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {badge && (
                      <span className="absolute -top-1 -right-1">
                        <StockAlertBadge />
                      </span>
                    )}
                    {messagesBadge && (
                      <span className="absolute -top-1 -right-1">
                        <MessagesUnreadBadge />
                      </span>
                    )}
                    {bookingsBadge && (
                      <span className="absolute -top-1 -right-1">
                        <BookingsPendingBadge />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider leading-none">
                    {label}
                  </span>
                </NavLink>
              </li>
            ))}

            {/* Perfil — opens self-edit dialog */}
            <li className="flex-1">
              <button
                onClick={() => { openEdit(); setMoreOpen(false); }}
                className="flex flex-col items-center justify-center gap-1 py-2 w-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <UserCircle className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase tracking-wider leading-none">Perfil</span>
              </button>
            </li>

            {/* Salir */}
            <li className="flex-1">
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-1 py-2 w-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase tracking-wider leading-none">Salir</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Main bar */}
        <ul className="flex">
          {mobileItems.map(({ to, label, icon, badge, messagesBadge, bookingsBadge }) => {
            const isCenterItem = to === "/admin/dashboard";
            // Center dashboard item uses Home icon; others use their own icon
            const Icon = isCenterItem ? Home : icon;

            return (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 py-2 w-full transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        {isCenterItem ? (
                          <div
                            className={cn(
                              "flex items-center justify-center rounded-full w-9 h-9 transition-colors",
                              isActive ? "bg-primary/15" : "bg-muted/40"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        {badge && (
                          <span className="absolute -top-1 -right-1">
                            <StockAlertBadge />
                          </span>
                        )}
                        {messagesBadge && (
                          <span className="absolute -top-1 -right-1">
                            <MessagesUnreadBadge />
                          </span>
                        )}
                        {bookingsBadge && (
                          <span className="absolute -top-1 -right-1">
                            <BookingsPendingBadge />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider leading-none">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}

          {/* "Más" button — toggles secondary row, pinned to right edge */}
          <li className="w-8 shrink-0">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                "flex flex-col items-center justify-center py-2 w-full h-full transition-colors",
                moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Edit profile dialog ─────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Mi perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu nombre, servicios disponibles y calendario.
            </DialogDescription>
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

            {profile?.artist_config_id && (
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
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button className="cta-button" onClick={saveEdit} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
