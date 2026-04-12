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
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { StockAlertBadge } from "@admin/components/StockAlertBadge";
import { MessagesUnreadBadge } from "@admin/components/MessagesUnreadBadge";
import { BookingsPendingBadge } from "@admin/components/BookingsPendingBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@shared/lib/utils";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { to: "/admin/clients",   label: "Clientes",   icon: Users },
  { to: "/admin/sessions",  label: "Sesiones",   icon: Calendar },
  { to: "/admin/finances",  label: "Finanzas",   icon: TrendingUp },
  { to: "/admin/stock",     label: "Stock",      icon: Package, badge: true },
  { to: "/admin/bookings",  label: "Citas Web",  icon: BookOpen, bookingsBadge: true },
  { to: "/admin/messages",  label: "Mensajes",   icon: MessageSquare, messagesBadge: true },
  { to: "/admin/blog",      label: "Blog",       icon: FileText },
];

const ownerNavItems = [
  { to: "/admin/artists",  label: "Artistas",    icon: UserCog },
  { to: "/admin/calendar", label: "Calendario",  icon: CalendarDays },
];

// Items shown in the mobile bottom bar (most used)
const MOBILE_ITEMS = ["/admin/dashboard", "/admin/clients", "/admin/sessions", "/admin/finances", "/admin/bookings"];

export const AdminSidebar = () => {
  const { profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const allItems = profile?.role === "owner" ? [...navItems, ...ownerNavItems] : navItems;
  const mobileItems = allItems.filter((i) => MOBILE_ITEMS.includes(i.to));
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
          <div className="text-sm text-foreground font-medium truncate mb-0.5">
            {profile?.display_name}
          </div>
          <div className="font-['IBM_Plex_Mono'] text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {profile?.role}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <ul className="flex">
          {mobileItems.map(({ to, label, icon: Icon, badge, messagesBadge, bookingsBadge }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
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

          {/* "Más" button — only shown if there are extra items */}
          {moreItems.length > 0 && (
            <li className="flex-1">
              <button
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center justify-center gap-1 py-2 w-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase tracking-wider leading-none">
                  Más
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* ── "Más" Sheet (mobile extra items) ────────────── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="bg-card border-t border-border pb-safe rounded-t-xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Más secciones
              </SheetTitle>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>
          <ul className="space-y-1">
            {moreItems.map(({ to, label, icon: Icon, badge, messagesBadge, bookingsBadge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && <StockAlertBadge />}
                  {messagesBadge && <MessagesUnreadBadge />}
                  {bookingsBadge && <BookingsPendingBadge />}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Sign out inside sheet */}
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={() => { setMoreOpen(false); handleSignOut(); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full px-3 py-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión — {profile?.display_name}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
