import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCRM, CRMLead } from '@/hooks/useCRM';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLead?: CRMLead | null;
}

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'evento', label: 'Evento' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'outro', label: 'Outro' },
];

export const ContactForm = ({ open, onOpenChange, editingLead }: ContactFormProps) => {
  const { toast } = useToast();
  const { useCreateLead, useUpdateLead, useCostCenters } = useCRM();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { data: costCenters } = useCostCenters();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    cpf: '',
    phone: '',
    source: 'website',
    source_detail: '',
    cost_center_id: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (editingLead) {
      setFormData({
        full_name: editingLead.full_name || '',
        email: editingLead.email || '',
        cpf: editingLead.cpf || '',
        phone: editingLead.phone || '',
        source: editingLead.source || 'website',
        source_detail: editingLead.source_detail || '',
        cost_center_id: editingLead.cost_center_id || '',
        tags: editingLead.tags || [],
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        cpf: '',
        phone: '',
        source: 'website',
        source_detail: '',
        cost_center_id: '',
        tags: [],
      });
    }
  }, [editingLead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        cost_center_id: formData.cost_center_id || null,
        email: formData.email || null,
        cpf: formData.cpf || null,
        phone: formData.phone || null,
        source_detail: formData.source_detail || null,
      };

      if (editingLead) {
        await updateLead.mutateAsync({ id: editingLead.id, ...dataToSave });
        toast({ title: 'Lead atualizado com sucesso' });
      } else {
        await createLead.mutateAsync(dataToSave);
        toast({ title: 'Lead criado com sucesso' });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar lead',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isLoading = createLead.isPending || updateLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {editingLead ? 'Atualize as informações do lead' : 'Preencha os dados do novo lead'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome do contato"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="source">Origem *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="source_detail">Detalhe da Origem</Label>
              <Input
                id="source_detail"
                value={formData.source_detail}
                onChange={(e) => setFormData({ ...formData, source_detail: e.target.value })}
                placeholder="Ex: Evento X, Formulário Y..."
              />
            </div>

            <div className="col-span-2">
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLead ? 'Salvar' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
