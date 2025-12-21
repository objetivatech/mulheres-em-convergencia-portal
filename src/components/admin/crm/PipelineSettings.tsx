import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePipelines, Pipeline, PipelineStage } from '@/hooks/usePipelines';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';

interface PipelineSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultStages: PipelineStage[] = [
  { id: 'lead', name: 'Lead', color: '#6b7280', order: 0 },
  { id: 'contacted', name: 'Contatado', color: '#3b82f6', order: 1 },
  { id: 'proposal', name: 'Proposta', color: '#8b5cf6', order: 2 },
  { id: 'negotiation', name: 'Negociação', color: '#f59e0b', order: 3 },
  { id: 'won', name: 'Ganho', color: '#22c55e', order: 4 },
  { id: 'lost', name: 'Perdido', color: '#ef4444', order: 5 },
];

export const PipelineSettings = ({ open, onOpenChange }: PipelineSettingsProps) => {
  const { toast } = useToast();
  const pipelines = usePipelines();
  const { data: pipelinesList, isLoading } = pipelines.usePipelinesList();
  const createPipeline = pipelines.useCreatePipeline();
  const updatePipeline = pipelines.useUpdatePipeline();
  const deletePipeline = pipelines.useDeletePipeline();

  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pipeline_type: '',
    stages: defaultStages,
  });

  const handleSelectPipeline = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setFormData({
      name: pipeline.name,
      description: pipeline.description || '',
      pipeline_type: pipeline.pipeline_type || '',
      stages: pipeline.stages || defaultStages,
    });
    setIsCreating(false);
  };

  const handleNewPipeline = () => {
    setSelectedPipeline(null);
    setFormData({
      name: '',
      description: '',
      pipeline_type: '',
      stages: defaultStages,
    });
    setIsCreating(true);
  };

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `stage_${Date.now()}`,
      name: 'Novo Estágio',
      color: '#6b7280',
      order: formData.stages.length,
    };
    setFormData({ ...formData, stages: [...formData.stages, newStage] });
  };

  const handleUpdateStage = (index: number, updates: Partial<PipelineStage>) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], ...updates };
    setFormData({ ...formData, stages: newStages });
  };

  const handleRemoveStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    // Update order
    newStages.forEach((stage, i) => {
      stage.order = i;
    });
    setFormData({ ...formData, stages: newStages });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (selectedPipeline) {
        await updatePipeline.mutateAsync({
          id: selectedPipeline.id,
          name: formData.name,
          description: formData.description || null,
          pipeline_type: formData.pipeline_type || null,
          stages: formData.stages,
        });
        toast({ title: 'Pipeline atualizado com sucesso' });
      } else {
        await createPipeline.mutateAsync({
          name: formData.name,
          description: formData.description || null,
          pipeline_type: formData.pipeline_type || null,
          stages: formData.stages,
          active: true,
        });
        toast({ title: 'Pipeline criado com sucesso' });
      }
      setIsCreating(false);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar pipeline', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedPipeline) return;
    
    if (!confirm('Tem certeza que deseja desativar este pipeline?')) return;

    try {
      await deletePipeline.mutateAsync(selectedPipeline.id);
      toast({ title: 'Pipeline desativado com sucesso' });
      setSelectedPipeline(null);
      setIsCreating(false);
    } catch (error: any) {
      toast({ title: 'Erro ao desativar pipeline', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Pipelines</DialogTitle>
          <DialogDescription>
            Crie e gerencie pipelines personalizados para diferentes jornadas de clientes
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pipeline List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pipelines</h3>
              <Button size="sm" variant="outline" onClick={handleNewPipeline}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {pipelinesList?.map((pipeline) => (
                  <Card
                    key={pipeline.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPipeline?.id === pipeline.id ? 'border-primary' : ''
                    }`}
                    onClick={() => handleSelectPipeline(pipeline)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium">{pipeline.name}</div>
                      {pipeline.pipeline_type && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {pipeline.pipeline_type}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {pipeline.stages?.length || 0} estágios
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline Editor */}
          <div className="md:col-span-2">
            {(selectedPipeline || isCreating) ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Pipeline *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Vendas de Eventos"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Input
                      value={formData.pipeline_type}
                      onChange={(e) => setFormData({ ...formData, pipeline_type: e.target.value })}
                      placeholder="Ex: eventos, planos, vendas"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do pipeline..."
                    rows={2}
                  />
                </div>

                {/* Stages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Estágios</Label>
                    <Button size="sm" variant="outline" onClick={handleAddStage}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.stages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <input
                          type="color"
                          value={stage.color}
                          onChange={(e) => handleUpdateStage(index, { color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <Input
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(index, { name: e.target.value })}
                          className="flex-1"
                          placeholder="Nome do estágio"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveStage(index)}
                          disabled={formData.stages.length <= 2}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSave}
                    disabled={createPipeline.isPending || updatePipeline.isPending}
                  >
                    {(createPipeline.isPending || updatePipeline.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {selectedPipeline ? 'Atualizar' : 'Criar'} Pipeline
                  </Button>
                  {selectedPipeline && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={deletePipeline.isPending}
                    >
                      Desativar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Selecione um pipeline ou crie um novo
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
