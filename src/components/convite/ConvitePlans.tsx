import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Zap, Crown } from 'lucide-react';

type SubscriptionPlan = {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  price_6monthly: number;
  features: any;
  limits: any;
  is_featured: boolean;
  is_active: boolean;
};

interface ConvitePlansProps {
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly' | '6-monthly') => void;
  processingPlan: string | null;
}

export const ConvitePlans = ({ onSelectPlan, processingPlan }: ConvitePlansProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'essencial':
        return <Star className="h-6 w-6" />;
      case 'profissional':
        return <Zap className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <section id="planos" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="planos" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              💰 Escolha seu Plano
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Planos pensados para cada fase do seu negócio. Escolha o que melhor combina com você.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative ${plan.is_featured ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'}`}
              >
                {plan.is_featured && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Mais Popular
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
                  {/* Prices */}
                  <div className="text-center">
                    <div className="mb-2">
                      <span className="text-3xl font-bold">{formatPrice(plan.price_monthly)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        ou {formatPrice(plan.price_6monthly)}/semestre
                        <Badge variant="outline" className="ml-2">15% off</Badge>
                      </div>
                      <div>
                        ou {formatPrice(plan.price_yearly)}/ano
                        <Badge variant="outline" className="ml-2">20% off</Badge>
                      </div>
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
                      <h4 className="font-semibold mb-2 text-sm">Incluído:</h4>
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

                  {/* Buttons */}
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant={plan.is_featured ? "default" : "outline"}
                      onClick={() => onSelectPlan(plan.id, 'monthly')}
                      disabled={processingPlan === plan.id}
                    >
                      {processingPlan === plan.id ? 'Processando...' : 'Assinar Mensal'}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => onSelectPlan(plan.id, '6-monthly')}
                      disabled={processingPlan === plan.id}
                    >
                      Assinar Semestral
                    </Button>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => onSelectPlan(plan.id, 'yearly')}
                      disabled={processingPlan === plan.id}
                    >
                      Assinar Anual
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
