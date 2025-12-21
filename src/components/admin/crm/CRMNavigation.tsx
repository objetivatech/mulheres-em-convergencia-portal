import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Calendar, 
  DollarSign, 
  Heart, 
  Route,
  Building2,
  ArrowLeft,
  Settings,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CRMNavigationProps {
  showBackButton?: boolean;
}

const navItems = [
  { path: '/admin/crm', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/crm/contatos', label: 'Contatos', icon: Users },
  { path: '/admin/crm/pipeline', label: 'Pipeline', icon: Kanban },
  { path: '/admin/crm/eventos', label: 'Eventos', icon: Calendar },
  { path: '/admin/crm/cupons', label: 'Cupons', icon: Ticket },
  { path: '/admin/crm/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/admin/crm/impacto', label: 'Impacto Social', icon: Heart },
  { path: '/admin/centros-custo', label: 'Centros de Custo', icon: Building2 },
];

export const CRMNavigation = ({ showBackButton = true }: CRMNavigationProps) => {
  const location = useLocation();

  return (
    <div className="flex items-center gap-4 mb-6">
      {showBackButton && (
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      )}
      
      <nav className="flex items-center gap-1 p-1 bg-muted rounded-lg flex-wrap">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin/crm' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default CRMNavigation;
