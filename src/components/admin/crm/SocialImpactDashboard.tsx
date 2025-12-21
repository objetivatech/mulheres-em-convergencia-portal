import { useState } from 'react';
import { Users, Calendar, DollarSign, Building2, TrendingUp, Clock, Target, Award, Download, Plus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSocialImpact, SocialImpactMetric } from '@/hooks/useSocialImpact';
import { useCRM } from '@/hooks/useCRM';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const METRIC_TYPES = [
  { value: 'beneficiaries', label: 'Beneficiários', unit: 'pessoas' },
  { value: 'employment', label: 'Emprego/Renda', unit: 'pessoas' },
  { value: 'education', label: 'Educação', unit: 'pessoas' },
  { value: 'health', label: 'Saúde', unit: 'atendimentos' },
  { value: 'environment', label: 'Meio Ambiente', unit: 'ações' },
  { value: 'community', label: 'Comunidade', unit: 'participações' },
  { value: 'financial', label: 'Financeiro', unit: 'R$' },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

export const SocialImpactDashboard = () => {
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchCPF, setSearchCPF] = useState('');
  
  const { 
    useMetricsList, 
    useCreateMetric, 
    useVerifyMetric,
    useImpactStats,
    useJourneyByCPF,
    useExportLeads,
    useExportDonations,
    useExportEvents,
    useExportMetrics,
  } = useSocialImpact();

  const { useCostCenters } = useCRM();

  const { data: metrics, isLoading: metricsLoading } = useMetricsList(
    selectedType !== 'all' ? { metric_type: selectedType } : undefined
  );
  const { data: stats, isLoading: statsLoading } = useImpactStats();
  const { data: costCenters } = useCostCenters();
  const { data: journey, isLoading: journeyLoading } = useJourneyByCPF(searchCPF.length >= 11 ? searchCPF : null);

  const createMetric = useCreateMetric();
  const verifyMetric = useVerifyMetric();
  const exportLeads = useExportLeads();
  const exportDonations = useExportDonations();
  const exportEvents = useExportEvents();
  const exportMetrics = useExportMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleCreateMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createMetric.mutateAsync({
        metric_type: formData.get('metric_type') as string,
        metric_name: formData.get('metric_name') as string,
        value: Number(formData.get('value')),
        unit: formData.get('unit') as string,
        period_start: formData.get('period_start') as string,
        period_end: formData.get('period_end') as string,
        cost_center_id: formData.get('cost_center_id') as string || null,
        project: formData.get('project') as string || null,
        source: formData.get('source') as string || null,
        notes: formData.get('notes') as string || null,
      });
      toast.success('Métrica registrada com sucesso');
      setShowMetricForm(false);
    } catch (error) {
      toast.error('Erro ao registrar métrica');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await verifyMetric.mutateAsync(id);
      toast.success('Métrica verificada');
    } catch (error) {
      toast.error('Erro ao verificar métrica');
    }
  };

  // Aggregate metrics by type for chart
  const metricsByType = METRIC_TYPES.map(type => ({
    name: type.label,
    value: metrics?.filter(m => m.metric_type === type.value).reduce((sum, m) => sum + m.value, 0) || 0,
  })).filter(m => m.value > 0);

  // Monthly trend data (mock - in production, aggregate from real data)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      beneficiarios: Math.floor(Math.random() * 100) + 50,
      eventos: Math.floor(Math.random() * 10) + 5,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impacto Social</h2>
          <p className="text-muted-foreground">Métricas e indicadores de transformação social</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showMetricForm} onOpenChange={setShowMetricForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Métrica
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Métrica de Impacto</DialogTitle>
                <DialogDescription>
                  Registre um indicador de impacto social
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMetric} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metric_type">Tipo</Label>
                    <Select name="metric_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metric_name">Nome da Métrica</Label>
                    <Input name="metric_name" placeholder="Ex: Mulheres capacitadas" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor</Label>
                    <Input name="value" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Input name="unit" placeholder="pessoas, R$, etc" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_start">Início do Período</Label>
                    <Input name="period_start" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_end">Fim do Período</Label>
                    <Input name="period_end" type="date" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_center_id">Centro de Custo</Label>
                  <Select name="cost_center_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters?.map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projeto</Label>
                  <Input name="project" placeholder="Nome do projeto" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Fonte dos Dados</Label>
                  <Input name="source" placeholder="Ex: Relatório interno, Pesquisa" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea name="notes" placeholder="Notas adicionais..." />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowMetricForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMetric.isPending}>
                    {createMetric.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beneficiários</p>
                <p className="text-2xl font-bold">{stats?.total_beneficiaries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eventos Realizados</p>
                <p className="text-2xl font-bold">{stats?.total_events || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doações</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_donations_value || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Building2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patrocinadores</p>
                <p className="text-2xl font-bold">{stats?.total_sponsors || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{stats?.conversion_rate.toFixed(1) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dias até Conversão</p>
                <p className="text-2xl font-bold">{stats?.avg_days_to_conversion || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Leads Convertidos</p>
                <p className="text-2xl font-bold">{stats?.converted_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Leads Ativos</p>
                <p className="text-2xl font-bold">{stats?.active_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="journey">Jornada por CPF</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Metrics by Type Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impacto por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {metricsByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="beneficiarios" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Beneficiários" />
                      <Area type="monotone" dataKey="eventos" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Eventos" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Métricas Registradas</CardTitle>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {METRIC_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <p>Carregando...</p>
              ) : metrics?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma métrica registrada</p>
              ) : (
                <div className="space-y-3">
                  {metrics?.slice(0, 10).map(metric => (
                    <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{metric.metric_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {METRIC_TYPES.find(t => t.value === metric.metric_type)?.label} · 
                            {format(new Date(metric.period_start), ' MMM yyyy', { locale: ptBR })} - 
                            {format(new Date(metric.period_end), ' MMM yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold">{metric.value.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-muted-foreground">{metric.unit}</p>
                        </div>
                        {metric.verified ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleVerify(metric.id)}>
                            Verificar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journey by CPF Tab */}
        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buscar Jornada por CPF</CardTitle>
              <CardDescription>
                Visualize toda a trajetória de uma pessoa desde o primeiro contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Digite o CPF (apenas números)"
                    value={searchCPF}
                    onChange={(e) => setSearchCPF(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                  />
                </div>
              </div>

              {journeyLoading && <p>Carregando jornada...</p>}
              
              {journey && (
                <div className="space-y-6 mt-6">
                  {/* Person Info */}
                  <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold">{journey.full_name}</h3>
                      <p className="text-muted-foreground">{journey.email}</p>
                      <p className="text-sm text-muted-foreground">CPF: {journey.cpf}</p>
                    </div>
                    <Badge variant={journey.is_converted ? 'default' : 'secondary'}>
                      {journey.is_converted ? 'Convertido' : 'Lead'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{journey.total_interactions}</p>
                      <p className="text-sm text-muted-foreground">Interações</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{journey.total_events_attended}</p>
                      <p className="text-sm text-muted-foreground">Eventos</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{journey.total_donations}</p>
                      <p className="text-sm text-muted-foreground">Doações</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{formatCurrency(journey.total_value_paid)}</p>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-semibold mb-4">Linha do Tempo</h4>
                    <div className="relative border-l-2 border-primary/20 pl-6 space-y-4">
                      {journey.activities.map((activity, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-primary" />
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{activity.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(activity.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  {activity.type === 'event' ? 'Evento' : activity.type === 'donation' ? 'Doação' : 'Interação'}
                                </Badge>
                                {activity.paid && <Badge>Pago</Badge>}
                                {activity.online && <Badge variant="secondary">Online</Badge>}
                              </div>
                            </div>
                            {activity.value && (
                              <p className="text-sm mt-1 text-green-600">{formatCurrency(activity.value)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {searchCPF.length >= 11 && !journey && !journeyLoading && (
                <p className="text-muted-foreground text-center py-8">Nenhum registro encontrado para este CPF</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exportar Dados</CardTitle>
              <CardDescription>
                Baixe os dados em formato CSV para análise externa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => exportLeads.mutate()}
                  disabled={exportLeads.isPending}
                >
                  <Download className="h-6 w-6" />
                  <span>Exportar Leads</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => exportDonations.mutate()}
                  disabled={exportDonations.isPending}
                >
                  <Download className="h-6 w-6" />
                  <span>Exportar Doações</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => exportEvents.mutate()}
                  disabled={exportEvents.isPending}
                >
                  <Download className="h-6 w-6" />
                  <span>Exportar Eventos</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => exportMetrics.mutate()}
                  disabled={exportMetrics.isPending}
                >
                  <Download className="h-6 w-6" />
                  <span>Exportar Métricas</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
