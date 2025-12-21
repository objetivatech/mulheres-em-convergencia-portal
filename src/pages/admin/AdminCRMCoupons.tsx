import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { CouponsManagement } from '@/components/admin/crm/CouponsManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMCoupons = () => {
  return (
    <>
      <Helmet>
        <title>Cupons de Desconto - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/cupons`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
            <p className="text-muted-foreground">
              Crie e gerencie cupons promocionais para eventos
            </p>
          </div>

          <CouponsManagement />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMCoupons;
