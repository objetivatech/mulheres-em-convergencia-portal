import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { DealPipeline } from '@/components/admin/crm/DealPipeline';
import { DealForm } from '@/components/admin/crm/DealForm';
import { PipelineSettings } from '@/components/admin/crm/PipelineSettings';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { CRMDeal } from '@/hooks/useCRM';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMPipeline = () => {
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [activePipelineId, setActivePipelineId] = useState<string | undefined>();

  const handleDealClick = (deal: CRMDeal) => {
    setSelectedDeal(deal);
    setShowDealForm(true);
  };

  const handleAddDeal = () => {
    setSelectedDeal(undefined);
    setShowDealForm(true);
  };

  const handlePipelineChange = (pipelineId: string) => {
    setActivePipelineId(pipelineId);
  };

  return (
    <>
      <Helmet>
        <title>Pipeline de Vendas - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/pipeline`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
              <p className="text-muted-foreground">
                Gerencie negócios e acompanhe o funil de vendas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Pipelines
              </Button>
              <Button onClick={handleAddDeal}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Negócio
              </Button>
            </div>
          </div>

          <DealPipeline 
            onDealClick={handleDealClick}
            onAddDeal={handleAddDeal}
            pipelineId={activePipelineId}
            onPipelineChange={handlePipelineChange}
          />

          <DealForm 
            open={showDealForm}
            onOpenChange={setShowDealForm}
            deal={selectedDeal}
          />

          <PipelineSettings
            open={showSettings}
            onOpenChange={setShowSettings}
          />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMPipeline;
