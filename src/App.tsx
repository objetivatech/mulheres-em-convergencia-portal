import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/components/auth/AuthProvider";
import HomePage from "./pages/site/HomePage";
import PainelHome from "./pages/painel/PainelHome";
import PainelNegocios from "./pages/painel/PainelNegocios";
import PainelNegocioEditor from "./pages/painel/PainelNegocioEditor";
import PainelBlog from "./pages/painel/PainelBlog";
import PainelPostEditor from "./pages/painel/PainelPostEditor";
import PainelCategorias from "./pages/painel/PainelCategorias";
import PainelPaginas from "./pages/painel/PainelPaginas";
import PainelPaginaEditor from "./pages/painel/PainelPaginaEditor";
import PainelBlocos from "./pages/painel/PainelBlocos";
import PainelComunicados from "./pages/painel/ComunicadosPage";
import PainelPlanosEventos from "./pages/painel/PainelPlanosEventos";

import DiretorioPage from "./pages/site/DiretorioPage";
import NegocioPage from "./pages/site/NegocioPage";
import BlogPage from "./pages/site/BlogPage";
import BlogPostPage from "./pages/site/BlogPostPage";
import PaginaInstitucional from "./pages/site/PaginaInstitucional";
import Auth from "./pages/Auth";
import PlanosPage from './pages/site/PlanosPage';
import EventosPage from './pages/site/EventosPage';
import EventoPage from './pages/site/EventoPage';
import AcademyPage from './pages/site/AcademyPage';
import AcademyCursoPage from './pages/site/AcademyCursoPage';
import MinhaAreaHome from './pages/area/MinhaAreaHome';
import MeusPlanos from './pages/area/MeusPlanos';
import MeusEncontros from './pages/area/MeusEncontros';
import MeuIngresso from './pages/area/MeuIngresso';
import MeusDados from './pages/area/MeusDados';
import MinhaAcademy from './pages/area/MinhaAcademy';
import MeuConecta from './pages/area/MeuConecta';
import MinhaEmbaixadora from './pages/area/MinhaEmbaixadora';
import MeuNegocio from './pages/area/MeuNegocio';
import PainelPessoas from './pages/painel/PainelPessoas';
import PainelFinanceiro from './pages/painel/PainelFinanceiro';
import PainelCRM from './pages/painel/PainelCRM';
import PainelAutomacoes from './pages/painel/PainelAutomacoes';
import PainelAcessos from './pages/painel/PainelAcessos';
import PainelAcademy from './pages/painel/PainelAcademy';
import PainelConecta from './pages/painel/PainelConecta';
import PainelEmbaixadoras from './pages/painel/PainelEmbaixadoras';




import EventConfirmPresencePage from './pages/EventConfirmPresencePage';
import EventoConfirmacaoPage from './pages/EventoConfirmacaoPage';
import Comunidade from './pages/Comunidade';
import Comunidades from './pages/Comunidades';
import PremiumDashboard from './pages/PremiumDashboard';
import NotFound from "./pages/NotFound";
import Favicon from "@/components/layout/Favicon";
import ForgotPassword from "./pages/ForgotPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import ConfirmarTrocaEmailPage from "./pages/ConfirmarTrocaEmailPage";
import ResetPasswordWithToken from "./pages/ResetPasswordWithToken";
import Contato from "./pages/Contato";
import Admin from "./pages/Admin";
import { DashboardEmpresa } from './pages/DashboardEmpresa';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import ConfirmacaoPagamento from './pages/ConfirmacaoPagamento';
import ConvitePage from './pages/ConvitePage';
import EmbaixadoraDashboard from './pages/EmbaixadoraDashboard';
import Embaixadoras from './pages/Embaixadoras';
import QuemEElisangelaAranda from './pages/QuemEElisangelaAranda';
import DynamicLandingPage from './pages/DynamicLandingPage';
const PublicPageView = lazy(() => import('@/pages/PublicPageView'));

import { UserDashboard } from '@/pages/UserDashboard';
import ConfiguracoesContaPage from '@/pages/ConfiguracoesContaPage';
import DadosPessoaisPage from '@/pages/DadosPessoaisPage';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAuth } from '@/hooks/useAuth';
import { CookieConsent } from '@/components/CookieConsent';
import { InstallPWABanner } from '@/components/InstallPWABanner';
import ConectaDashboard from '@/pages/conecta/ConectaDashboard';
import ConectaPerfil from '@/pages/conecta/ConectaPerfil';
import ConectaMembros from '@/pages/conecta/ConectaMembros';
import ConectaEncontros from '@/pages/conecta/ConectaEncontros';
import ConectaReunioes from '@/pages/conecta/ConectaReunioes';
import ConectaDepoimentos from '@/pages/conecta/ConectaDepoimentos';
import ConectaNegocios from '@/pages/conecta/ConectaNegocios';
import ConectaIndicacoes from '@/pages/conecta/ConectaIndicacoes';
import ConectaRanking from '@/pages/conecta/ConectaRanking';
import ConectaEstatisticas from '@/pages/conecta/ConectaEstatisticas';
import ConectaConvites from '@/pages/conecta/ConectaConvites';
import ConectaConviteLanding from '@/pages/conecta/ConectaConviteLanding';
import ConectaConteudos from '@/pages/conecta/ConectaConteudos';
import ConectaGrupos from '@/pages/conecta/ConectaGrupos';
import ConectaHelpdesk from '@/pages/conecta/ConectaHelpdesk';
import ConectaParcerias from '@/pages/conecta/ConectaParcerias';
import ConectaAniversariantes from '@/pages/conecta/ConectaAniversariantes';
import EventoCheckin from '@/pages/EventoCheckin';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000,
    },
  },
});

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
        {/* Painel de conteúdo — banco novo */}
        <Route path="/painel-conteudo" element={<PainelHome />} />
        <Route path="/painel-conteudo/negocios" element={<PainelNegocios />} />
        <Route path="/painel-conteudo/negocios/:id" element={<PainelNegocioEditor />} />
        <Route path="/painel-conteudo/blog" element={<PainelBlog />} />
        <Route path="/painel-conteudo/blog/:id" element={<PainelPostEditor />} />
        <Route path="/painel-conteudo/categorias" element={<PainelCategorias />} />
        <Route path="/painel-conteudo/paginas" element={<PainelPaginas />} />
        <Route path="/painel-conteudo/paginas/:id" element={<PainelPaginaEditor />} />
        <Route path="/painel-conteudo/home" element={<PainelBlocos />} />
        <Route path="/painel-conteudo/planos-eventos" element={<PainelPlanosEventos />} />
        <Route path="/painel-conteudo/comunicados" element={<PainelComunicados />} />
        <Route path="/painel-conteudo/pessoas" element={<PainelPessoas />} />
        <Route path="/painel-conteudo/financeiro" element={<PainelFinanceiro />} />
        <Route path="/painel-conteudo/relacionamento" element={<PainelCRM />} />
        <Route path="/painel-conteudo/automacoes" element={<PainelAutomacoes />} />
        <Route path="/painel-conteudo/acessos" element={<PainelAcessos />} />
        <Route path="/painel-conteudo/academy" element={<PainelAcademy />} />

        {/* Área da associada — banco novo */}
        <Route path="/minha-area" element={<MinhaAreaHome />} />
        <Route path="/minha-area/planos" element={<MeusPlanos />} />
        <Route path="/minha-area/encontros" element={<MeusEncontros />} />
        <Route path="/minha-area/encontros/:id" element={<MeuIngresso />} />
        <Route path="/minha-area/academy" element={<MinhaAcademy />} />
        <Route path="/minha-area/conecta" element={<MeuConecta />} />
        <Route path="/minha-area/embaixadora" element={<MinhaEmbaixadora />} />
        <Route path="/minha-area/negocio" element={<MeuNegocio />} />
        <Route path="/minha-area/dados" element={<MeusDados />} />




        {/* Rotas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sobre" element={<PaginaInstitucional slug="sobre" />} />
        <Route path="/entrar" element={<Auth />} />
        <Route path="/confirmar-email" element={<ConfirmEmail />} />
        <Route path="/confirmar-troca-email" element={<ConfirmarTrocaEmailPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordWithToken />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/diretorio" element={<DiretorioPage />} />
        <Route path="/diretorio/:slug" element={<NegocioPage />} />
        <Route path="/comunidades" element={<Comunidades />} />
        <Route path="/comunidade/:id" element={<Comunidade />} />
        <Route path="/convergindo" element={<BlogPage />} />
        <Route path="/convergindo/:slug" element={<BlogPostPage />} />
        <Route path="/planos" element={<PlanosPage />} />
        <Route path="/embaixadoras" element={<Embaixadoras />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/eventos/confirmacao" element={<EventoConfirmacaoPage />} />
        <Route path="/eventos/:slug" element={<EventoPage />} />

        <Route path="/criar-converter" element={<Navigate to="/lp/criar-e-converter" replace />} />
        <Route path="/convite/:codigo" element={<ConvitePage />} />
        <Route path="/confirmar-presenca" element={<EventConfirmPresencePage />} />
        <Route path="/evento-checkin/:eventId" element={<EventoCheckin />} />
        <Route path="/comunidade/:id" element={<Comunidade />} />
        <Route path="/termos-de-uso" element={<PaginaInstitucional slug="termos-de-uso" />} />
        <Route path="/politica-de-privacidade" element={<PaginaInstitucional slug="politica-de-privacidade" />} />
        <Route path="/politica-de-cookies" element={<PaginaInstitucional slug="politica-de-cookies" />} />
        <Route path="/quem-e-elisangela-aranda" element={<QuemEElisangelaAranda />} />
        <Route path="/academy" element={<AcademyPage />} />
        <Route path="/academy/catalogo" element={<Navigate to="/academy" replace />} />
        <Route path="/academy/curso/:slug" element={<AcademyCursoPage />} />

        <Route path="/lp/:slug" element={<DynamicLandingPage />} />
        <Route path="/conecta/convite/:code" element={<ConectaConviteLanding />} />
        
        {/* Redirects de Compatibilidade (URLs antigas) */}
        <Route path="/auth" element={<Navigate to="/entrar" replace />} />
        <Route path="/confirm-email" element={<Navigate to="/confirmar-email" replace />} />
        <Route path="/reset-password" element={<Navigate to="/redefinir-senha" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/esqueci-senha" replace />} />
        <Route path="/page/:slug" element={<Navigate to="/" replace />} />
        <Route path="/pagina/:slug" element={<Suspense fallback={null}><PublicPageView /></Suspense>} />
        
        {/* Painel antigo desativado no reboot: tudo vive em /painel-conteudo (banco novo). */}
        <Route path="/admin" element={<Navigate to="/painel-conteudo" replace />} />
        <Route path="/admin/*" element={<Navigate to="/painel-conteudo" replace />} />
        <Route path="/dashboard/embaixadoras" element={<Navigate to="/painel-conteudo/pessoas" replace />} />
        
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
        
        {/* Embaixadora Dashboard */}
        {/* Painel Embaixadora - rota principal */}
        <Route path="/painel/embaixadora" element={
          <ProtectedRoute>
            <EmbaixadoraDashboard />
          </ProtectedRoute>
        } />
        {/* Rotas secundárias com redirect */}
        <Route path="/embaixadora/dashboard" element={
          <Navigate to="/painel/embaixadora" replace />
        } />
        <Route path="/dashboard/embaixadora" element={
          <Navigate to="/painel/embaixadora" replace />
        } />
        
        <Route path="/premium" element={
          <ProtectedRoute>
            <PremiumDashboard />
          </ProtectedRoute>
        } />
          
          {/* CONECTA+ Routes */}
          <Route path="/conecta" element={<ProtectedRoute><ConectaDashboard /></ProtectedRoute>} />
          <Route path="/conecta/perfil" element={<ProtectedRoute><ConectaPerfil /></ProtectedRoute>} />
          <Route path="/conecta/membros" element={<ProtectedRoute><ConectaMembros /></ProtectedRoute>} />
          <Route path="/conecta/grupos" element={<ProtectedRoute><ConectaGrupos /></ProtectedRoute>} />
          <Route path="/conecta/grupos/:groupId" element={<ProtectedRoute><ConectaGrupos /></ProtectedRoute>} />
          <Route path="/conecta/encontros" element={<ProtectedRoute><ConectaEncontros /></ProtectedRoute>} />
          <Route path="/conecta/reunioes" element={<ProtectedRoute><ConectaReunioes /></ProtectedRoute>} />
          <Route path="/conecta/depoimentos" element={<ProtectedRoute><ConectaDepoimentos /></ProtectedRoute>} />
          <Route path="/conecta/negocios" element={<ProtectedRoute><ConectaNegocios /></ProtectedRoute>} />
          <Route path="/conecta/indicacoes" element={<ProtectedRoute><ConectaIndicacoes /></ProtectedRoute>} />
          <Route path="/conecta/ranking" element={<ProtectedRoute><ConectaRanking /></ProtectedRoute>} />
          <Route path="/conecta/estatisticas" element={<ProtectedRoute><ConectaEstatisticas /></ProtectedRoute>} />
          <Route path="/conecta/convites" element={<ProtectedRoute><ConectaConvites /></ProtectedRoute>} />
          <Route path="/conecta/conteudos" element={<ProtectedRoute><ConectaConteudos /></ProtectedRoute>} />
          <Route path="/conecta/helpdesk" element={<ProtectedRoute><ConectaHelpdesk /></ProtectedRoute>} />
          <Route path="/conecta/parcerias" element={<ProtectedRoute><ConectaParcerias /></ProtectedRoute>} />
          <Route path="/conecta/aniversariantes" element={<ProtectedRoute><ConectaAniversariantes /></ProtectedRoute>} />
          
          {/* Admin CONECTA+ */}
          

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
        
        {/* Cookie Consent Banner */}
        <CookieConsent />
        
        {/* PWA Install Banner */}
        <InstallPWABanner />
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
