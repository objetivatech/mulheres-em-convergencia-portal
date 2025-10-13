import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, Clock, Users, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const JourneyAnalytics = () => {
  const { data: funnelStats, isLoading } = useQuery({
    queryKey: ['journey-funnel-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_journey_funnel_stats');
      if (error) throw error;
      return data as any[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUsers = funnelStats?.reduce((sum: number, stat: any) => sum + stat.user_count, 0) || 0;
  const activeUsers = funnelStats?.find((s: any) => s.stage === 'active')?.user_count || 0;
  const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  const avgTimeToActive = funnelStats?.reduce((sum: number, stat: any) => sum + (stat.avg_hours_in_stage * stat.user_count), 0) / totalUsers || 0;

  const pendingPayments = funnelStats?.find((s: any) => s.stage === 'payment_pending')?.user_count || 0;
  const stuckUsers = funnelStats?.filter((s: any) => s.avg_hours_in_stage > 48).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-bold">{Math.round(avgTimeToActive)}h</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Necessitam Atenção</p>
              <p className="text-2xl font-bold">{stuckUsers}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-6">Análise Detalhada por Estágio</h3>
        <div className="space-y-6">
          {funnelStats?.map((stat: any) => {
            const dropoffRate = totalUsers > 0 
              ? ((totalUsers - stat.user_count) / totalUsers) * 100 
              : 0;

            return (
              <div key={stat.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    {stat.stage === 'signup' && 'Cadastro Inicial'}
                    {stat.stage === 'profile_completed' && 'Perfil Completo'}
                    {stat.stage === 'plan_selected' && 'Plano Escolhido'}
                    {stat.stage === 'payment_pending' && 'Pagamento Pendente'}
                    {stat.stage === 'payment_confirmed' && 'Pagamento Confirmado'}
                    {stat.stage === 'active' && 'Usuário Ativo'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {stat.user_count} usuários
                    </span>
                    <span className="text-muted-foreground">
                      ~{Math.round(stat.avg_hours_in_stage)}h média
                    </span>
                  </div>
                </div>
                <Progress value={(stat.user_count / totalUsers) * 100} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Taxa de drop-off: {dropoffRate.toFixed(1)}%</span>
                  <span>Taxa de conclusão: {stat.completion_rate?.toFixed(1) || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {pendingPayments > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Atenção: {pendingPayments} Pagamentos Pendentes
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Há usuários que iniciaram o processo de pagamento mas não finalizaram. 
                Considere enviar lembretes para estimular a conclusão.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
