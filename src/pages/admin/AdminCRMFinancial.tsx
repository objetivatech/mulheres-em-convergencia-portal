import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { DonationsManagement } from '@/components/admin/crm/DonationsManagement';
import { EventFinancialDashboard } from '@/components/admin/crm/EventFinancialDashboard';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminCRMFinancial = () => {
  return (
    <>
      <Helmet>
        <title>Financeiro - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/financeiro`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">
              Dashboard financeiro, doações e patrocínios
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard de Eventos</TabsTrigger>
              <TabsTrigger value="donations">Doações e Patrocínios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <EventFinancialDashboard />
            </TabsContent>
            
            <TabsContent value="donations">
              <DonationsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMFinancial;
