import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { AyrshareTestInterface } from '@/components/admin/AyrshareTestInterface';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminAyrshare = () => {
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
        <title>Teste AYRSHARE - Mulheres em Convergência</title>
        <meta name="description" content="Interface de teste para integração com AYRSHARE" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/ayrshare`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Teste AYRSHARE
              </h1>
              <p className="text-muted-foreground">
                Interface de teste para verificar a integração com o AYRSHARE para posts automáticos nas redes sociais
              </p>
            </header>

            <AyrshareTestInterface />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminAyrshare;