import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
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

// Public web pages — Index eager (critical path), rest lazy
import Index from "@web/pages/Index";
const TatuajesPage  = lazy(() => import("@web/pages/TatuajesPage"));
const PiercingPage  = lazy(() => import("@web/pages/PiercingPage"));
const LaserPage     = lazy(() => import("@web/pages/LaserPage"));
const BlogPage      = lazy(() => import("@web/pages/BlogPage"));
const BlogPostPage  = lazy(() => import("@web/pages/BlogPostPage"));
const NotFound      = lazy(() => import("@web/pages/NotFound"));
const PrivacyPage   = lazy(() => import("@web/pages/PrivacyPage"));
const LegalPage     = lazy(() => import("@web/pages/LegalPage"));

// Admin pages — lazy loaded (behind auth, excluded from public bundle)
const AdminLogin        = lazy(() => import("@admin/pages/Login"));
const AdminDashboard    = lazy(() => import("@admin/pages/Dashboard"));
const AdminClients      = lazy(() => import("@admin/pages/Clients"));
const AdminClientProfile = lazy(() => import("@admin/pages/ClientProfile"));
const AdminSessions     = lazy(() => import("@admin/pages/Sessions"));
const AdminFinances     = lazy(() => import("@admin/pages/Finances"));
const AdminStock        = lazy(() => import("@admin/pages/Stock"));
const AdminArtists      = lazy(() => import("@admin/pages/Artists"));
const AdminCalendar     = lazy(() => import("@admin/pages/Calendar"));
const AdminWebBookings  = lazy(() => import("@admin/pages/WebBookings"));
const AdminMessages     = lazy(() => import("@admin/pages/Messages"));
const AdminBlog         = lazy(() => import("@admin/pages/BlogAdmin"));
const BlogPreview       = lazy(() => import("@admin/pages/BlogPreview"));

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const AdminFallback = () => (
  <div className="flex h-screen bg-background items-center justify-center">
    <span className="text-muted-foreground text-sm font-mono tracking-widest">Cargando...</span>
  </div>
);

const App = () => (
  <HelmetProvider>
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
                <ScrollToTop />
                <Routes>
                  {/* Public web */}
                  <Route path="/" element={<Index />} />
                  <Route path="/tatuajes-santa-cruz-tenerife" element={<Suspense fallback={null}><TatuajesPage /></Suspense>} />
                  <Route path="/piercing-tenerife" element={<Suspense fallback={null}><PiercingPage /></Suspense>} />
                  <Route path="/laser-eliminacion-tatuajes-tenerife" element={<Suspense fallback={null}><LaserPage /></Suspense>} />
                  <Route path="/blog" element={<Suspense fallback={null}><BlogPage /></Suspense>} />
                  <Route path="/blog/:slug" element={<Suspense fallback={null}><BlogPostPage /></Suspense>} />
                  <Route path="/politica-de-privacidad" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
                  <Route path="/aviso-legal" element={<Suspense fallback={null}><LegalPage /></Suspense>} />

                  {/* Admin login */}
                  <Route
                    path="/admin/login"
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <AdminLogin />
                      </Suspense>
                    }
                  />

                  {/* Admin panel — all children lazy, single Suspense boundary */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<AdminFallback />}>
                          <AdminLayout />
                        </Suspense>
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
                    <Route
                      path="calendar"
                      element={
                        <RoleGuard requiredRole="owner">
                          <AdminCalendar />
                        </RoleGuard>
                      }
                    />
                    <Route path="bookings" element={<AdminWebBookings />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="blog/preview/:id" element={<BlogPreview />} />
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
  </HelmetProvider>
);

export default App;
