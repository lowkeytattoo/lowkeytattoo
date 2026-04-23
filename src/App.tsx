import { lazy, Suspense, useState, useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider, LocaleSync } from "@web/i18n/I18nProvider";
import { CookieConsentProvider } from "@web/contexts/CookieConsentContext";
import { BookingProvider, useBooking } from "@web/contexts/BookingContext";
const BookingModal = lazy(() => import("@web/components/BookingModal").then(m => ({ default: m.BookingModal })));
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

// Catches "Failed to fetch dynamically imported module" after a new deploy
// and forces a hard reload so the browser picks up the new chunk hashes.
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (error.message.includes("dynamically imported module") || error.message.includes("Failed to fetch")) {
      window.location.reload();
    }
  }
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? null : this.props.children; }
}

// Mounts BookingModal only after the first open — chunk stays deferred until needed
const LazyBookingModal = () => {
  const { isOpen } = useBooking();
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => { if (isOpen) setHasOpened(true); }, [isOpen]);
  if (!hasOpened) return null;
  return <Suspense fallback={null}><BookingModal /></Suspense>;
};

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
    {/*
      BrowserRouter wraps I18nProvider so that LocaleSync (inside I18nProvider's
      children) can use useLocation() from React Router. Locale is now derived
      purely from the URL path — /en/* = English, everything else = Spanish.
    */}
    <ChunkErrorBoundary>
    <BrowserRouter>
      <I18nProvider>
        <CookieConsentProvider>
          <BookingProvider>
            <AdminAuthProvider>
              <TooltipProvider>
                <Toaster />
                <LazyBookingModal />
                <CookieBanner />
                <ScrollToTop />
                {/* Syncs locale context with URL on every navigation */}
                <LocaleSync />
                <Routes>
                  {/* ── Spanish routes ─────────────────────────────── */}
                  <Route path="/" element={<Index />} />
                  <Route path="/tatuajes-santa-cruz-tenerife" element={<Suspense fallback={null}><TatuajesPage /></Suspense>} />
                  <Route path="/piercing-tenerife" element={<Suspense fallback={null}><PiercingPage /></Suspense>} />
                  <Route path="/laser-eliminacion-tatuajes-tenerife" element={<Suspense fallback={null}><LaserPage /></Suspense>} />
                  <Route path="/blog" element={<Suspense fallback={null}><BlogPage /></Suspense>} />
                  <Route path="/blog/:slug" element={<Suspense fallback={null}><BlogPostPage /></Suspense>} />
                  <Route path="/politica-de-privacidad" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
                  <Route path="/aviso-legal" element={<Suspense fallback={null}><LegalPage /></Suspense>} />

                  {/* ── English routes — same components, URL-derived locale ── */}
                  <Route path="/en" element={<Index />} />
                  <Route path="/en/tattoos-tenerife" element={<Suspense fallback={null}><TatuajesPage /></Suspense>} />
                  <Route path="/en/piercing-tenerife" element={<Suspense fallback={null}><PiercingPage /></Suspense>} />
                  <Route path="/en/laser-tattoo-removal-tenerife" element={<Suspense fallback={null}><LaserPage /></Suspense>} />
                  <Route path="/en/blog" element={<Suspense fallback={null}><BlogPage /></Suspense>} />
                  <Route path="/en/blog/:slug" element={<Suspense fallback={null}><BlogPostPage /></Suspense>} />

                  {/* ── Admin login ─────────────────────────────────── */}
                  <Route
                    path="/admin/login"
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <AdminLogin />
                      </Suspense>
                    }
                  />

                  {/* ── Admin panel — all children lazy ─────────────── */}
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
                    <Route path="calendar" element={<AdminCalendar />} />
                    <Route path="bookings" element={<AdminWebBookings />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route
                      path="blog"
                      element={
                        <RoleGuard requiredRole="owner">
                          <AdminBlog />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="blog/preview/:id"
                      element={
                        <RoleGuard requiredRole="owner">
                          <BlogPreview />
                        </RoleGuard>
                      }
                    />
                  </Route>

                  <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
                </Routes>
              </TooltipProvider>
            </AdminAuthProvider>
          </BookingProvider>
        </CookieConsentProvider>
      </I18nProvider>
    </BrowserRouter>
    </ChunkErrorBoundary>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
