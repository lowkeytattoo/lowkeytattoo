import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@admin/components/AdminSidebar";

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
