import { Toaster } from "@/components/ui/toaster";
import React from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import ConfirmEmail from "./pages/ConfirmEmail";
import ResetPasswordWithToken from "./pages/ResetPasswordWithToken";
import Contato from "./pages/Contato";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAyrshare from "./pages/AdminAyrshare";
import AdminPartners from "./pages/AdminPartners";
import AdminContactMessages from "./pages/AdminContactMessages";
import UserManagement from './pages/UserManagement';
import UserJourney from './pages/UserJourney';
import BlogDashboard from './pages/BlogDashboard';
import BlogEditor from './pages/BlogEditor';
import BlogCategories from './pages/BlogCategories';
import PagesManagement from './pages/admin/PagesManagement';
import PageBuilderEditor from './pages/admin/PageBuilder';
import SiteSettings from './pages/admin/SiteSettings';
import NavigationSettings from './pages/admin/NavigationSettings';
import PublicPage from './pages/PublicPage';
import { DashboardEmpresa } from './pages/DashboardEmpresa';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import ConfirmacaoPagamento from './pages/ConfirmacaoPagamento';

import { UserDashboard } from '@/pages/UserDashboard';
import ConfiguracoesContaPage from '@/pages/ConfiguracoesContaPage';
import DadosPessoaisPage from '@/pages/DadosPessoaisPage';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAuth } from '@/hooks/useAuth';
import AdminRegistrations from '@/pages/AdminRegistrations';

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
        {/* Rotas Públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/entrar" element={<Auth />} />
        <Route path="/confirmar-email" element={<ConfirmEmail />} />
        <Route path="/redefinir-senha" element={<ResetPasswordWithToken />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/diretorio" element={<Diretorio />} />
        <Route path="/diretorio/:slug" element={<DiretorioEmpresa />} />
        <Route path="/convergindo" element={<Convergindo />} />
        <Route path="/convergindo/:slug" element={<Post />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/pagina/:slug" element={<PublicPage />} />
        <Route path="/admin/cadastros" element={<AdminRegistrations />} />
        
        {/* Redirects de Compatibilidade (URLs antigas) */}
        <Route path="/auth" element={<Navigate to="/entrar" replace />} />
        <Route path="/confirm-email" element={<Navigate to="/confirmar-email" replace />} />
        <Route path="/reset-password" element={<Navigate to="/redefinir-senha" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/esqueci-senha" replace />} />
        <Route path="/page/:slug" element={<Navigate to="/pagina/:slug" replace />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/jornada-usuario" element={
          <ProtectedRoute requireAdmin={true}>
            <UserJourney />
          </ProtectedRoute>
        } />
        <Route path="/admin/analiticas" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        
        {/* Redirects Admin (Compatibilidade) */}
        <Route path="/admin/users" element={<Navigate to="/admin/usuarios" replace />} />
        <Route path="/admin/user-journey" element={<Navigate to="/admin/jornada-usuario" replace />} />
        <Route path="/admin/analytics" element={<Navigate to="/admin/analiticas" replace />} />
        <Route path="/admin/ayrshare" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminAyrshare />
          </ProtectedRoute>
        } />
        <Route path="/admin/parceiros" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminPartners />
          </ProtectedRoute>
        } />
        <Route path="/admin/mensagens-contato" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminContactMessages />
          </ProtectedRoute>
        } />
        <Route path="/admin/contact-messages" element={<Navigate to="/admin/mensagens-contato" replace />} />
        
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
        
        {/* Rotas do Construtor de Páginas */}
        <Route path="/admin/paginas" element={
          <ProtectedRoute requireAdmin={true}>
            <PagesManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/construtor-paginas/novo" element={
          <ProtectedRoute requireAdmin={true}>
            <PageBuilderEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/construtor-paginas/:id" element={
          <ProtectedRoute requireAdmin={true}>
            <PageBuilderEditor />
          </ProtectedRoute>
        } />
        
        {/* Redirects Page Builder */}
        <Route path="/admin/pages" element={<Navigate to="/admin/paginas" replace />} />
        <Route path="/admin/page-builder/new" element={<Navigate to="/admin/construtor-paginas/novo" replace />} />
        <Route path="/admin/page-builder/:id" element={<Navigate to="/admin/construtor-paginas/:id" replace />} />
        
        {/* Rotas de Gerenciamento do Site */}
        <Route path="/admin/configuracoes-site" element={
          <ProtectedRoute requireAdmin={true}>
            <SiteSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/navegacao" element={
          <ProtectedRoute requireAdmin={true}>
            <NavigationSettings />
          </ProtectedRoute>
        } />
        
        {/* Redirects Site Management */}
        <Route path="/admin/site-settings" element={<Navigate to="/admin/configuracoes-site" replace />} />
        <Route path="/admin/navigation" element={<Navigate to="/admin/navegacao" replace />} />
        
        {/* Rotas de Painel do Usuário */}
        <Route path="/painel" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/painel/:tipo" element={
          <RoleProtectedRoute>
            <Dashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/painel-empresa" element={
          <ProtectedRoute>
            <DashboardEmpresa />
          </ProtectedRoute>
        } />
        <Route path="/meu-painel" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        
        {/* Redirects de Compatibilidade (Dashboard) */}
        <Route path="/dashboard" element={<Navigate to="/painel" replace />} />
        <Route path="/dashboard/:type" element={<Navigate to="/painel/:type" replace />} />
        <Route path="/dashboard-empresa" element={<Navigate to="/painel-empresa" replace />} />
        <Route path="/meu-dashboard" element={<Navigate to="/meu-painel" replace />} />
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
        <Route path="/confirmacao-pagamento" element={
          <ProtectedRoute>
            <ConfirmacaoPagamento />
          </ProtectedRoute>
        } />
        <Route path="/premium" element={
          <ProtectedRoute>
            <PremiumDashboard />
          </ProtectedRoute>
        } />
          
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
