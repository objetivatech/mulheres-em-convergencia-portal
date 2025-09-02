import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Crown, 
  Star, 
  TrendingUp,
  Calendar,
  Coins,
  Rocket,
  Award,
  Target
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoostManagerProps {
  businessId: string;
  currentPlan?: string;
}

interface PremiumFeature {
  feature_name: string;
  display_name: string;
  description: string;
  required_plan: string;
  credits_cost: number;
}

interface BusinessCredits {
  credits_balance: number;
  credits_spent: number;
  credits_earned: number;
}

interface ActiveBoost {
  boost_type: string;
  expires_at: string;
  active: boolean;
}

const BoostManager: React.FC<BoostManagerProps> = ({ businessId, currentPlan = 'iniciante' }) => {
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [businessCredits, setBusinessCredits] = useState<BusinessCredits | null>(null);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch premium features
      const { data: features, error: featuresError } = await supabase
        .from('premium_features')
        .select('*')
        .eq('active', true);
      
      if (featuresError) throw featuresError;
      setPremiumFeatures(features || []);

      // Fetch business credits
      const { data: credits, error: creditsError } = await supabase
        .from('business_credits')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();
      
      if (creditsError && creditsError.code !== 'PGRST116') throw creditsError;
      setBusinessCredits(credits);

      // Fetch active boosts
      const { data: boosts, error: boostsError } = await supabase
        .rpc('get_business_boosts', { business_uuid: businessId });
      
      if (boostsError) throw boostsError;
      setActiveBoosts(boosts || []);
      
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

  const purchaseBoost = async (featureName: string, duration: string) => {
    if (!businessCredits) {
      toast({
        title: 'Erro',
        description: 'Dados de crédito não encontrados',
        variant: 'destructive'
      });
      return;
    }

    const feature = premiumFeatures.find(f => f.feature_name === featureName);
    if (!feature) return;

    const durationMultiplier = duration === '7d' ? 1 : duration === '30d' ? 3 : 10;
    const totalCost = feature.credits_cost * durationMultiplier;

    if (businessCredits.credits_balance < totalCost) {
      toast({
        title: 'Créditos Insuficientes',
        description: `Você precisa de ${totalCost} créditos. Saldo atual: ${businessCredits.credits_balance}`,
        variant: 'destructive'
      });
      return;
    }

    setPurchasing(featureName);

    try {
      const expiresAt = duration === '7d' 
        ? addDays(new Date(), 7)
        : duration === '30d' 
        ? addMonths(new Date(), 1)
        : addMonths(new Date(), 3);

      // Create boost
      const { error: boostError } = await supabase
        .from('business_boosts')
        .insert({
          business_id: businessId,
          boost_type: featureName,
          expires_at: expiresAt.toISOString(),
          cost_credits: totalCost,
          active: true
        });

      if (boostError) throw boostError;

      // Update credits
      const { error: creditsError } = await supabase
        .from('business_credits')
        .update({
          credits_balance: businessCredits.credits_balance - totalCost,
          credits_spent: businessCredits.credits_spent + totalCost
        })
        .eq('business_id', businessId);

      if (creditsError) throw creditsError;

      toast({
        title: 'Boost Ativado!',
        description: `${feature.display_name} foi ativado com sucesso`,
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Erro ao comprar boost:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o boost',
        variant: 'destructive'
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getFeatureIcon = (featureName: string) => {
    switch (featureName) {
      case 'featured_listing':
        return <Star className="h-5 w-5" />;
      case 'premium_badge':
        return <Award className="h-5 w-5" />;
      case 'homepage_spotlight':
        return <Crown className="h-5 w-5" />;
      case 'analytics_advanced':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const isFeatureAvailable = (requiredPlan: string) => {
    const planHierarchy = { 'iniciante': 1, 'intermediario': 2, 'master': 3 };
    const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 1;
    const requiredLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 1;
    return currentLevel >= requiredLevel;
  };

  const isBoostActive = (featureName: string) => {
    return activeBoosts.some(boost => boost.boost_type === featureName && boost.active);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recursos Premium</h2>
          <p className="text-muted-foreground">
            Impulsione a visibilidade do seu negócio
          </p>
        </div>
      </div>

      {/* Credits Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span>Saldo de Créditos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{businessCredits?.credits_balance || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {businessCredits?.credits_spent || 0} créditos gastos
              </p>
            </div>
            <Button variant="outline">
              Comprar Créditos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Boosts */}
      {activeBoosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Boosts Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeBoosts.map((boost, index) => {
                const feature = premiumFeatures.find(f => f.feature_name === boost.boost_type);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-primary">
                        {getFeatureIcon(boost.boost_type)}
                      </div>
                      <div>
                        <div className="font-medium">{feature?.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Expira em {format(new Date(boost.expires_at), 'dd MMM yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Features */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Recursos Disponíveis</h3>
        
        {premiumFeatures.map((feature) => {
          const isAvailable = isFeatureAvailable(feature.required_plan);
          const isActive = isBoostActive(feature.feature_name);
          
          return (
            <Card key={feature.feature_name} className={`${!isAvailable ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="text-primary">
                      {getFeatureIcon(feature.feature_name)}
                    </div>
                    <span>{feature.display_name}</span>
                    {isActive && <Badge className="bg-green-100 text-green-800">Ativo</Badge>}
                  </CardTitle>
                  <Badge variant="outline">
                    {feature.credits_cost} créditos
                  </Badge>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Requer plano: <Badge variant="secondary">{feature.required_plan}</Badge>
                  </div>
                  
                  {isAvailable && !isActive && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Rocket className="h-4 w-4 mr-2" />
                          Ativar Boost
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ativar {feature.display_name}</DialogTitle>
                          <DialogDescription>
                            Escolha a duração do boost. O custo será multiplicado pela duração.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            <Button
                              onClick={() => purchaseBoost(feature.feature_name, '7d')}
                              disabled={purchasing === feature.feature_name}
                              className="justify-between"
                            >
                              <span>7 dias</span>
                              <span>{feature.credits_cost} créditos</span>
                            </Button>
                            <Button
                              onClick={() => purchaseBoost(feature.feature_name, '30d')}
                              disabled={purchasing === feature.feature_name}
                              className="justify-between"
                            >
                              <span>30 dias</span>
                              <span>{feature.credits_cost * 3} créditos</span>
                            </Button>
                            <Button
                              onClick={() => purchaseBoost(feature.feature_name, '90d')}
                              disabled={purchasing === feature.feature_name}
                              className="justify-between"
                            >
                              <span>90 dias</span>
                              <span>{feature.credits_cost * 10} créditos</span>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {!isAvailable && (
                    <Button size="sm" variant="outline" disabled>
                      Upgrade Necessário
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BoostManager;