import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Shield, Store, User, Mail, Crown, Users, Edit3 } from 'lucide-react';

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  associada: Store,
  cliente_loja: User,
  assinante_newsletter: Mail,
  embaixadora: Crown,
  membro_comunidade: Users,
  autor: Edit3,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  associada: 'Associada',
  cliente_loja: 'Cliente da Loja',
  assinante_newsletter: 'Assinante Newsletter',
  embaixadora: 'Embaixadora',
  membro_comunidade: 'Membro da Comunidade',
  autor: 'Autor',
};

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddUserDialog = ({ open, onOpenChange }: AddUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  
  const { useCreateUser } = useRoles();
  const createUserMutation = useCreateUser();
  const { toast } = useToast();

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, role]);
    } else {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Email e senha são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        fullName: fullName || undefined,
        roles: selectedRoles,
      });

      toast({
        title: 'Usuário criado',
        description: `Usuário ${email} criado com sucesso.`,
      });

      // Resetar formulário
      setEmail('');
      setPassword('');
      setFullName('');
      setSelectedRoles([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Adicionar Novo Usuário</span>
          </DialogTitle>
          <DialogDescription>
            Crie uma nova conta de usuário e defina suas permissões.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha temporária"
              required
              minLength={6}
            />
            <p className="text-sm text-muted-foreground">
              O usuário poderá alterar a senha no primeiro acesso.
            </p>
          </div>

          {/* Seleção de roles */}
          <div className="space-y-4">
            <Label>Permissões do Usuário</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(roleLabels).map(([role, label]) => {
                const Icon = roleIcons[role as UserRole];
                const isChecked = selectedRoles.includes(role as UserRole);
                
                return (
                  <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={role}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleRoleChange(role as UserRole, !!checked)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <Icon className="h-4 w-4" />
                      <Label htmlFor={role} className="cursor-pointer">{label}</Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
              className="min-w-24"
            >
              {createUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};