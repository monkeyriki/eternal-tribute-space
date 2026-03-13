import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { isNetworkError, FRIENDLY_NETWORK_MESSAGE } from "@/lib/networkError";
import NetworkStatus from "./components/NetworkStatus";
import GlobalNetworkErrorHandler from "./components/GlobalNetworkErrorHandler";
import Index from "./pages/Index";
import Directory from "./pages/Directory";
import MemorialDetail from "./pages/MemorialDetail";
import Auth from "./pages/Auth";
import CreateMemorial from "./pages/CreateMemorial";
import EditMemorial from "./pages/EditMemorial";
import B2BDashboard from "./pages/B2BDashboard";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import UserSettings from "./pages/UserSettings";
import PricingPage from "./pages/PricingPage";
import MyMemorials from "./pages/MyMemorials";
import ResetPassword from "./pages/ResetPassword";
import AboutUs from "./pages/AboutUs";
import RouteChangeProgress from "./components/RouteChangeProgress";
import CookieConsentBanner from "./components/CookieConsentBanner";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isNetworkError(error)) toast.error(FRIENDLY_NETWORK_MESSAGE);
    },
  }),
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NetworkStatus />
          <GlobalNetworkErrorHandler />
          <BrowserRouter>
            <ScrollToTop />
            <RouteChangeProgress />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/directory/:type" element={<Directory />} />
              <Route path="/memorial/:id" element={<MemorialDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateMemorial />
                  </ProtectedRoute>
                }
              />
              <Route path="/memorial/:id/edit" element={<EditMemorial />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/settings" element={<UserSettings />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/my-memorials" element={<MyMemorials />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/dashboard/b2b"
                element={
                  <ProtectedRoute requiredRole="b2b_partner">
                    <B2BDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsentBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
