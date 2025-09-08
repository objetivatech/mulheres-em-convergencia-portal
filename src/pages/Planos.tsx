import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Star, Zap, Crown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CustomerInfoDialog, { CustomerFormData, UserProfileData } from '@/components/subscriptions/CustomerInfoDialog';

type SubscriptionPlan = {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  limits: any;
  is_featured: boolean;
  is_active: boolean;
};

type UserSubscription = {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  expires_at: string | null;
};

const Planos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly' | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchUserSubscription();
      fetchUserProfile();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, cpf, phone, city, state')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleSubscribe = async (
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    customer?: CustomerFormData
  ) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para assinar um plano',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPlan(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_method: 'PIX',
          customer,
        },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
      } else {
        toast({ title: 'Atenção', description: 'Resposta sem URL de pagamento.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error);
      const message = error?.message || 'Não foi possível processar a assinatura';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'iniciante':
        return <Star className="h-6 w-6" />;
      case 'intermediario':
        return <Zap className="h-6 w-6" />;
      case 'master':
        return <Crown className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const isCurrentPlan = (planId: string) => {
    return userSubscription?.plan_id === planId;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Planos de Assinatura - Mulheres em Convergência</title>
        <meta name="description" content="Escolha o plano ideal para o seu negócio no Diretório de Associadas" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planos de Assinatura</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para destacar seu negócio no Diretório de Associadas e aproveitar todos os benefícios da nossa comunidade.
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${plan.is_featured ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.is_featured && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Mais Popular
                </Badge>
              )}
              
              {isCurrentPlan(plan.id) && (
                <Badge variant="secondary" className="absolute -top-3 right-4">
                  Plano Atual
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4 text-primary">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.features?.description || ''}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Preços */}
                <div className="text-center">
                  <div className="mb-2">
                    <span className="text-3xl font-bold">{formatPrice(plan.price_monthly)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ou {formatPrice(plan.price_yearly)}/ano
                    <Badge variant="outline" className="ml-2">
                      {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% desconto
                    </Badge>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features?.benefits && plan.features.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                {plan.limits && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Incluído:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {plan.limits.business_profiles && (
                        <div>• {plan.limits.business_profiles} perfil(is) de negócio</div>
                      )}
                      {plan.limits.mentorship_hours && (
                        <div>• {plan.limits.mentorship_hours}h de mentoria/mês</div>
                      )}
                      {plan.limits.discount_percentage && (
                        <div>• {plan.limits.discount_percentage}% desconto em eventos</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="space-y-2">
                  {!isCurrentPlan(plan.id) ? (
                    <>
                      <Button
                        className="w-full"
                        variant={plan.is_featured ? "default" : "outline"}
                        onClick={() => { setSelectedPlanId(plan.id); setSelectedBilling('monthly'); setDialogOpen(true); }}
                        disabled={processingPlan === plan.id}
                      >
                        {processingPlan === plan.id ? 'Processando...' : 'Assinar Mensalmente'}
                      </Button>
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => { setSelectedPlanId(plan.id); setSelectedBilling('yearly'); setDialogOpen(true); }}
                        disabled={processingPlan === plan.id}
                      >
                        {processingPlan === plan.id ? 'Processando...' : 'Assinar Anualmente'}
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      Plano Ativo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ ou informações adicionais */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Dúvidas sobre os planos?</h2>
          <p className="text-muted-foreground mb-4">
            Entre em contato conosco e tire todas as suas dúvidas sobre nossos planos de assinatura.
          </p>
          <Button variant="outline" asChild>
            <a href="/contato">Falar Conosco</a>
          </Button>
        </div>
      </div>

      <CustomerInfoDialog
        open={dialogOpen}
        loading={dialogLoading}
        userProfile={userProfile}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (values) => {
          if (!selectedPlanId || !selectedBilling) {
            toast({ title: 'Erro', description: 'Selecione um plano.', variant: 'destructive' });
            return;
          }
          setDialogLoading(true);
          try {
            await handleSubscribe(selectedPlanId, selectedBilling, values);
            // Update profile with any new data provided
            if (user && values) {
              const profileUpdates: any = {};
              if (values.name && values.name !== userProfile?.full_name) {
                profileUpdates.full_name = values.name;
              }
              if (values.cpfCnpj && values.cpfCnpj !== userProfile?.cpf) {
                profileUpdates.cpf = values.cpfCnpj;
              }
              if (values.phone && values.phone !== userProfile?.phone) {
                profileUpdates.phone = values.phone;
              }
              if (values.city && values.city !== userProfile?.city) {
                profileUpdates.city = values.city;
              }
              if (values.state && values.state !== userProfile?.state) {
                profileUpdates.state = values.state;
              }
              
              if (Object.keys(profileUpdates).length > 0) {
                await supabase
                  .from('profiles')
                  .update(profileUpdates)
                  .eq('id', user.id);
                // Refresh profile data
                fetchUserProfile();
              }
            }
          } finally {
            setDialogLoading(false);
            setDialogOpen(false);
          }
        }}
      />
    </Layout>
  );
};

export default Planos;