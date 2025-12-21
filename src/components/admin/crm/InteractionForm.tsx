import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCRM } from '@/hooks/useCRM';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InteractionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactType: 'lead' | 'user';
  cpf?: string | null;
}

const interactionTypes = [
  { value: 'phone_call', label: 'Ligação' },
  { value: 'email_sent', label: 'Email Enviado' },
  { value: 'message', label: 'Mensagem' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'event_registration', label: 'Inscrição em Evento' },
  { value: 'form_submit', label: 'Formulário Enviado' },
  { value: 'purchase', label: 'Compra' },
  { value: 'donation', label: 'Doação' },
  { value: 'other', label: 'Outro' },
];

const channels = [
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'outro', label: 'Outro' },
];

export const InteractionForm = ({ open, onOpenChange, contactId, contactType, cpf }: InteractionFormProps) => {
  const { toast } = useToast();
  const { useCreateInteraction } = useCRM();
  const createInteraction = useCreateInteraction();

  const [formData, setFormData] = useState({
    interaction_type: 'phone_call',
    channel: 'phone',
    description: '',
    activity_name: '',
    activity_paid: false,
    activity_online: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInteraction.mutateAsync({
        ...formData,
        lead_id: contactType === 'lead' ? contactId : null,
        user_id: contactType === 'user' ? contactId : null,
        cpf: cpf || null,
        description: formData.description || null,
        activity_name: formData.activity_name || null,
      });
      
      toast({ title: 'Interação registrada com sucesso' });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        interaction_type: 'phone_call',
        channel: 'phone',
        description: '',
        activity_name: '',
        activity_paid: false,
        activity_online: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar interação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
          <DialogDescription>
            Adicione uma nova interação ao histórico do contato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Interação *</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="channel">Canal</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da interação..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="activity_name">Nome da Atividade</Label>
              <Input
                id="activity_name"
                value={formData.activity_name}
                onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                placeholder="Ex: Workshop de Negócios, Curso X..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activity_paid">Atividade Paga</Label>
              <Switch
                id="activity_paid"
                checked={formData.activity_paid}
                onCheckedChange={(checked) => setFormData({ ...formData, activity_paid: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activity_online">Atividade Online</Label>
              <Switch
                id="activity_online"
                checked={formData.activity_online}
                onCheckedChange={(checked) => setFormData({ ...formData, activity_online: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInteraction.isPending}>
              {createInteraction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
