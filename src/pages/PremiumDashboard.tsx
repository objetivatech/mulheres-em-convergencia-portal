import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnalyticsDashboard from '@/components/premium/AnalyticsDashboard';
import BoostManager from '@/components/premium/BoostManager';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Zap, 
  Crown, 
  Settings,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PremiumDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (businessError && businessError.code !== 'PGRST116') throw businessError;
      setBusiness(businessData);

      // Fetch user subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            display_name,
            features,
            limits
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') throw subscriptionError;
      setUserSubscription(subscriptionData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (requiredPlan: string) => {
    if (!userSubscription) return false;
    
    const planHierarchy = { 'iniciante': 1, 'intermediario': 2, 'master': 3 };
    const currentLevel = planHierarchy[userSubscription.subscription_plans?.name as keyof typeof planHierarchy] || 0;
    const requiredLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 1;
    
    return currentLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!business) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma Empresa Cadastrada</CardTitle>
              <CardDescription>
                Você precisa cadastrar uma empresa antes de acessar os recursos premium.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/dashboard/empresa">Cadastrar Empresa</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Dashboard Premium - Mulheres em Convergência</title>
        <meta name="description" content="Recursos premium para empresárias" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard Premium</h1>
              <p className="text-muted-foreground">
                Recursos avançados para impulsionar seu negócio
              </p>
            </div>
            
            {userSubscription && (
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="h-4 w-4 mr-1" />
                {userSubscription.subscription_plans?.display_name}
              </Badge>
            )}
          </div>
        </div>

        {!userSubscription && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Recursos Premium Bloqueados
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Assine um plano para desbloquear todos os recursos premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/planos">Ver Planos Premium</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="boosts" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Boosts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            {hasFeatureAccess('intermediario') ? (
              <AnalyticsDashboard businessId={business.id} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Analytics Avançado
                  </CardTitle>
                  <CardDescription>
                    Este recurso está disponível nos planos Intermediário e Master
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Desbloqueie relatórios detalhados de performance, métricas de engajamento 
                      e análises de conversão para impulsionar seu negócio.
                    </p>
                    <Button asChild>
                      <a href="/planos">Fazer Upgrade</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="boosts">
            {hasFeatureAccess('intermediario') ? (
              <BoostManager 
                businessId={business.id} 
                currentPlan={userSubscription?.subscription_plans?.name || 'iniciante'}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Sistema de Boosts
                  </CardTitle>
                  <CardDescription>
                    Este recurso está disponível nos planos Intermediário e Master
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Impulsione a visibilidade do seu negócio com recursos premium como 
                      listagem em destaque, selo premium e muito mais.
                    </p>
                    <Button asChild>
                      <a href="/planos">Fazer Upgrade</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Premium</CardTitle>
                <CardDescription>
                  Personalize sua experiência premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Notificações de Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba relatórios semanais por email
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Alertas de Performance</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificações quando métricas mudam significativamente
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Backup de Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Exportar dados de analytics e reviews
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PremiumDashboard;