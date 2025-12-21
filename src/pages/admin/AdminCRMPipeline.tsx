import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Kanban, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealPipeline } from '@/components/admin/crm/DealPipeline';
import { DealForm } from '@/components/admin/crm/DealForm';
import { CRMDeal } from '@/hooks/useCRM';

const AdminCRMPipeline = () => {
  const location = useLocation();
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);

  const navItems = [
    { path: '/admin/crm', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/crm/contatos', label: 'Contatos', icon: Users },
    { path: '/admin/crm/pipeline', label: 'Pipeline', icon: Kanban },
  ];

  const handleDealClick = (deal: CRMDeal) => {
    setSelectedDeal(deal);
    // Could open a deal detail modal here
  };

  const handleAddDeal = () => {
    setShowDealForm(true);
  };

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
            <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
            <p className="text-muted-foreground">Arraste os cards para mover entre estágios</p>
          </div>
        </div>
        <Button onClick={handleAddDeal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Negócio
        </Button>
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

      {/* Pipeline */}
      <DealPipeline 
        onDealClick={handleDealClick}
        onAddDeal={handleAddDeal}
      />

      {/* Deal Form Dialog */}
      <DealForm
        open={showDealForm}
        onOpenChange={setShowDealForm}
        contactId=""
        contactType="lead"
        contactName="Novo Cliente"
      />
    </div>
  );
};

export default AdminCRMPipeline;
