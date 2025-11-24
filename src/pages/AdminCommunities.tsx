import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { CommunitiesManagement } from '@/components/admin/CommunitiesManagement';
import { CommunityRequestsManagement } from '@/components/admin/CommunityRequestsManagement';
import { Building2, FileText } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCommunities = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Comunidades - Admin</title>
        <meta name="description" content="Administração de comunidades e coletivos" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/comunidades`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Gerenciar Comunidades
              </h1>
              <p className="text-muted-foreground">
                Gerencie comunidades/coletivos e aprove solicitações de negócios
              </p>
            </header>

            <Tabs defaultValue="communities" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="communities" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Comunidades
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Solicitações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="communities">
                <CommunitiesManagement />
              </TabsContent>

              <TabsContent value="requests">
                <CommunityRequestsManagement />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminCommunities;
