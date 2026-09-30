import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@admin/components/AdminSidebar";
import { markInternalTraffic } from "@web/lib/analytics";

export const AdminLayout = () => {
  // Staff devices are excluded from GA4 on the public site too
  useEffect(() => { markInternalTraffic(); }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* pb-20 on mobile to clear the bottom nav bar */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
