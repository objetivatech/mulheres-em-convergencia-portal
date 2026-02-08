import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Users, 
  DollarSign, 
  Download,
  BarChart3,
} from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { useAmbassadorAdmin, AmbassadorWithProfile } from '@/hooks/useAmbassadorAdmin';
import {
  AdminAmbassadorStats,
  AdminAmbassadorsList,
  AdminPayoutsList,
  EditAmbassadorDialog,
  EditPaymentDataDialog,
  AmbassadorDetailsDialog,
} from '@/components/admin/ambassadors';

const AdminAmbassadorsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAmbassador, setEditingAmbassador] = useState<AmbassadorWithProfile | null>(null);
  const [editingPayment, setEditingPayment] = useState<AmbassadorWithProfile | null>(null);
  const [viewingDetails, setViewingDetails] = useState<AmbassadorWithProfile | null>(null);

  const { 
    useAllAmbassadors, 
    useAllPayouts, 
    useAdminStats,
    exportToCSV,
  } = useAmbassadorAdmin();

  const { data: ambassadors = [], isLoading: ambassadorsLoading } = useAllAmbassadors();
  const { data: payouts = [], isLoading: payoutsLoading } = useAllPayouts();
  const stats = useAdminStats();

  const handleExportAmbassadors = () => {
    const exportData = ambassadors.map(amb => ({
      nome: amb.profile?.full_name || '',
      email: amb.profile?.email || '',
      codigo: amb.referral_code,
      taxa_comissao: amb.commission_rate,
      cliques: amb.link_clicks,
      conversoes: amb.total_sales,
      ganhos_totais: amb.total_earnings,
      comissao_pendente: amb.pending_commission,
      status: amb.active ? 'Ativa' : 'Inativa',
      preferencia_pagamento: amb.payment_preference,
      pix: amb.pix_key || '',
      criado_em: amb.created_at,
    }));
    exportToCSV(exportData, 'embaixadoras');
  };

  const handleExportPayouts = () => {
    const exportData = payouts.map((p: any) => ({
      embaixadora: p.ambassador?.profile?.full_name || '',
      email: p.ambassador?.profile?.email || '',
      periodo: p.reference_period,
      vendas: p.total_sales,
      valor_bruto: p.gross_amount,
      valor_liquido: p.net_amount,
      status: p.status,
      data_agendada: p.scheduled_date,
      data_pagamento: p.paid_at || '',
      metodo: p.payment_method || '',
    }));
    exportToCSV(exportData, 'pagamentos_embaixadoras');
  };

  return (
    <>
      <Helmet>
        <title>Gestão de Embaixadoras - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie embaixadoras, comissões e pagamentos do programa de afiliados" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/embaixadoras`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                    <Crown className="h-8 w-8 text-yellow-600" />
                    Gestão de Embaixadoras
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie o programa de embaixadoras, comissões e pagamentos
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportAmbassadors}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Embaixadoras
                  </Button>
                  <Button variant="outline" onClick={handleExportPayouts}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Pagamentos
                  </Button>
                </div>
              </div>
            </header>

            {/* Stats Cards */}
            <AdminAmbassadorStats stats={stats} isLoading={ambassadorsLoading} />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="ambassadors" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Embaixadoras
                </TabsTrigger>
                <TabsTrigger value="payouts" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pagamentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <AdminAmbassadorsList
                  ambassadors={ambassadors}
                  onEditAmbassador={setEditingAmbassador}
                  onEditPayment={setEditingPayment}
                  onViewDetails={setViewingDetails}
                />
              </TabsContent>

              <TabsContent value="ambassadors" className="mt-6">
                <AdminAmbassadorsList
                  ambassadors={ambassadors}
                  onEditAmbassador={setEditingAmbassador}
                  onEditPayment={setEditingPayment}
                  onViewDetails={setViewingDetails}
                />
              </TabsContent>

              <TabsContent value="payouts" className="mt-6">
                <AdminPayoutsList payouts={payouts} isLoading={payoutsLoading} />
              </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <EditAmbassadorDialog
              open={!!editingAmbassador}
              onOpenChange={(open) => !open && setEditingAmbassador(null)}
              ambassador={editingAmbassador}
            />

            <EditPaymentDataDialog
              open={!!editingPayment}
              onOpenChange={(open) => !open && setEditingPayment(null)}
              ambassador={editingPayment}
            />

            <AmbassadorDetailsDialog
              open={!!viewingDetails}
              onOpenChange={(open) => !open && setViewingDetails(null)}
              ambassador={viewingDetails}
            />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminAmbassadorsPage;
