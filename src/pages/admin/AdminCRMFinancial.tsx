import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { DonationsManagement } from '@/components/admin/crm/DonationsManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMFinancial = () => {
  return (
    <>
      <Helmet>
        <title>Doações e Patrocinadores - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/financeiro`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Doações e Patrocinadores</h1>
            <p className="text-muted-foreground">
              Gerencie doações, patrocínios e acompanhe o dashboard financeiro
            </p>
          </div>

          <DonationsManagement />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMFinancial;
