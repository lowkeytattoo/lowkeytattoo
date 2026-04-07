import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@admin/components/AdminSidebar";

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* pb-20 on mobile to clear the bottom nav bar */}
        <div className="p-6 max-w-7xl mx-auto pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
