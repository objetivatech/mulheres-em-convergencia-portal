import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCRM, CRMDeal } from '@/hooks/useCRM';
import { usePipelines } from '@/hooks/usePipelines';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: CRMDeal;
  contactId?: string;
  contactType?: 'lead' | 'user';
  cpf?: string | null;
  contactName?: string;
}

const productTypes = [
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'curso', label: 'Curso' },
  { value: 'evento', label: 'Evento' },
  { value: 'mentoria', label: 'Mentoria' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'patrocinio', label: 'Patrocínio' },
  { value: 'doacao', label: 'Doação' },
  { value: 'outro', label: 'Outro' },
];

const defaultStages = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'negotiation', label: 'Negociação' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
];

export const DealForm = ({ 
  open, 
  onOpenChange, 
  deal,
  contactId, 
  contactType, 
  cpf, 
  contactName = 'Novo Cliente' 
}: DealFormProps) => {
  const { toast } = useToast();
  const { useCreateDeal, useUpdateDeal, useCostCenters } = useCRM();
  const { usePipelinesList } = usePipelines();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const { data: costCenters } = useCostCenters();
  const { data: pipelines } = usePipelinesList();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [stages, setStages] = useState(defaultStages);

  const [formData, setFormData] = useState({
    title: deal?.title || `Negócio com ${contactName}`,
    description: deal?.description || '',
    value: deal?.value?.toString() || '',
    stage: deal?.stage || 'lead',
    product_type: deal?.product_type || 'assinatura',
    expected_close_date: deal?.expected_close_date?.split('T')[0] || '',
    cost_center_id: deal?.cost_center_id || '',
    pipeline_id: deal?.pipeline_id || '',
  });

  // Reinicializar formData quando o deal mudar (editar vs criar)
  useEffect(() => {
    if (open) {
      setFormData({
        title: deal?.title || `Negócio com ${contactName}`,
        description: deal?.description || '',
        value: deal?.value?.toString() || '',
        stage: deal?.stage || 'lead',
        product_type: deal?.product_type || 'assinatura',
        expected_close_date: deal?.expected_close_date?.split('T')[0] || '',
        cost_center_id: deal?.cost_center_id || '',
        pipeline_id: deal?.pipeline_id || '',
      });
      if (deal?.pipeline_id) {
        setSelectedPipelineId(deal.pipeline_id);
      } else {
        setSelectedPipelineId('');
      }
    }
  }, [deal, open, contactName]);

  useEffect(() => {
    if (selectedPipelineId && pipelines) {
      const pipeline = pipelines.find(p => p.id === selectedPipelineId);
      if (pipeline?.stages) {
        setStages(pipeline.stages.map(s => ({ value: s.id, label: s.name })));
      }
    } else {
      setStages(defaultStages);
    }
  }, [selectedPipelineId, pipelines]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setFormData(prev => ({ ...prev, pipeline_id: pipelineId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      const dealData: any = {
        title: formData.title,
        description: formData.description || null,
        value: parseFloat(formData.value) || 0,
        stage: formData.stage,
        product_type: formData.product_type,
        expected_close_date: formData.expected_close_date || null,
        cost_center_id: formData.cost_center_id || null,
        pipeline_id: formData.pipeline_id || null,
        lead_id: contactType === 'lead' ? contactId : deal?.lead_id || null,
        user_id: contactType === 'user' ? contactId : deal?.user_id || null,
        cpf: cpf || deal?.cpf || null,
      };

      if (deal) {
        await updateDeal.mutateAsync({ id: deal.id, ...dealData });
        toast({ title: 'Negócio atualizado com sucesso' });
      } else {
        await createDeal.mutateAsync(dealData);
        toast({ title: 'Negócio criado com sucesso' });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: deal ? 'Erro ao atualizar negócio' : 'Erro ao criar negócio',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
          <DialogDescription>
            {deal ? 'Atualize as informações do negócio' : 'Crie um novo negócio para acompanhar no pipeline'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do negócio"
                required
              />
            </div>

            <div>
              <Label htmlFor="pipeline">Pipeline</Label>
              <Select
                value={selectedPipelineId}
                onValueChange={handlePipelineChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pipeline (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Pipeline Padrão</SelectItem>
                  {pipelines?.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="product_type">Tipo de Produto</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost_center">Centro de Custo</Label>
              <Select
                value={formData.cost_center_id}
                onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters?.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do negócio..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDeal.isPending || updateDeal.isPending}>
              {(createDeal.isPending || updateDeal.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deal ? 'Atualizar' : 'Criar'} Negócio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
