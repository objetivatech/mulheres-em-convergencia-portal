import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface CommunityRequestDialogProps {
  businessId: string;
  onSuccess?: () => void;
}

export function CommunityRequestDialog({ businessId, onSuccess }: CommunityRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [requestedName, setRequestedName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!requestedName.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, informe o nome da comunidade',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('community_requests').insert({
        business_id: businessId,
        requested_name: requestedName.trim(),
        description: description.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação será analisada pela nossa equipe em breve.',
      });

      setRequestedName('');
      setDescription('');
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
          <Plus className="h-3 w-3 mr-1" />
          Não encontrou sua comunidade? Solicite aqui
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Nova Comunidade</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para solicitar a criação de uma nova comunidade ou coletivo.
            Nossa equipe irá analisar e responder em breve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="requestedName">Nome da Comunidade/Coletivo *</Label>
            <Input
              id="requestedName"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              placeholder="Ex: Mulheres Empreendedoras de São Paulo"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição/Justificativa</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte-nos um pouco sobre esta comunidade e por que ela deveria ser adicionada..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Solicitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
