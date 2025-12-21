import { Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Kanban, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRMMetricsDashboard } from '@/components/admin/crm/CRMMetricsDashboard';

const AdminCRMDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/crm', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/crm/contatos', label: 'Contatos', icon: Users },
    { path: '/admin/crm/pipeline', label: 'Pipeline', icon: Kanban },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">CRM</h1>
            <p className="text-muted-foreground">Gestão de relacionamento com clientes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button 
                variant={isActive ? 'default' : 'ghost'}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Content */}
      <CRMMetricsDashboard />
    </div>
  );
};

export default AdminCRMDashboard;
