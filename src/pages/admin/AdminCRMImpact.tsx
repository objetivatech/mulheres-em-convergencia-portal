import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { SocialImpactDashboard } from '@/components/admin/crm/SocialImpactDashboard';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const CRMNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/admin/crm', label: 'Dashboard' },
    { path: '/admin/crm/contatos', label: 'Contatos' },
    { path: '/admin/crm/pipeline', label: 'Pipeline' },
    { path: '/admin/crm/eventos', label: 'Eventos' },
    { path: '/admin/crm/financeiro', label: 'Financeiro' },
    { path: '/admin/crm/impacto', label: 'Impacto Social' },
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {navItems.map(item => (
        <Button
          key={item.path}
          variant={location.pathname === item.path ? 'default' : 'outline'}
          size="sm"
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
};

const AdminCRMImpact = () => {
  return (
    <Layout>
      <Helmet>
        <title>Impacto Social | CRM Admin</title>
        <link rel="canonical" href={`https://${PRODUCTION_DOMAIN}/admin/crm/impacto`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <CRMNavigation />
        <SocialImpactDashboard />
      </div>
    </Layout>
  );
};

export default AdminCRMImpact;
