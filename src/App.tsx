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
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/reset-password" element={<ResetPasswordWithToken />} />
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
        <Route path="/admin/user-journey" element={
          <ProtectedRoute requireAdmin={true}>
            <UserJourney />
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
        <Route path="/admin/parceiros" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminPartners />
          </ProtectedRoute>
        } />
        <Route path="/admin/contact-messages" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminContactMessages />
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
        
        {/* Page Builder Routes */}
        <Route path="/admin/pages" element={
          <ProtectedRoute requireAdmin={true}>
            <PagesManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/page-builder/new" element={
          <ProtectedRoute requireAdmin={true}>
            <PageBuilderEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/page-builder/:id" element={
          <ProtectedRoute requireAdmin={true}>
            <PageBuilderEditor />
          </ProtectedRoute>
        } />
        
        {/* Site Management Routes */}
        <Route path="/admin/site-settings" element={
          <ProtectedRoute requireAdmin={true}>
            <SiteSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/navigation" element={
          <ProtectedRoute requireAdmin={true}>
            <NavigationSettings />
          </ProtectedRoute>
        } />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/:type" element={
          <RoleProtectedRoute>
            <Dashboard />
          </RoleProtectedRoute>
        } />
          <Route path="/dashboard-empresa" element={
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
          
          {/* Public Page Routes */}
          <Route path="/page/:slug" element={<PublicPage />} />
          
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
