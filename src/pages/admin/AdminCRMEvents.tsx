import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { EventsManagement } from '@/components/admin/crm/EventsManagement';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Kanban, Calendar, Heart } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMEvents = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/crm', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/crm/contatos', label: 'Contatos', icon: Users },
    { path: '/admin/crm/pipeline', label: 'Pipeline', icon: Kanban },
    { path: '/admin/crm/eventos', label: 'Eventos', icon: Calendar },
    { path: '/admin/crm/financeiro', label: 'Financeiro', icon: Heart },
  ];

  return (
    <>
      <Helmet>
        <title>Gestão de Eventos - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/eventos`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          {/* Navigation */}
          <nav className="flex items-center gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

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
