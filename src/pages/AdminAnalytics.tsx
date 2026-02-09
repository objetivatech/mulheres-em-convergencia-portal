import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { BusinessAnalyticsDashboard } from '@/components/admin/BusinessAnalyticsDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminAnalytics = () => {
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
        <title>Analytics Administrativo - Mulheres em Convergência</title>
        <meta name="description" content="Analytics e métricas dos negócios cadastrados no portal" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/analytics`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <AdminBackButton />
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Analytics Administrativo
              </h1>
              <p className="text-muted-foreground">
                Métricas e estatísticas dos negócios cadastrados no portal
              </p>
            </header>

            <BusinessAnalyticsDashboard />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminAnalytics;