import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { CostCentersManager } from '@/components/admin/crm/CostCentersManager';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Centros de Custo</h1>
              <p className="text-muted-foreground">
                Gerencie centros de custo para segregação financeira
              </p>
            </div>
          </div>

          <CostCentersManager />
        </div>
      </Layout>
    </>
  );
};

export default AdminCostCenters;
