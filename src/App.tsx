import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@web/i18n/I18nProvider";
import { CookieConsentProvider } from "@web/contexts/CookieConsentContext";
import { BookingProvider } from "@web/contexts/BookingContext";
import { BookingModal } from "@web/components/BookingModal";
import { CookieBanner } from "@web/components/CookieBanner";
import { AdminAuthProvider } from "@admin/contexts/AdminAuthContext";
import { ProtectedRoute } from "@admin/components/ProtectedRoute";
import { RoleGuard } from "@admin/components/RoleGuard";
import { AdminLayout } from "@admin/components/AdminLayout";
import Index from "@web/pages/Index";
import NotFound from "@web/pages/NotFound";
import AdminLogin from "@admin/pages/Login";
import AdminDashboard from "@admin/pages/Dashboard";
import AdminClients from "@admin/pages/Clients";
import AdminClientProfile from "@admin/pages/ClientProfile";
import AdminSessions from "@admin/pages/Sessions";
import AdminFinances from "@admin/pages/Finances";
import AdminStock from "@admin/pages/Stock";
import AdminArtists from "@admin/pages/Artists";
import AdminWebBookings from "@admin/pages/WebBookings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <CookieConsentProvider>
        <BookingProvider>
          <AdminAuthProvider>
            <TooltipProvider>
              <Toaster />
              <BookingModal />
              <CookieBanner />
              <BrowserRouter>
                <Routes>
                  {/* Public web */}
                  <Route path="/" element={<Index />} />

                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="clients" element={<AdminClients />} />
                    <Route path="clients/:id" element={<AdminClientProfile />} />
                    <Route path="sessions" element={<AdminSessions />} />
                    <Route path="finances" element={<AdminFinances />} />
                    <Route path="stock" element={<AdminStock />} />
                    <Route
                      path="artists"
                      element={
                        <RoleGuard requiredRole="owner">
                          <AdminArtists />
                        </RoleGuard>
                      }
                    />
                    <Route path="bookings" element={<AdminWebBookings />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AdminAuthProvider>
        </BookingProvider>
      </CookieConsentProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
