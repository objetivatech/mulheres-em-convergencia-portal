import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { UserJourneyDashboard } from '@/components/admin/UserJourneyDashboard';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { AdminBackButton } from '@/components/admin/AdminBackButton';

const UserJourneyPage = () => {
  return (
    <>
      <Helmet>
        <title>Jornada do Cliente - Mulheres em Convergência</title>
        <meta name="description" content="Acompanhe a jornada dos usuários e envie lembretes personalizados" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/user-journey`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <AdminBackButton label="Voltar ao Admin" />
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Jornada do Cliente
              </h1>
              <p className="text-muted-foreground">
                Monitore o progresso dos usuários e envie lembretes personalizados
              </p>
            </header>

            <UserJourneyDashboard />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default UserJourneyPage;
