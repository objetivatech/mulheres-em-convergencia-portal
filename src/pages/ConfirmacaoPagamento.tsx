import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';

export default function ConfirmacaoPagamento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/confirmacao-pagamento');
      return;
    }

    const checkSubscriptionStatus = async () => {
      try {
        setLoading(true);

        // Buscar assinatura pendente mais recente
        const { data, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (
              name,
              display_name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setSubscription(data);

        // Se a assinatura já foi ativada, redirecionar
        if (data?.status === 'active') {
          setTimeout(() => {
            navigate('/dashboard-empresa?tab=assinatura');
          }, 3000);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
        setError('Não foi possível verificar o status do pagamento.');
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionStatus();

    // Polling a cada 10 segundos para verificar status
    const interval = setInterval(checkSubscriptionStatus, 10000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const getStatusDisplay = () => {
    if (loading) {
      return {
        icon: <Loader2 className="h-16 w-16 animate-spin text-primary" />,
        title: 'Verificando pagamento...',
        description: 'Aguarde enquanto verificamos o status do seu pagamento.',
        variant: 'default' as const,
      };
    }

    if (error || !subscription) {
      return {
        icon: <XCircle className="h-16 w-16 text-destructive" />,
        title: 'Erro ao verificar pagamento',
        description: error || 'Não foi possível encontrar informações sobre sua assinatura.',
        variant: 'destructive' as const,
      };
    }

    switch (subscription.status) {
      case 'active':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: 'Pagamento confirmado! 🎉',
          description: 'Sua assinatura foi ativada com sucesso. Você será redirecionado em instantes...',
          variant: 'default' as const,
        };
      case 'pending':
        return {
          icon: <Clock className="h-16 w-16 text-amber-500" />,
          title: 'Aguardando confirmação de pagamento',
          description: 'Seu pagamento está sendo processado. Isso pode levar alguns minutos. Esta página atualizará automaticamente.',
          variant: 'default' as const,
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: 'Assinatura cancelada',
          description: 'Esta assinatura foi cancelada. Entre em contato com o suporte se precisar de ajuda.',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-muted-foreground" />,
          title: 'Status desconhecido',
          description: 'Não conseguimos identificar o status da sua assinatura.',
          variant: 'default' as const,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {statusDisplay.icon}
              </div>
              <CardTitle className="text-2xl">{statusDisplay.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {statusDisplay.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Plano:</span>
                    <span className="text-sm">
                      {subscription.subscription_plans?.display_name || subscription.subscription_plans?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Ciclo de cobrança:</span>
                    <span className="text-sm capitalize">{subscription.billing_cycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm capitalize">
                      {subscription.status === 'pending' ? 'Pendente' : 
                       subscription.status === 'active' ? 'Ativo' : 
                       subscription.status === 'cancelled' ? 'Cancelado' : 
                       subscription.status}
                    </span>
                  </div>
                  {subscription.external_subscription_id && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">ID do pagamento:</span>
                      <span className="text-sm font-mono text-xs">
                        {subscription.external_subscription_id}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard-empresa')}
                >
                  Ir para Painel
                </Button>
                {subscription?.status === 'pending' && (
                  <Button
                    variant="default"
                    onClick={() => window.location.reload()}
                  >
                    Atualizar Status
                  </Button>
                )}
              </div>

              {subscription?.status === 'pending' && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>💡 Dica: Esta página atualiza automaticamente a cada 10 segundos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {subscription?.status === 'pending' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">O que fazer enquanto aguarda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>✓ Pagamentos via PIX são confirmados em até 5 minutos</p>
                <p>✓ Pagamentos via boleto podem levar até 2 dias úteis</p>
                <p>✓ Você receberá um email quando o pagamento for confirmado</p>
                <p className="text-muted-foreground">
                  Se o pagamento não for confirmado em até 24h, entre em contato com nosso suporte.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
