import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';

interface ChangeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
}

export const ChangeEmailDialog: React.FC<ChangeEmailDialogProps> = ({ open, onClose, currentEmail }) => {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setNewEmail('');
    setPassword('');
    setSuccess(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !password) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-email-change', {
        body: { new_email: newEmail.trim().toLowerCase(), password },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setSuccess((data as any)?.message || `Enviamos um link para ${newEmail}.`);
      toast({ title: 'Solicitação enviada', description: 'Verifique a caixa de entrada do novo email.' });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Não foi possível solicitar a troca de email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Alterar email principal
          </DialogTitle>
          <DialogDescription>
            Por segurança, o novo email só será ativado após confirmação por link enviado para o endereço informado.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              O link expira em 24 horas. Enquanto isso, seu email atual continua ativo para login e comunicações.
            </p>
            <Button onClick={handleClose} className="w-full">Entendido</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email atual</Label>
              <Input value={currentEmail} disabled />
            </div>
            <div>
              <Label htmlFor="new-email">Novo email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="current-password">Senha atual *</Label>
              <Input
                id="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de acesso"
                required
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground mt-1">Necessária para confirmar sua identidade.</p>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Após a confirmação no novo email, todos os sistemas (login, newsletter, certificados, CRM) passarão a usar o novo endereço.
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !newEmail || !password}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Solicitar troca'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};