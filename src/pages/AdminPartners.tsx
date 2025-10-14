import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PartnersManagement } from '@/components/admin/PartnersManagement';
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
        <title>Gerenciar Parceiros - Admin - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/parceiros`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Parceiros e Apoiadores</h1>
              <p className="text-muted-foreground">
                Gerencie os logos exibidos na página inicial e na página Sobre
              </p>
            </div>

            <PartnersManagement />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminPartners;
