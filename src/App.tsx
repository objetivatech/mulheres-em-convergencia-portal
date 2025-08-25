
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Favicon />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/convergindo" element={<Convergindo />} />
              <Route path="/convergindo/:slug" element={<Post />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
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
