import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { CRMMetricsDashboard } from '@/components/admin/crm/CRMMetricsDashboard';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMDashboard = () => {
  return (
    <>
      <Helmet>
        <title>CRM Dashboard - Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">CRM Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral de leads, negócios e métricas
            </p>
          </div>

          <CRMMetricsDashboard />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMDashboard;
