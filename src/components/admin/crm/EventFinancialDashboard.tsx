import React, { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10B981', '#F59E0B'];

export const EventFinancialDashboard: React.FC = () => {
  const [period, setPeriod] = useState('6');
  const events = useEvents();
  const { data: eventsList } = events.useEventsList();

  // Fetch financial metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['event-financial-metrics', period],
    queryFn: async () => {
      const monthsAgo = parseInt(period);
      const startDate = startOfMonth(subMonths(new Date(), monthsAgo - 1));

      // Get all registrations with payment info
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('*, event:events(title, price, free)')
        .gte('created_at', startDate.toISOString());

      // Get events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, price, free, current_participants')
        .eq('free', false)
        .gte('date_start', startDate.toISOString());

      // Calculate revenue by event
      const revenueByEvent: Record<string, { name: string; revenue: number; registrations: number }> = {};
      
      registrations?.forEach(reg => {
        if (reg.paid && reg.payment_amount) {
          const eventTitle = (reg.event as any)?.title || 'Desconhecido';
          if (!revenueByEvent[eventTitle]) {
            revenueByEvent[eventTitle] = { name: eventTitle, revenue: 0, registrations: 0 };
          }
          revenueByEvent[eventTitle].revenue += reg.payment_amount - (reg.discount_applied || 0);
          revenueByEvent[eventTitle].registrations += 1;
        }
      });

      // Calculate monthly revenue
      const monthlyRevenue: Record<string, number> = {};
      for (let i = 0; i < monthsAgo; i++) {
        const month = subMonths(new Date(), i);
        const monthKey = format(month, 'MMM/yy', { locale: ptBR });
        monthlyRevenue[monthKey] = 0;
      }

      registrations?.forEach(reg => {
        if (reg.paid && reg.payment_amount) {
          const monthKey = format(new Date(reg.created_at), 'MMM/yy', { locale: ptBR });
          if (monthlyRevenue[monthKey] !== undefined) {
            monthlyRevenue[monthKey] += reg.payment_amount - (reg.discount_applied || 0);
          }
        }
      });

      // Payment conversion stats
      const totalRegistrations = registrations?.length || 0;
      const paidRegistrations = registrations?.filter(r => r.paid).length || 0;
      const pendingRegistrations = registrations?.filter(r => !r.paid && !r.event?.free).length || 0;
      const freeRegistrations = registrations?.filter(r => r.event?.free).length || 0;

      const totalRevenue = Object.values(revenueByEvent).reduce((sum, e) => sum + e.revenue, 0);
      const avgTicket = paidRegistrations > 0 ? totalRevenue / paidRegistrations : 0;

      return {
        revenueByEvent: Object.values(revenueByEvent).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
        monthlyRevenue: Object.entries(monthlyRevenue)
          .map(([month, revenue]) => ({ month, revenue }))
          .reverse(),
        paymentStats: [
          { name: 'Pagos', value: paidRegistrations, color: '#10B981' },
          { name: 'Pendentes', value: pendingRegistrations, color: '#F59E0B' },
          { name: 'Gratuitos', value: freeRegistrations, color: '#6B7280' },
        ],
        summary: {
          totalRevenue,
          avgTicket,
          totalRegistrations,
          paidRegistrations,
          conversionRate: totalRegistrations > 0 
            ? (paidRegistrations / (paidRegistrations + pendingRegistrations)) * 100 
            : 0,
        },
      };
    },
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return <div className="p-6">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Dashboard Financeiro de Eventos
        </h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">{formatCurrency(metrics?.summary.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">{formatCurrency(metrics?.summary.avgTicket || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inscrições Pagas</p>
                <p className="text-xl font-bold">{metrics?.summary.paidRegistrations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-xl font-bold">{(metrics?.summary.conversionRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} 
                    className="text-xs" 
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.paymentStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics?.paymentStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.revenueByEvent || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs"
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Receita' : 'Inscrições'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
