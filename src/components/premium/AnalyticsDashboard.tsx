import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  MousePointer, 
  Phone, 
  Star, 
  Search, 
  MapPin,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsData {
  date: string;
  views_count: number;
  clicks_count: number;
  contacts_count: number;
  reviews_count: number;
  search_appearances: number;
  map_clicks: number;
}

interface AnalyticsDashboardProps {
  businessId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ businessId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [businessId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('business_analytics')
        .select('*')
        .eq('business_id', businessId)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return analyticsData.reduce((acc, day) => ({
      views: acc.views + day.views_count,
      clicks: acc.clicks + day.clicks_count,
      contacts: acc.contacts + day.contacts_count,
      reviews: acc.reviews + day.reviews_count,
      searches: acc.searches + day.search_appearances,
      mapClicks: acc.mapClicks + day.map_clicks
    }), { views: 0, clicks: 0, contacts: 0, reviews: 0, searches: 0, mapClicks: 0 });
  };

  const calculateGrowth = (metric: keyof AnalyticsData) => {
    if (analyticsData.length < 2) return 0;
    
    const midPoint = Math.floor(analyticsData.length / 2);
    const firstHalf = analyticsData.slice(0, midPoint);
    const secondHalf = analyticsData.slice(midPoint);
    
    const firstSum = firstHalf.reduce((sum, day) => sum + (day[metric] as number), 0);
    const secondSum = secondHalf.reduce((sum, day) => sum + (day[metric] as number), 0);
    
    if (firstSum === 0) return secondSum > 0 ? 100 : 0;
    return ((secondSum - firstSum) / firstSum) * 100;
  };

  const totals = calculateTotals();
  
  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    growth, 
    description 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    growth: number; 
    description: string; 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {growth >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={growth >= 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(growth).toFixed(1)}%
          </span>
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avançado</h2>
          <p className="text-muted-foreground">
            Dados detalhados de performance do seu negócio
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <TabsList>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Visualizações"
          value={totals.views}
          icon={Eye}
          growth={calculateGrowth('views_count')}
          description="vs período anterior"
        />
        <MetricCard
          title="Cliques no Site"
          value={totals.clicks}
          icon={MousePointer}
          growth={calculateGrowth('clicks_count')}
          description="vs período anterior"
        />
        <MetricCard
          title="Contatos"
          value={totals.contacts}
          icon={Phone}
          growth={calculateGrowth('contacts_count')}
          description="vs período anterior"
        />
        <MetricCard
          title="Avaliações"
          value={totals.reviews}
          icon={Star}
          growth={calculateGrowth('reviews_count')}
          description="vs período anterior"
        />
        <MetricCard
          title="Aparições na Busca"
          value={totals.searches}
          icon={Search}
          growth={calculateGrowth('search_appearances')}
          description="vs período anterior"
        />
        <MetricCard
          title="Cliques no Mapa"
          value={totals.mapClicks}
          icon={MapPin}
          growth={calculateGrowth('map_clicks')}
          description="vs período anterior"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Performance</CardTitle>
              <CardDescription>
                Principais métricas dos últimos {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '90 dias'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Cliques</span>
                  <span className="text-sm text-muted-foreground">
                    {totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <Progress 
                  value={totals.views > 0 ? (totals.clicks / totals.views) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Contato</span>
                  <span className="text-sm text-muted-foreground">
                    {totals.views > 0 ? ((totals.contacts / totals.views) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <Progress 
                  value={totals.views > 0 ? (totals.contacts / totals.views) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Engajamento</CardTitle>
              <CardDescription>
                Como os usuários interagem com seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(new Date(day.date), 'dd MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span>{day.views_count} views</span>
                      <span>{day.clicks_count} cliques</span>
                      <span>{day.contacts_count} contatos</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>
                Jornada do usuário desde a visualização até o contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <span className="font-medium">Visualizações</span>
                  </div>
                  <Badge variant="secondary">{totals.views}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MousePointer className="h-5 w-5 text-secondary" />
                    <span className="font-medium">Cliques no Site</span>
                  </div>
                  <Badge variant="secondary">{totals.clicks}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Contatos Realizados</span>
                  </div>
                  <Badge className="bg-green-600">{totals.contacts}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;