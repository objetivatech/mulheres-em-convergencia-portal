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
  Percent,
  Clock
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
  Legend
} from 'recharts';

// Mock data for charts (in production, this would come from the database)
const conversionFunnelData = [
  { stage: 'Leads', value: 100, fill: 'hsl(var(--chart-1))' },
  { stage: 'Contatados', value: 75, fill: 'hsl(var(--chart-2))' },
  { stage: 'Propostas', value: 45, fill: 'hsl(var(--chart-3))' },
  { stage: 'Negociação', value: 30, fill: 'hsl(var(--chart-4))' },
  { stage: 'Fechados', value: 20, fill: 'hsl(var(--chart-5))' },
];

const monthlyRevenueData = [
  { month: 'Jan', receita: 4500, meta: 5000 },
  { month: 'Fev', receita: 5200, meta: 5000 },
  { month: 'Mar', receita: 4800, meta: 5500 },
  { month: 'Abr', receita: 6100, meta: 5500 },
  { month: 'Mai', receita: 5800, meta: 6000 },
  { month: 'Jun', receita: 7200, meta: 6000 },
];

const sourceDistribution = [
  { name: 'Website', value: 35, fill: '#8884d8' },
  { name: 'Eventos', value: 25, fill: '#82ca9d' },
  { name: 'Indicação', value: 20, fill: '#ffc658' },
  { name: 'Redes Sociais', value: 15, fill: '#ff7300' },
  { name: 'Outros', value: 5, fill: '#a4de6c' },
];

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
  const { useCRMStats, useDeals, useLeads } = useCRM();
  const { data: stats, isLoading: statsLoading } = useCRMStats();
  const { data: deals } = useDeals();
  const { data: leads } = useLeads();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate metrics
  const totalDealsValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const wonDealsValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const averageDealValue = deals?.length ? totalDealsValue / deals.length : 0;
  
  // Mock CAC and LTV (in production, calculate from actual data)
  const cac = 150; // Cost per acquisition
  const ltv = 1200; // Lifetime value
  const ltvCacRatio = ltv / cac;
  const churnRate = 5.2; // Monthly churn %

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
          description={`${stats?.new_leads || 0} novos este mês`}
          icon={Users}
          trend={{ value: 12, positive: true }}
          color="bg-blue-500/10 text-blue-500"
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={`${(stats?.conversion_rate || 0).toFixed(1)}%`}
          description="Leads → Clientes"
          icon={Target}
          trend={{ value: 3.5, positive: true }}
          color="bg-green-500/10 text-green-500"
        />
        
        <MetricCard
          title="Receita em Pipeline"
          value={formatCurrency(totalDealsValue)}
          description={`${deals?.length || 0} negócios ativos`}
          icon={DollarSign}
          trend={{ value: 18, positive: true }}
          color="bg-purple-500/10 text-purple-500"
        />
        
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(averageDealValue)}
          description="Por negócio"
          icon={BarChart3}
          trend={{ value: 5, positive: true }}
          color="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Percent className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Churn Rate</p>
                <p className="text-xl font-bold">{churnRate}%</p>
                <p className="text-xs text-muted-foreground">mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CAC</p>
                <p className="text-xl font-bold">{formatCurrency(cac)}</p>
                <p className="text-xs text-muted-foreground">por cliente</p>
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
                <p className="text-xs text-muted-foreground">LTV</p>
                <p className="text-xl font-bold">{formatCurrency(ltv)}</p>
                <p className="text-xs text-muted-foreground">valor vitalício</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <UserCheck className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">LTV:CAC</p>
                <p className="text-xl font-bold">{ltvCacRatio.toFixed(1)}x</p>
                <p className="text-xs text-green-500">Saudável (&gt;3x)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Mensal</CardTitle>
            <CardDescription>Comparativo receita vs meta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorReceita)" 
                    name="Receita"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="Meta"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funil de Conversão</CardTitle>
            <CardDescription>Leads por estágio do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionFunnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="stage" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {conversionFunnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
              {[
                { label: 'Leads Novos', count: stats?.new_leads || 0, color: 'bg-gray-500' },
                { label: 'Em Negociação', count: deals?.filter(d => d.stage === 'negotiation').length || 0, color: 'bg-yellow-500' },
                { label: 'Propostas Enviadas', count: deals?.filter(d => d.stage === 'proposal').length || 0, color: 'bg-purple-500' },
                { label: 'Negócios Ganhos', count: stats?.won_deals || 0, color: 'bg-green-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
              
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
