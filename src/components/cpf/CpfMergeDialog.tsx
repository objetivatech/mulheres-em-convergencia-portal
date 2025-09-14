import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, User, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useCpfSystem, CpfUserData, UserContact, UserAddress } from '@/hooks/useCpfSystem';
import { useToast } from '@/hooks/use-toast';

interface CpfMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingUser: CpfUserData;
  newUserData: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  cpf: string;
  onMergeComplete?: (userId: string) => void;
  onCreateSeparate?: () => void;
}

interface MergedData {
  profile: {
    full_name?: string;
    email?: string;
  };
  contacts: Array<{
    type: 'email' | 'phone' | 'whatsapp';
    value: string;
    isPrimary: boolean;
    isNew?: boolean;
  }>;
  addresses: UserAddress[];
}

export const CpfMergeDialog = ({
  open,
  onOpenChange,
  existingUser,
  newUserData,
  cpf,
  onMergeComplete,
  onCreateSeparate
}: CpfMergeDialogProps) => {
  const [mergedData, setMergedData] = useState<MergedData>({
    profile: {
      full_name: existingUser.full_name,
      email: existingUser.email
    },
    contacts: [],
    addresses: []
  });

  const { useUserContacts, useUserAddresses, useAddContact } = useCpfSystem();
  const { data: existingContacts = [] } = useUserContacts(existingUser.id);
  const { data: existingAddresses = [] } = useUserAddresses(existingUser.id);
  const addContactMutation = useAddContact();
  const { toast } = useToast();

  const handleProfileFieldChange = (field: keyof MergedData['profile'], value: 'existing' | 'new') => {
    setMergedData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value === 'existing' 
          ? existingUser[field] 
          : newUserData[field === 'full_name' ? 'fullName' : field]
      }
    }));
  };

  const handleContactToggle = (contactType: 'email' | 'phone', value: string, isNew: boolean) => {
    setMergedData(prev => {
      const existingIndex = prev.contacts.findIndex(c => c.type === contactType && c.value === value);
      
      if (existingIndex >= 0) {
        // Remove if already exists
        return {
          ...prev,
          contacts: prev.contacts.filter((_, index) => index !== existingIndex)
        };
      } else {
        // Add new contact
        const isPrimary = !prev.contacts.some(c => c.type === contactType && c.isPrimary);
        return {
          ...prev,
          contacts: [
            ...prev.contacts,
            {
              type: contactType,
              value,
              isPrimary,
              isNew
            }
          ]
        };
      }
    });
  };

  const handleMergeConfirm = async () => {
    try {
      // Update profile if needed
      if (mergedData.profile.full_name !== existingUser.full_name || 
          mergedData.profile.email !== existingUser.email) {
        // Profile update would be handled by parent component
      }

      // Add new contacts
      for (const contact of mergedData.contacts.filter(c => c.isNew)) {
        await addContactMutation.mutateAsync({
          userId: existingUser.id,
          contactType: contact.type,
          contactValue: contact.value,
          isPrimary: contact.isPrimary
        });
      }

      toast({
        title: 'Dados unificados com sucesso',
        description: `Os dados foram integrados ao perfil existente de ${existingUser.full_name || 'Usuário'}.`,
      });

      onMergeComplete?.(existingUser.id);
      onOpenChange(false);

    } catch (error) {
      console.error('Error merging user data:', error);
      toast({
        title: 'Erro na unificação',
        description: 'Não foi possível unificar os dados. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const getExistingContactByType = (type: 'email' | 'phone') => {
    return existingContacts.find(c => c.contact_type === type);
  };

  const hasConflict = (field: 'email' | 'phone') => {
    const existing = field === 'email' ? existingUser.email : getExistingContactByType('phone')?.contact_value;
    const newValue = field === 'email' ? newUserData.email : newUserData.phone;
    
    return existing && newValue && existing !== newValue;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>CPF já cadastrado - Unificar dados?</span>
          </DialogTitle>
          <DialogDescription>
            Este CPF ({cpf}) já possui um cadastro. Você pode unificar os dados existentes com as novas informações ou criar um cadastro separado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Dados Existentes</span>
                <Badge variant="outline">No sistema</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome Completo</Label>
                <p className="text-sm text-muted-foreground">{existingUser.full_name || 'Não informado'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{existingUser.email || 'Não informado'}</p>
              </div>

              {existingContacts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Contatos</Label>
                  <div className="space-y-1">
                    {existingContacts.map(contact => (
                      <div key={contact.id} className="flex items-center space-x-2 text-sm">
                        {contact.contact_type === 'email' ? <Mail className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                        <span>{contact.contact_value}</span>
                        {contact.is_primary && <Badge variant="outline" className="text-xs">Principal</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingAddresses.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Endereços</Label>
                  <div className="space-y-1">
                    {existingAddresses.map(address => (
                      <div key={address.id} className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{address.street}, {address.city} - {address.state}</span>
                        {address.is_primary && <Badge variant="outline" className="text-xs">Principal</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Cadastrado em: {new Date(existingUser.created_at).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          {/* Novos Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Novos Dados</span>
                <Badge variant="secondary">Para adicionar</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome Completo</Label>
                <p className="text-sm text-muted-foreground">{newUserData.fullName || 'Não informado'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{newUserData.email || 'Não informado'}</p>
              </div>
              
              {newUserData.phone && (
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{newUserData.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Resolução de Conflitos */}
        <div className="space-y-4">
          <h3 className="font-medium">Resolução de Dados</h3>
          
          {/* Nome */}
          {existingUser.full_name && newUserData.fullName && existingUser.full_name !== newUserData.fullName && (
            <div className="space-y-2">
              <Label>Escolha o nome a ser utilizado:</Label>
              <RadioGroup 
                value={mergedData.profile.full_name === existingUser.full_name ? 'existing' : 'new'}
                onValueChange={(value) => handleProfileFieldChange('full_name', value as 'existing' | 'new')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="name-existing" />
                  <Label htmlFor="name-existing">{existingUser.full_name}</Label>
                  <Badge variant="outline">Atual</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="name-new" />
                  <Label htmlFor="name-new">{newUserData.fullName}</Label>
                  <Badge variant="secondary">Novo</Badge>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Email */}
          {hasConflict('email') && (
            <div className="space-y-2">
              <Label>Escolha o email a ser utilizado:</Label>
              <RadioGroup 
                value={mergedData.profile.email === existingUser.email ? 'existing' : 'new'}
                onValueChange={(value) => handleProfileFieldChange('email', value as 'existing' | 'new')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="email-existing" />
                  <Label htmlFor="email-existing">{existingUser.email}</Label>
                  <Badge variant="outline">Atual</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="email-new" />
                  <Label htmlFor="email-new">{newUserData.email}</Label>
                  <Badge variant="secondary">Novo</Badge>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Adicionar novos contatos */}
          {(newUserData.email || newUserData.phone) && (
            <div className="space-y-2">
              <Label>Contatos adicionais para incluir:</Label>
              <div className="space-y-2">
                {newUserData.email && !existingContacts.some(c => c.contact_value === newUserData.email) && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-email"
                      checked={mergedData.contacts.some(c => c.value === newUserData.email)}
                      onChange={() => handleContactToggle('email', newUserData.email!, true)}
                    />
                    <Label htmlFor="add-email">Adicionar email: {newUserData.email}</Label>
                  </div>
                )}
                
                {newUserData.phone && !existingContacts.some(c => c.contact_value === newUserData.phone) && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-phone"
                      checked={mergedData.contacts.some(c => c.value === newUserData.phone)}
                      onChange={() => handleContactToggle('phone', newUserData.phone!, true)}
                    />
                    <Label htmlFor="add-phone">Adicionar telefone: {newUserData.phone}</Label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCreateSeparate}>
            Manter Separado
          </Button>
          <Button 
            onClick={handleMergeConfirm}
            disabled={addContactMutation.isPending}
          >
            {addContactMutation.isPending ? 'Unificando...' : 'Unificar Dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};