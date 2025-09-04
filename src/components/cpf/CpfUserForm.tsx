import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, User, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import { useCpfSystem, UserContact, UserAddress } from '@/hooks/useCpfSystem';
import { useToast } from '@/hooks/use-toast';

interface CpfUserFormProps {
  onUserFound?: (userId: string) => void;
  showContactsAndAddresses?: boolean;
  allowCreate?: boolean;
}

export const CpfUserForm = ({ 
  onUserFound, 
  showContactsAndAddresses = true, 
  allowCreate = true 
}: CpfUserFormProps) => {
  const [cpf, setCpf] = useState('');
  const [searchCpf, setSearchCpf] = useState('');
  const [newUserData, setNewUserData] = useState({
    email: '',
    fullName: '',
    phone: ''
  });
  
  const { cpfUtils, useUserByCpf, useUserContacts, useUserAddresses, useUpsertUserByCpf } = useCpfSystem();
  const { toast } = useToast();
  
  const userQuery = useUserByCpf(searchCpf);
  const contactsQuery = useUserContacts(userQuery.data?.id);
  const addressesQuery = useUserAddresses(userQuery.data?.id);
  const upsertMutation = useUpsertUserByCpf();

  // Aplicar máscara ao CPF
  const handleCpfChange = (value: string) => {
    const masked = cpfUtils.applyMask(value);
    setCpf(masked);
  };

  // Buscar usuário
  const handleSearch = () => {
    if (!cpfUtils.isValidFormat(cpf)) {
      toast({
        title: 'CPF Inválido',
        description: 'Digite um CPF válido com 11 dígitos.',
        variant: 'destructive',
      });
      return;
    }
    
    setSearchCpf(cpf);
  };

  // Criar novo usuário
  const handleCreateUser = async () => {
    if (!cpfUtils.isValidFormat(cpf)) {
      toast({
        title: 'CPF Inválido',
        description: 'Digite um CPF válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!newUserData.email || !newUserData.fullName) {
      toast({
        title: 'Dados Obrigatórios',
        description: 'Email e nome completo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const userId = await upsertMutation.mutateAsync({
        cpf,
        email: newUserData.email,
        fullName: newUserData.fullName,
        phone: newUserData.phone || undefined
      });

      toast({
        title: 'Usuário Criado',
        description: 'Usuário criado/atualizado com sucesso!',
      });

      // Buscar dados atualizados
      setSearchCpf(cpf);
      
      // Limpar formulário
      setNewUserData({ email: '', fullName: '', phone: '' });
      
      // Chamar callback
      if (onUserFound) {
        onUserFound(userId);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário.',
        variant: 'destructive',
      });
    }
  };

  // Effect para chamar callback quando usuário for encontrado
  useEffect(() => {
    if (userQuery.data?.id && onUserFound) {
      onUserFound(userQuery.data.id);
    }
  }, [userQuery.data?.id, onUserFound]);

  return (
    <div className="space-y-6">
      {/* Busca por CPF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar por CPF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={userQuery.isLoading}
              >
                {userQuery.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da busca */}
      {searchCpf && (
        <>
          {userQuery.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Usuário Encontrado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-semibold">{userQuery.data.full_name}</p>
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <p className="font-mono">{userQuery.data.cpf}</p>
                  </div>
                  <div>
                    <Label>Email Principal</Label>
                    <p>{userQuery.data.email}</p>
                  </div>
                  <div>
                    <Label>Cadastro</Label>
                    <p>{new Date(userQuery.data.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {showContactsAndAddresses && (
                  <>
                    {/* Contatos */}
                    {contactsQuery.data && contactsQuery.data.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Contatos
                          </h4>
                          <div className="space-y-2">
                            {contactsQuery.data.map((contact: UserContact) => (
                              <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  {contact.contact_type === 'email' && <Mail className="h-4 w-4" />}
                                  {contact.contact_type === 'phone' && <Phone className="h-4 w-4" />}
                                  {contact.contact_type === 'whatsapp' && <Phone className="h-4 w-4" />}
                                  <span>{contact.contact_value}</span>
                                </div>
                                <div className="flex gap-1">
                                  {contact.is_primary && <Badge variant="default">Principal</Badge>}
                                  {contact.verified && <Badge variant="secondary">Verificado</Badge>}
                                  <Badge variant="outline">{contact.contact_type}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Endereços */}
                    {addressesQuery.data && addressesQuery.data.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Endereços
                          </h4>
                          <div className="space-y-2">
                            {addressesQuery.data.map((address: UserAddress) => (
                              <div key={address.id} className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">{address.address_type}</Badge>
                                  {address.is_primary && <Badge variant="default">Principal</Badge>}
                                </div>
                                <p className="text-sm">
                                  {address.street}{address.number && `, ${address.number}`}
                                  {address.complement && ` - ${address.complement}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.neighborhood && `${address.neighborhood}, `}
                                  {address.city}, {address.state}
                                  {address.postal_code && ` - ${address.postal_code}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            // Usuário não encontrado - Formulário para criação
            allowCreate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Usuário Não Encontrado - Criar Novo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="usuario@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          value={newUserData.fullName}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Nome do usuário"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newUserData.phone}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateUser} 
                      disabled={upsertMutation.isPending}
                      className="w-full"
                    >
                      {upsertMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Criar Usuário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}
    </div>
  );
};