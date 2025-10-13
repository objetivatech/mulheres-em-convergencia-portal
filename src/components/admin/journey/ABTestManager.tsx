import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BarChart3, Plus, TrendingUp, Mail, Eye } from 'lucide-react';

interface ABVariant {
  id: string;
  template_id: string;
  variant_name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  traffic_percentage: number;
  is_active: boolean;
}

interface ABMetrics {
  variant_id: string;
  variant_name: string;
  template_name: string;
  total_sends: number;
  total_opens: number;
  total_clicks: number;
  total_conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export const ABTestManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [viewingMetrics, setViewingMetrics] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, journey_stage, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: variants } = useQuery({
    queryKey: ['ab-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_ab_variants')
        .select(`
          *,
          email_templates (
            name,
            journey_stage
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (ABVariant & { email_templates: { name: string; journey_stage: string } })[];
    }
  });

  const { data: metrics } = useQuery({
    queryKey: ['ab-metrics', viewingMetrics],
    enabled: !!viewingMetrics,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_ab_test_metrics', {
          p_template_id: viewingMetrics,
          p_days: 30
        });
      
      if (error) throw error;
      return data as ABMetrics[];
    }
  });

  const createVariantMutation = useMutation({
    mutationFn: async (variant: Partial<ABVariant>) => {
      const { data, error } = await supabase
        .from('email_ab_variants')
        .insert([variant as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-variants'] });
      toast.success('Variante criada com sucesso');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao criar variante');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const variant = {
      template_id: formData.get('template_id') as string,
      variant_name: formData.get('variant_name') as string,
      subject: formData.get('subject') as string,
      html_content: formData.get('html_content') as string,
      text_content: formData.get('text_content') as string,
      traffic_percentage: parseInt(formData.get('traffic_percentage') as string),
      is_active: true
    };

    createVariantMutation.mutate(variant);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Testes A/B</h2>
          <p className="text-muted-foreground">Configure e analise variantes de emails</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Variante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Variante de Teste</DialogTitle>
              <DialogDescription>
                Configure uma nova variante para teste A/B
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="template_id">Template Base</Label>
                <Select name="template_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variant_name">Nome da Variante</Label>
                <Input
                  id="variant_name"
                  name="variant_name"
                  placeholder="Ex: B, C, Teste1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="traffic_percentage">Porcentagem de Tráfego (%)</Label>
                <Input
                  id="traffic_percentage"
                  name="traffic_percentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Variação do assunto"
                  required
                />
              </div>

              <div>
                <Label htmlFor="html_content">Conteúdo HTML</Label>
                <Textarea
                  id="html_content"
                  name="html_content"
                  placeholder="Variação do conteúdo HTML"
                  rows={10}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="text_content">Conteúdo Texto (opcional)</Label>
                <Textarea
                  id="text_content"
                  name="text_content"
                  placeholder="Variação do texto"
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Variante</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {variants?.map(variant => (
          <Card key={variant.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {variant.email_templates.name} - Variante {variant.variant_name}
                  </CardTitle>
                  <CardDescription>{variant.subject}</CardDescription>
                </div>
                <Badge variant={variant.is_active ? "default" : "secondary"}>
                  {variant.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tráfego alocado</span>
                  <span className="font-semibold">{variant.traffic_percentage}%</span>
                </div>
                <Progress value={variant.traffic_percentage} />
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingMetrics(variant.template_id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Métricas
              </Button>
            </CardContent>
          </Card>
        ))}

        {variants?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum teste A/B configurado</p>
              <p className="text-sm">Crie variantes para testar diferentes abordagens</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metrics Dialog */}
      <Dialog open={!!viewingMetrics} onOpenChange={() => setViewingMetrics(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Métricas de Performance - Últimos 30 Dias</DialogTitle>
            <DialogDescription>
              Compare o desempenho das variantes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {metrics?.map(metric => (
              <Card key={metric.variant_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Variante {metric.variant_name}</span>
                    <Badge variant="outline">{metric.template_name}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Enviados</div>
                      <div className="text-2xl font-bold">{metric.total_sends}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Abertura</div>
                      <div className="text-2xl font-bold text-primary">{metric.open_rate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Cliques</div>
                      <div className="text-2xl font-bold text-secondary">{metric.click_rate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                      <div className="text-2xl font-bold text-tertiary">{metric.conversion_rate}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {metric.total_opens} aberturas, {metric.total_clicks} cliques, {metric.total_conversions} conversões
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
