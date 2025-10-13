import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Clock, Target } from 'lucide-react';

interface AdvancedMetrics {
  date: string;
  journey_stage: string;
  users_entered: number;
  users_completed: number;
  users_abandoned: number;
  conversion_rate: number;
  avg_time_hours: number;
}

const JOURNEY_STAGES = [
  { value: 'all', label: 'Todos os Estágios' },
  { value: 'signup', label: 'Cadastro Inicial' },
  { value: 'profile_completed', label: 'Perfil Completo' },
  { value: 'plan_selected', label: 'Plano Selecionado' },
  { value: 'payment_pending', label: 'Pagamento Pendente' },
  { value: 'payment_confirmed', label: 'Pagamento Confirmado' },
  { value: 'active', label: 'Ativo' }
];

export const AdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedStage, setSelectedStage] = useState('all');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['advanced-analytics', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data, error } = await supabase
        .rpc('get_advanced_journey_analytics', {
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
      return data as AdvancedMetrics[];
    }
  });

  const filteredData = selectedStage === 'all' 
    ? analyticsData 
    : analyticsData?.filter(d => d.journey_stage === selectedStage);

  // Agregar dados por data
  const dailyData = filteredData?.reduce((acc, curr) => {
    const existing = acc.find(d => d.date === curr.date);
    if (existing) {
      existing.users_entered += curr.users_entered;
      existing.users_completed += curr.users_completed;
      existing.users_abandoned += curr.users_abandoned;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as AdvancedMetrics[]);

  // Calcular métricas resumidas
  const totalEntered = filteredData?.reduce((sum, d) => sum + d.users_entered, 0) || 0;
  const totalCompleted = filteredData?.reduce((sum, d) => sum + d.users_completed, 0) || 0;
  const totalAbandoned = filteredData?.reduce((sum, d) => sum + d.users_abandoned, 0) || 0;
  const avgConversionRate = filteredData?.length 
    ? (filteredData.reduce((sum, d) => sum + d.conversion_rate, 0) / filteredData.length).toFixed(2)
    : 0;
  const avgTimeHours = filteredData?.length
    ? (filteredData.reduce((sum, d) => sum + d.avg_time_hours, 0) / filteredData.length).toFixed(1)
    : 0;

  if (isLoading) {
    return <div className="text-center py-8">Carregando analytics avançado...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avançado</h2>
          <p className="text-muted-foreground">Métricas detalhadas da jornada do cliente</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOURNEY_STAGES.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Entraram</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntered}</div>
            <p className="text-xs text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completaram</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {totalEntered > 0 ? `${((totalCompleted / totalEntered) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandonaram</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAbandoned}</div>
            <p className="text-xs text-muted-foreground">
              {totalEntered > 0 ? `${((totalAbandoned / totalEntered) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground">Média do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeHours}h</div>
            <p className="text-xs text-muted-foreground">Por estágio</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Usuários por Data</CardTitle>
          <CardDescription>Visualização temporal do fluxo de usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users_entered" 
                stroke="hsl(var(--primary))" 
                name="Entraram"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="users_completed" 
                stroke="hsl(var(--secondary))" 
                name="Completaram"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="users_abandoned" 
                stroke="hsl(var(--destructive))" 
                name="Abandonaram"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Taxa de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão por Estágio</CardTitle>
          <CardDescription>Performance de conversão em cada etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData?.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="journey_stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversion_rate" fill="hsl(var(--primary))" name="Taxa de Conversão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
