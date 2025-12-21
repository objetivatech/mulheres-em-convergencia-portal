import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { SocialImpactDashboard } from '@/components/admin/crm/SocialImpactDashboard';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMImpact = () => {
  return (
    <>
      <Helmet>
        <title>Impacto Social - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/impacto`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Impacto Social</h1>
            <p className="text-muted-foreground">
              Métricas de impacto social e jornada dos contatos
            </p>
          </div>

          <SocialImpactDashboard />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMImpact;
