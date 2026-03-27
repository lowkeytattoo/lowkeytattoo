import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Package,
  UserCog,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { StockAlertBadge } from "@admin/components/StockAlertBadge";
import { cn } from "@shared/lib/utils";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/clients", label: "Clientes", icon: Users },
  { to: "/admin/sessions", label: "Sesiones", icon: Calendar },
  { to: "/admin/finances", label: "Finanzas", icon: TrendingUp },
  { to: "/admin/stock", label: "Stock", icon: Package, badge: true },
  { to: "/admin/bookings", label: "Citas Web", icon: BookOpen },
];

const ownerNavItems = [
  { to: "/admin/artists", label: "Artistas", icon: UserCog },
];

export const AdminSidebar = () => {
  const { profile, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const allItems = profile?.role === "owner" ? [...navItems, ...ownerNavItems] : navItems;

  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-full">
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
          {allItems.map(({ to, label, icon: Icon, badge }) => (
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
  );
};
