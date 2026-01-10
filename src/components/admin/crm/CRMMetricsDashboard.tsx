import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCRM } from '@/hooks/useCRM';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Heart
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color: string;
}

const MetricCard = ({ title, value, description, icon: Icon, trend, color }: MetricCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trend.value}% vs mês anterior
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CRMMetricsDashboard = () => {
  const { 
    useCRMStats, 
    useDeals, 
    useLeads, 
    useLeadsBySource, 
    useDealsByStage, 
    useMonthlyLeads,
    useEventRegistrationStats,
    useDonationStats,
  } = useCRM();
  
  const { data: stats, isLoading: statsLoading } = useCRMStats();
  const { data: deals } = useDeals();
  const { data: leads } = useLeads();
  const { data: leadsBySource } = useLeadsBySource();
  const { data: dealsByStage } = useDealsByStage();
  const { data: monthlyLeads } = useMonthlyLeads();
  const { data: eventStats } = useEventRegistrationStats();
  const { data: donationStats } = useDonationStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate metrics from real data
  const totalDealsValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const wonDealsValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const averageDealValue = deals?.length ? totalDealsValue / deals.length : 0;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando métricas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads"
          value={stats?.total_leads || 0}
          description={`${stats?.new_leads || 0} novos leads`}
          icon={Users}
          color="bg-blue-500/10 text-blue-500"
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={`${(stats?.conversion_rate || 0).toFixed(1)}%`}
          description={`${stats?.converted_leads || 0} convertidos`}
          icon={Target}
          color="bg-green-500/10 text-green-500"
        />
        
        <MetricCard
          title="Receita em Pipeline"
          value={formatCurrency(totalDealsValue)}
          description={`${deals?.length || 0} negócios ativos`}
          icon={DollarSign}
          color="bg-purple-500/10 text-purple-500"
        />
        
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(averageDealValue)}
          description="Por negócio"
          icon={BarChart3}
          color="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Secondary KPIs - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Calendar className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inscrições em Eventos</p>
                <p className="text-xl font-bold">{eventStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">{eventStats?.confirmed || 0} confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doações</p>
                <p className="text-xl font-bold">{donationStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(donationStats?.totalAmount || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Ganhos</p>
                <p className="text-xl font-bold">{formatCurrency(wonDealsValue)}</p>
                <p className="text-xs text-muted-foreground">{stats?.won_deals || 0} negócios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <UserCheck className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contatos Ativos</p>
                <p className="text-xl font-bold">{leads?.length || 0}</p>
                <p className="text-xs text-muted-foreground">no CRM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Leads Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads por Mês</CardTitle>
            <CardDescription>Evolução de leads nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyLeads || []}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                    name="Leads"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="converted" 
                    stroke="hsl(142, 76%, 36%)" 
                    fill="transparent"
                    name="Convertidos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funil do Pipeline</CardTitle>
            <CardDescription>Negócios por estágio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {dealsByStage && dealsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsByStage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="stage" type="category" width={80} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'value' ? `${value} negócio(s)` : formatCurrency(value),
                        name === 'value' ? 'Quantidade' : 'Valor Total'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {dealsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum negócio no pipeline ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Origem dos Leads</CardTitle>
            <CardDescription>Distribuição por canal de aquisição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {leadsBySource && leadsBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} leads`, 'Quantidade']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum lead registrado ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Pipeline</CardTitle>
            <CardDescription>Status atual dos negócios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dealsByStage && dealsByStage.length > 0 ? (
                dealsByStage.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm">{item.stage}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatCurrency(item.totalValue)})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhum negócio no pipeline
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Receita Total (Ganhos)</span>
                  <span className="font-bold text-green-600">{formatCurrency(wonDealsValue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};