import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { UserManagement as UserManagementComponent } from '@/components/admin/UserManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const UserManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestão de Usuários - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie usuários, roles e permissões do portal Mulheres em Convergência" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/users`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Gestão de Usuários
              </h1>
              <p className="text-muted-foreground">
                Gerencie usuários, roles e permissões do portal
              </p>
            </header>

            <UserManagementComponent />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default UserManagementPage;