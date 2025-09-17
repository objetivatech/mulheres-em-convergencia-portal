
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
import Diretorio from "./pages/Diretorio";
import DiretorioEmpresa from "./pages/DiretorioEmpresa";
import Planos from './pages/Planos';
import PremiumDashboard from './pages/PremiumDashboard';
import NotFound from "./pages/NotFound";
import Favicon from "@/components/layout/Favicon";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contato from "./pages/Contato";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAyrshare from "./pages/AdminAyrshare";
import UserManagement from './pages/UserManagement';
import BlogDashboard from './pages/BlogDashboard';
import BlogEditor from './pages/BlogEditor';
import BlogCategories from './pages/BlogCategories';
import { DashboardEmpresa } from './pages/DashboardEmpresa';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

import { UserDashboard } from '@/pages/UserDashboard';
import ConfiguracoesContaPage from '@/pages/ConfiguracoesContaPage';
import DadosPessoaisPage from '@/pages/DadosPessoaisPage';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

// Hook para scroll ao topo quando a rota muda
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const { needsCompletion, loading: profileLoading, markAsComplete } = useProfileCompletion();
  const { user } = useAuth();

  return (
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
        <Route path="/diretorio" element={<Diretorio />} />
        <Route path="/diretorio/:slug" element={<DiretorioEmpresa />} />
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
        <Route path="/admin/analytics" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/ayrshare" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminAyrshare />
          </ProtectedRoute>
        } />
        
        {/* Blog Routes */}
        <Route path="/admin/blog" element={
          <ProtectedRoute requireBlogEditor={true}>
            <BlogDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog/novo" element={
          <ProtectedRoute requireBlogEditor={true}>
            <BlogEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog/editar/:id" element={
          <ProtectedRoute requireBlogEditor={true}>
            <BlogEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog/categorias" element={
          <ProtectedRoute requireBlogEditor={true}>
            <BlogCategories />
          </ProtectedRoute>
        } />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard/:type" element={
          <RoleProtectedRoute>
            <Dashboard />
          </RoleProtectedRoute>
        } />
          <Route path="/dashboard/empresa" element={
            <ProtectedRoute>
              <DashboardEmpresa />
            </ProtectedRoute>
          } />
          <Route path="/meu-dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes/conta" element={
            <ProtectedRoute>
              <ConfiguracoesContaPage />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes/dados-pessoais" element={
            <ProtectedRoute>
              <DadosPessoaisPage />
            </ProtectedRoute>
          } />
          <Route path="/planos" element={<Planos />} />
          <Route path="/premium" element={
            <ProtectedRoute>
              <PremiumDashboard />
            </ProtectedRoute>
          } />
          
          {/* Public RSS and Sitemap routes */}
          <Route path="/rss.xml" element={<div />} />
          <Route path="/sitemap.xml" element={<div />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Profile Completion Modal */}
        {user && !profileLoading && needsCompletion && (
          <ProfileCompletionModal
            user={user}
            open={needsCompletion}
            onComplete={markAsComplete}
          />
        )}
      </BrowserRouter>
    </TooltipProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
