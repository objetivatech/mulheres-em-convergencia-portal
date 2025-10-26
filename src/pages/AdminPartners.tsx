import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnersManagement } from '@/components/admin/PartnersManagement';
import { CommunitiesManagement } from '@/components/admin/CommunitiesManagement';
import { CategoriesManagement } from '@/components/admin/CategoriesManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminPartners = () => {
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
        <title>Gerenciar Parceiros e Comunidades - Admin - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/parceiros`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Cadastros</h1>
              <p className="text-muted-foreground">
                Gerencie parceiros, apoiadores e comunidades/coletivos
              </p>
            </div>

            <Tabs defaultValue="partners" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                <TabsTrigger value="partners">Parceiros</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
                <TabsTrigger value="communities">Comunidades</TabsTrigger>
              </TabsList>

              <TabsContent value="partners" className="mt-6">
                <PartnersManagement />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <CategoriesManagement />
              </TabsContent>

              <TabsContent value="communities" className="mt-6">
                <CommunitiesManagement />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminPartners;

