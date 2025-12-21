import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCRM } from '@/hooks/useCRM';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactType: 'lead' | 'user';
  cpf?: string | null;
  contactName: string;
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

const stages = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'negotiation', label: 'Negociação' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
];

export const DealForm = ({ open, onOpenChange, contactId, contactType, cpf, contactName }: DealFormProps) => {
  const { toast } = useToast();
  const { useCreateDeal, useCostCenters } = useCRM();
  const createDeal = useCreateDeal();
  const { data: costCenters } = useCostCenters();

  const [formData, setFormData] = useState({
    title: `Negócio com ${contactName}`,
    description: '',
    value: '',
    stage: 'lead',
    product_type: 'assinatura',
    expected_close_date: '',
    cost_center_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      await createDeal.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        value: parseFloat(formData.value) || 0,
        stage: formData.stage as any,
        product_type: formData.product_type,
        expected_close_date: formData.expected_close_date || null,
        cost_center_id: formData.cost_center_id || null,
        lead_id: contactType === 'lead' ? contactId : null,
        user_id: contactType === 'user' ? contactId : null,
        cpf: cpf || null,
      });
      
      toast({ title: 'Negócio criado com sucesso' });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: `Negócio com ${contactName}`,
        description: '',
        value: '',
        stage: 'lead',
        product_type: 'assinatura',
        expected_close_date: '',
        cost_center_id: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar negócio',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
          <DialogDescription>
            Crie um novo negócio para acompanhar no pipeline
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
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
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
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Negócio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
