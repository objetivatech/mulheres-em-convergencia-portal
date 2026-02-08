import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MousePointerClick, 
  Users, 
  Percent, 
  DollarSign, 
  Clock, 
  TrendingUp,
  CalendarCheck,
  Target
} from 'lucide-react';
import { AmbassadorStats } from '@/hooks/useAmbassador';

interface AmbassadorStatsCardsProps {
  stats: AmbassadorStats;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'A definir';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

export const AmbassadorStatsCards = ({ stats, isLoading }: AmbassadorStatsCardsProps) => {
  const mainCards = [
    {
      title: 'Total de Cliques',
      value: stats.totalClicks.toLocaleString('pt-BR'),
      icon: MousePointerClick,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Conversões',
      value: stats.totalConversions.toLocaleString('pt-BR'),
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Taxa de Conversão',
      value: formatPercent(stats.conversionRate),
      icon: Percent,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Total Ganho',
      value: formatCurrency(stats.totalEarnings),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  const secondaryCards = [
    {
      title: 'Comissão Pendente',
      value: formatCurrency(stats.pendingCommission),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Ganhos Este Mês',
      value: formatCurrency(stats.thisMonthEarnings),
      icon: TrendingUp,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(stats.averageTicket),
      icon: Target,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'Próximo Pagamento',
      value: formatDate(stats.nextPayoutDate),
      icon: CalendarCheck,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cards secundários */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
