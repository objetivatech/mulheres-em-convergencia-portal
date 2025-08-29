import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRoles, UserProfile } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditUserDialog = ({ user, open, onOpenChange }: EditUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  
  const { useUpdateUser } = useRoles();
  const updateUserMutation = useUpdateUser();
  const { toast } = useToast();

  // Resetar formulário quando o usuário ou dialog mudarem
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.full_name || '');
    } else {
      setEmail('');
      setFullName('');
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!email) {
      toast({
        title: 'Erro',
        description: 'Email é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        email: email !== user.email ? email : undefined,
        fullName: fullName !== user.full_name ? fullName : undefined,
      });

      toast({
        title: 'Usuário atualizado',
        description: `Dados do usuário atualizados com sucesso.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <span>Editar Usuário</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações básicas do usuário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Nome Completo</Label>
            <Input
              id="edit-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Para alterar roles, use o botão "Gerenciar Roles" na tabela de usuários.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="min-w-24"
            >
              {updateUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};