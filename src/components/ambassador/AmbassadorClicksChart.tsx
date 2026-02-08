import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AmbassadorClick } from '@/hooks/useAmbassador';

interface AmbassadorClicksChartProps {
  clicks: AmbassadorClick[];
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

export const AmbassadorClicksChart = ({ clicks, isLoading }: AmbassadorClicksChartProps) => {
  // Agrupar cliques por dia (últimos 30 dias)
  const dailyData = useMemo(() => {
    const last30Days = new Array(30).fill(null).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const clicksByDay: Record<string, number> = {};
    last30Days.forEach(day => { clicksByDay[day] = 0; });

    clicks?.forEach(click => {
      const day = click.created_at.split('T')[0];
      if (clicksByDay[day] !== undefined) {
        clicksByDay[day]++;
      }
    });

    return last30Days.map(day => ({
      date: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      cliques: clicksByDay[day],
    }));
  }, [clicks]);

  // Agrupar por fonte UTM
  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    
    clicks?.forEach(click => {
      const source = click.utm_source || 'Direto';
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [clicks]);

  // Agrupar por mídia UTM
  const mediumData = useMemo(() => {
    const mediums: Record<string, number> = {};
    
    clicks?.forEach(click => {
      const medium = click.utm_medium || 'Orgânico';
      mediums[medium] = (mediums[medium] || 0) + 1;
    });

    return Object.entries(mediums)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [clicks]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!clicks || clicks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics de Cliques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sem dados de cliques ainda.</p>
            <p className="text-sm">Compartilhe seu link para ver as estatísticas!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics de Cliques
        </CardTitle>
        <CardDescription>
          Visualize a performance dos seus links nos últimos 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
            <TabsTrigger value="sources">Origens</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="cliques" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Cliques"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-4">Por Origem (utm_source)</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {sourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Por Mídia (utm_medium)</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mediumData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {mediumData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
