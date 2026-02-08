import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAmbassador } from '@/hooks/useAmbassador';
import Layout from '@/components/layout/Layout';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Crown, BarChart3, Link2, Wallet, Users, FileText, Bell } from 'lucide-react';
import {
  AmbassadorStatsCards,
  AmbassadorReferralLink,
  AmbassadorReferralsList,
  AmbassadorPaymentSettings,
  AmbassadorClicksChart,
  AmbassadorPayoutHistory,
  AmbassadorNotifications,
} from '@/components/ambassador';

export const EmbaixadoraDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    useAmbassadorData,
    useReferrals,
    useClicks,
    usePayouts,
    useStats,
  } = useAmbassador();

  const { data: ambassador, isLoading: ambassadorLoading, error } = useAmbassadorData();
  const { data: referrals, isLoading: referralsLoading } = useReferrals(ambassador?.id);
  const { data: clicks, isLoading: clicksLoading } = useClicks(ambassador?.id);
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(ambassador?.id);
  const stats = useStats(ambassador?.id);

  const isLoading = authLoading || ambassadorLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  // Se não é embaixadora, redirecionar
  if (error || !ambassador) {
    return (
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-6">
              Você ainda não é uma embaixadora. Entre em contato conosco para saber como se tornar uma!
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard Embaixadora - Mulheres em Convergência</title>
        <meta 
          name="description" 
          content="Gerencie suas indicações, acompanhe comissões e visualize suas métricas." 
        />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/painel/embaixadora`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      Dashboard Embaixadora
                    </h1>
                    <p className="text-muted-foreground">
                      Gerencie suas indicações e acompanhe suas comissões
                    </p>
                  </div>
                </div>
                {/* Notification Icon */}
                <AmbassadorNotifications ambassadorId={ambassador.id} variant="icon" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">
                  {user.user_metadata?.full_name || user.email}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  Código: {ambassador.referral_code}
                </Badge>
                {ambassador.active ? (
                  <Badge variant="secondary">
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="destructive">Inativa</Badge>
                )}
              </div>
            </header>

            {/* Stats Cards */}
            <section className="mb-8">
              <AmbassadorStatsCards stats={stats} isLoading={ambassadorLoading} />
            </section>

            {/* Tabs para diferentes seções */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Meus Links</span>
                </TabsTrigger>
                <TabsTrigger value="referrals" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Indicações</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Pagamentos</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </TabsTrigger>
              </TabsList>

              {/* Visão Geral */}
              <TabsContent value="overview" className="space-y-6">
                <AmbassadorReferralLink referralCode={ambassador.referral_code} />
                <AmbassadorClicksChart clicks={clicks || []} isLoading={clicksLoading} />
              </TabsContent>

              {/* Links */}
              <TabsContent value="links" className="space-y-6">
                <AmbassadorReferralLink referralCode={ambassador.referral_code} />
              </TabsContent>

              {/* Indicações */}
              <TabsContent value="referrals" className="space-y-6">
                <AmbassadorReferralsList 
                  referrals={referrals || []} 
                  isLoading={referralsLoading} 
                />
              </TabsContent>

              {/* Pagamentos */}
              <TabsContent value="payments" className="space-y-6">
                {/* Notificações de pagamento */}
                <AmbassadorNotifications ambassadorId={ambassador.id} variant="full" />
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <AmbassadorPaymentSettings ambassador={ambassador} />
                  <AmbassadorPayoutHistory 
                    payouts={payouts || []} 
                    isLoading={payoutsLoading} 
                  />
                </div>
              </TabsContent>

              {/* Relatórios */}
              <TabsContent value="reports" className="space-y-6">
                <AmbassadorClicksChart clicks={clicks || []} isLoading={clicksLoading} />
                <AmbassadorReferralsList 
                  referrals={referrals || []} 
                  isLoading={referralsLoading} 
                />
                <AmbassadorPayoutHistory 
                  payouts={payouts || []} 
                  isLoading={payoutsLoading} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default EmbaixadoraDashboard;
