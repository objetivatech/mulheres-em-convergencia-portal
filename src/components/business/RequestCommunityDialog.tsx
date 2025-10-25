import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface RequestCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
}

export const RequestCommunityDialog = ({ open, onOpenChange, businessId }: RequestCommunityDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ community_name: '', message: '' });

  const requestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('community_requests')
        .insert({
          community_name: data.community_name,
          business_id: businessId || null,
          requester_id: user.id,
          requester_email: profile?.email || user.email || '',
          requester_name: profile?.full_name || null,
          message: data.message || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada!',
        description: 'Os administradores irão revisar sua solicitação em breve.',
      });
      setFormData({ community_name: '', message: '' });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.community_name.trim()) {
      toast({ title: 'Nome da comunidade é obrigatório', variant: 'destructive' });
      return;
    }
    requestMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Nova Comunidade/Coletivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="community_name">Nome da Comunidade/Coletivo *</Label>
            <Input
              id="community_name"
              value={formData.community_name}
              onChange={(e) => setFormData({ ...formData, community_name: e.target.value })}
              placeholder="Ex: Coletivo Mulheres Empreendedoras"
            />
          </div>
          <div>
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Informações adicionais sobre a comunidade..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Enviar Solicitação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
