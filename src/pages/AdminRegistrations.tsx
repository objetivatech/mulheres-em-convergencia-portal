import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnersManagement } from '@/components/admin/PartnersManagement';
import { CommunitiesManagement } from '@/components/admin/CommunitiesManagement';
import { CommunityRequestsManagement } from '@/components/admin/CommunityRequestsManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Users, Handshake, MessageSquare } from 'lucide-react';

const AdminRegistrations = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/entrar" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Cadastros Diversos - Admin - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/cadastros`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Cadastros Diversos</h1>
              <p className="text-muted-foreground">
                Gerencie parceiros, apoiadores, comunidades e coletivos
              </p>
            </div>

            <Tabs defaultValue="communities" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="communities" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comunidades/Coletivos
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Solicitações
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-2">
                  <Handshake className="h-4 w-4" />
                  Parceiros e Apoiadores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="communities" className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">Comunidades e Coletivos</h2>
                  <p className="text-muted-foreground">
                    Cadastre e gerencie as comunidades e coletivos que as empreendedoras podem vincular aos seus negócios
                  </p>
                </div>
                <CommunitiesManagement />
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">Solicitações de Novas Comunidades</h2>
                  <p className="text-muted-foreground">
                    Revise e aprove solicitações de cadastro de novas comunidades feitas pelas usuárias
                  </p>
                </div>
                <CommunityRequestsManagement />
              </TabsContent>

              <TabsContent value="partners" className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">Parceiros e Apoiadores</h2>
                  <p className="text-muted-foreground">
                    Gerencie os logos exibidos na página inicial e na página Sobre
                  </p>
                </div>
                <PartnersManagement />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminRegistrations;

