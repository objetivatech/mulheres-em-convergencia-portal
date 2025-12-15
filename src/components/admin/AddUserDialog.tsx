import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { useCpfSystem } from '@/hooks/useCpfSystem';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Shield, Store, User, Mail, Crown, Users, Edit3 } from 'lucide-react';
import { CpfUserForm } from '@/components/cpf/CpfUserForm';

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  blog_editor: Edit3,
  business_owner: Store,
  customer: User,
  subscriber: Mail,
  ambassador: Crown,
  community_member: Users,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  blog_editor: 'Editor de Blog',
  business_owner: 'Associada',
  customer: 'Cliente da Loja',
  subscriber: 'Assinante Newsletter',
  ambassador: 'Embaixadora',
  community_member: 'Membro da Comunidade',
};

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddUserDialog = ({ open, onOpenChange }: AddUserDialogProps) => {
  const [step, setStep] = useState<'cpf' | 'roles'>('cpf');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  
  const { useCreateUser } = useRoles();
  const { cpfUtils } = useCpfSystem();
  const createUserMutation = useCreateUser();
  const { toast } = useToast();

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, role]);
    } else {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    }
  };

  const handleUserFound = (userId: string) => {
    setSelectedUserId(userId);
    setStep('roles');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast({
        title: 'Erro',
        description: 'Usuário não selecionado.',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Email e senha são obrigatórios para criar conta de acesso.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        roles: selectedRoles,
      });

      toast({
        title: 'Usuário criado',
        description: `Conta de acesso criada com sucesso para ${email}.`,
      });

      // Resetar formulário
      setStep('cpf');
      setSelectedUserId(null);
      setEmail('');
      setPassword('');
      setSelectedRoles([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conta de acesso.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setStep('cpf');
    setSelectedUserId(null);
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>
              {step === 'cpf' ? 'Buscar/Criar Usuário por CPF' : 'Definir Permissões e Acesso'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {step === 'cpf' 
              ? 'Busque um usuário existente por CPF ou crie um novo.'
              : 'Defina as permissões e crie a conta de acesso ao sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'cpf' && (
          <div className="py-4">
            <CpfUserForm 
              onUserFound={handleUserFound}
              showContactsAndAddresses={false}
              allowCreate={true}
            />
          </div>
        )}

        {step === 'roles' && selectedUserId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações de acesso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email para Acesso *</Label>
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
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha temporária"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              O usuário poderá alterar a senha no primeiro acesso.
            </p>

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
              <Button type="button" variant="outline" onClick={() => setStep('cpf')}>
                Voltar
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                className="min-w-24"
              >
                {createUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Criar Conta de Acesso'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};