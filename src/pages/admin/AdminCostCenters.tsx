import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { CostCentersManager } from '@/components/admin/crm/CostCentersManager';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCostCenters = () => {
  return (
    <>
      <Helmet>
        <title>Centros de Custo - Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/centros-custo`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Centros de Custo</h1>
            <p className="text-muted-foreground">
              Gerencie centros de custo para segregação financeira
            </p>
          </div>

          <CostCentersManager />
        </div>
      </Layout>
    </>
  );
};

export default AdminCostCenters;
