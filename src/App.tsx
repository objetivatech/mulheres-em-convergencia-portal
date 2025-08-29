
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/components/auth/AuthProvider";
import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Auth from "./pages/Auth";
import Convergindo from "./pages/Convergindo";
import Post from "./pages/Post";
import NotFound from "./pages/NotFound";
import Favicon from "@/components/layout/Favicon";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contato from "./pages/Contato";
import Admin from "./pages/Admin";
import UserManagement from './pages/UserManagement';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

const queryClient = new QueryClient();

// Hook para scroll ao topo quando a rota muda
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Favicon />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/convergindo" element={<Convergindo />} />
              <Route path="/convergindo/:slug" element={<Post />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contato" element={<Contato />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard/:type" element={
                <RoleProtectedRoute>
                  <Dashboard />
                </RoleProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
