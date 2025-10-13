import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Users, CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FunnelStats {
  stage: string;
  user_count: number;
  avg_hours_in_stage: number;
  completion_rate: number;
}

const STAGE_LABELS: Record<string, string> = {
  signup: 'Cadastro Inicial',
  profile_completed: 'Perfil Completo',
  plan_selected: 'Plano Escolhido',
  payment_pending: 'Pagamento Pendente',
  payment_confirmed: 'Pagamento Confirmado',
  active: 'Usuário Ativo'
};

const STAGE_COLORS: Record<string, string> = {
  signup: 'from-blue-500 to-blue-600',
  profile_completed: 'from-green-500 to-green-600',
  plan_selected: 'from-purple-500 to-purple-600',
  payment_pending: 'from-yellow-500 to-yellow-600',
  payment_confirmed: 'from-teal-500 to-teal-600',
  active: 'from-emerald-500 to-emerald-600'
};

interface JourneyFunnelProps {
  onStageClick?: (stage: string) => void;
}

export const JourneyFunnel = ({ onStageClick }: JourneyFunnelProps) => {
  const { data: funnelStats, isLoading } = useQuery({
    queryKey: ['journey-funnel-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_journey_funnel_stats');
      if (error) throw error;
      return data as FunnelStats[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUsers = funnelStats?.reduce((sum, stat) => sum + stat.user_count, 0) || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Funil de Conversão</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{totalUsers} usuários no total</span>
          </div>
        </div>

        <div className="space-y-4">
          {funnelStats?.map((stat, index) => {
            const percentage = totalUsers > 0 ? (stat.user_count / totalUsers) * 100 : 0;
            const colorClass = STAGE_COLORS[stat.stage] || 'from-gray-500 to-gray-600';

            return (
              <div 
                key={stat.stage}
                className="cursor-pointer transition-all hover:scale-[1.02]"
                onClick={() => onStageClick?.(stat.stage)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{STAGE_LABELS[stat.stage]}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stat.user_count} usuários
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{Math.round(stat.avg_hours_in_stage)}h</span>
                      </div>
                      {stat.completion_rate > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{Math.round(stat.completion_rate)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% do total
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
