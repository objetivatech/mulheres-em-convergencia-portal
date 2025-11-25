import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialAccountsManager } from '@/components/admin/SocialAccountsManager';
import { SocialPostComposer } from '@/components/admin/SocialPostComposer';
import { SocialPostHistory } from '@/components/admin/SocialPostHistory';

const AdminSocialMedia = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Gestão de Redes Sociais - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie suas publicações em redes sociais" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/social-media`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Gestão de Redes Sociais
              </h1>
              <p className="text-muted-foreground">
                Conecte suas contas, publique e agende posts nas redes sociais
              </p>
            </header>

            <Tabs defaultValue="accounts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accounts">Contas</TabsTrigger>
                <TabsTrigger value="compose">Criar Post</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-4">
                <SocialAccountsManager />
              </TabsContent>

              <TabsContent value="compose" className="space-y-4">
                <SocialPostComposer />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <SocialPostHistory />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminSocialMedia;
