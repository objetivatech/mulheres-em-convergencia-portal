import { Card, CardContent } from '@/components/ui/card';
import { Crown, Users, MousePointerClick, TrendingUp, DollarSign, Clock, Percent, UserPlus } from 'lucide-react';
import { AdminAmbassadorStats as StatsType } from '@/hooks/useAmbassadorAdmin';

interface AdminAmbassadorStatsProps {
  stats: StatsType | null;
  isLoading?: boolean;
}

export const AdminAmbassadorStats = ({ stats, isLoading }: AdminAmbassadorStatsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statCards = [
    {
      title: 'Total Embaixadoras',
      value: stats?.totalAmbassadors ?? 0,
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: 'Ativas',
      value: stats?.activeAmbassadors ?? 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Total de Cliques',
      value: stats?.totalClicks?.toLocaleString('pt-BR') ?? '0',
      icon: MousePointerClick,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total de Conversões',
      value: stats?.totalConversions?.toLocaleString('pt-BR') ?? '0',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Comissões Pagas',
      value: formatCurrency(stats?.totalCommissionsPaid ?? 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'Comissões Pendentes',
      value: formatCurrency(stats?.totalPendingCommissions ?? 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Taxa Conversão Média',
      value: `${(stats?.avgConversionRate ?? 0).toFixed(1)}%`,
      icon: Percent,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'Novas Este Mês',
      value: stats?.thisMonthNewAmbassadors ?? 0,
      icon: UserPlus,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
