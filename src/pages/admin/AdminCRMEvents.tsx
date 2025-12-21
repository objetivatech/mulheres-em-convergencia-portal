import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { EventsManagement } from '@/components/admin/crm/EventsManagement';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMEvents = () => {
  return (
    <>
      <Helmet>
        <title>Gestão de Eventos - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/eventos`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Gestão de Eventos</h1>
            <p className="text-muted-foreground">
              Crie, gerencie eventos e acompanhe inscrições e check-ins
            </p>
          </div>

          <EventsManagement />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMEvents;
