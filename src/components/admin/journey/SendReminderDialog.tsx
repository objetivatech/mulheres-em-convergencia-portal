import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SendReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    full_name: string;
    journey_stage: string;
  };
}

const REMINDER_TEMPLATES = {
  complete_profile: {
    subject: 'Complete seu perfil - Mulheres em Convergência',
    message: 'Olá {name},\n\nNotamos que você iniciou seu cadastro no portal Mulheres em Convergência. Para aproveitar todos os benefícios, complete seu perfil com seus dados.\n\nAcesse: https://mulheresemconvergencia.com.br\n\nQualquer dúvida, estamos à disposição!'
  },
  choose_plan: {
    subject: 'Escolha seu plano - Mulheres em Convergência',
    message: 'Olá {name},\n\nSeu perfil está completo! Agora é hora de escolher o plano ideal para você e começar a divulgar seu negócio.\n\nConheça nossos planos: https://mulheresemconvergencia.com.br/planos\n\nEstamos aqui para ajudar!'
  },
  complete_payment: {
    subject: 'Finalize seu pagamento - Mulheres em Convergência',
    message: 'Olá {name},\n\nVocê está a um passo de ativar sua assinatura! Finalize seu pagamento para começar a aproveitar todos os benefícios.\n\nAcesse: https://mulheresemconvergencia.com.br/painel\n\nPrecisa de ajuda? Entre em contato conosco!'
  },
  custom: {
    subject: '',
    message: ''
  }
};

export const SendReminderDialog = ({ open, onOpenChange, user }: SendReminderDialogProps) => {
  const { toast } = useToast();
  const [template, setTemplate] = useState('complete_profile');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const selectedTemplate = REMINDER_TEMPLATES[template as keyof typeof REMINDER_TEMPLATES];
      const finalSubject = template === 'custom' ? customSubject : selectedTemplate.subject;
      const finalMessage = template === 'custom' 
        ? customMessage 
        : selectedTemplate.message.replace('{name}', user.full_name || user.email);

      const { error } = await supabase.functions.invoke('send-journey-reminder', {
        body: {
          user_id: user.user_id,
          user_email: user.email,
          user_name: user.full_name,
          journey_stage: user.journey_stage,
          subject: finalSubject,
          message: finalMessage
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Lembrete enviado!',
        description: `Email enviado com sucesso para ${user.email}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar lembrete',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSend = () => {
    if (template === 'custom' && (!customSubject || !customMessage)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o assunto e a mensagem do email personalizado',
        variant: 'destructive',
      });
      return;
    }
    sendReminderMutation.mutate();
  };

  const selectedTemplate = REMINDER_TEMPLATES[template as keyof typeof REMINDER_TEMPLATES];
  const previewMessage = template === 'custom' 
    ? customMessage 
    : selectedTemplate.message.replace('{name}', user.full_name || user.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Lembrete</DialogTitle>
          <DialogDescription>
            Enviar email de lembrete para {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template de Email</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete_profile">Completar Perfil</SelectItem>
                <SelectItem value="choose_plan">Escolher Plano</SelectItem>
                <SelectItem value="complete_payment">Finalizar Pagamento</SelectItem>
                <SelectItem value="custom">Mensagem Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {template === 'custom' && (
            <>
              <div className="space-y-2">
                <Label>Assunto do Email</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Digite o assunto do email"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Digite a mensagem do email"
                  rows={8}
                />
              </div>
            </>
          )}

          {template !== 'custom' && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{selectedTemplate.subject}</p>
                  <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              O email será enviado via MailRelay para <strong>{user.email}</strong>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendReminderMutation.isPending}
          >
            {sendReminderMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Lembrete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
