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
} from "lucide-react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { StockAlertBadge } from "@admin/components/StockAlertBadge";
import { MessagesUnreadBadge } from "@admin/components/MessagesUnreadBadge";
import { BookingsPendingBadge } from "@admin/components/BookingsPendingBadge";
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

// Items shown in the mobile bottom bar — dashboard is center (index 2)
const MOBILE_ITEMS = ["/admin/bookings", "/admin/calendar", "/admin/dashboard", "/admin/finances", "/admin/sessions"];

export const AdminSidebar = () => {
  const { profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const allItems = profile?.role === "owner" ? [...navItems, ...ownerNavItems] : navItems;

  // Sort mobileItems according to MOBILE_ITEMS order
  const mobileItems = MOBILE_ITEMS
    .map((path) => allItems.find((i) => i.to === path))
    .filter((i): i is NonNullable<typeof i> => i != null);

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
      {/* Backdrop — closes the "Más" secondary row when tapped */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        {/* Secondary row — slides up above the nav bar */}
        {moreItems.length > 0 && (
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
            </ul>
          </div>
        )}

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

          {/* "Más" button — toggles secondary row */}
          {moreItems.length > 0 && (
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
          )}
        </ul>
      </nav>
    </>
  );
};
