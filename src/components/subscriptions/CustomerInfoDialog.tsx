import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSmartFormFiller } from '@/hooks/useSmartFormFiller';
import { useCpfSystem } from '@/hooks/useCpfSystem';
import AddressSelector from '@/components/form/AddressSelector';
import ContactSelector from '@/components/form/ContactSelector';
import CpfMergeDialog, { type MergeSelections } from '@/components/form/CpfMergeDialog';
import { AddressFormDialog } from '@/components/user/AddressFormDialog';

const customerSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo'),
  cpfCnpj: z.string().min(11, 'Informe um CPF/CNPJ válido'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  postalCode: z.string().min(8, 'Informe o CEP'),
  address: z.string().min(3, 'Informe o endereço'),
  addressNumber: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  province: z.string().min(2, 'Informe o bairro'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Informe o estado (UF)'),
  // Signup fields (only when user is not logged in)
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Only validate email/password if email has actual content (not empty string)
  if (data.email && data.email.trim().length > 0) {
    return data.password && data.password.length >= 6 && data.confirmPassword && data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Senhas devem coincidir",
  path: ["confirmPassword"],
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export interface UserProfileData {
  full_name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface CustomerInfoDialogProps {
  open: boolean;
  loading?: boolean;
  userProfile?: UserProfileData;
  onClose: () => void;
  onSubmit: (data: CustomerFormData, signupData?: { email: string; password: string; name: string; cpf: string }) => Promise<void> | void;
}

const CustomerInfoDialog: React.FC<CustomerInfoDialogProps> = ({ open, loading, userProfile, onClose, onSubmit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cpfExists, setCpfExists] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  
  const { useUserByCpf, useUserContacts, useUserAddresses, cpfUtils } = useCpfSystem();
  
  // Smart form filler for logged-in users
  const {
    hasAddresses,
    hasPhoneContacts,
    getAddressSuggestions,
    getContactSuggestions,
    selectAddress,
    selectContact,
    getFormValues,
    autoFillPrimary,
    getAddresses,
  } = useSmartFormFiller();
  
  // Refetch addresses when new one is added
  const { refetch: refetchAddresses } = useUserAddresses(user?.id || '');
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpfCnpj: '',
      phone: '',
      postalCode: '',
      address: '',
      addressNumber: '',
      complement: '',
      province: '',
      city: '',
      state: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Pre-fill form with user profile data and smart suggestions WHEN dialog opens (once per open)
  const prefilledRef = React.useRef(false)
  useEffect(() => {
    if (!open) {
      prefilledRef.current = false
      return
    }

    if (prefilledRef.current) return

    if (user) {
      const updates: Partial<CustomerFormData> = {}

      if (userProfile?.full_name) updates.name = userProfile.full_name
      if (userProfile?.cpf) updates.cpfCnpj = userProfile.cpf
      if (userProfile?.phone) updates.phone = userProfile.phone
      if (userProfile?.city) updates.city = userProfile.city
      if (userProfile?.state) updates.state = userProfile.state

      const smartValues = autoFillPrimary()

      form.reset({
        name: updates.name || '',
        cpfCnpj: updates.cpfCnpj || '',
        phone: smartValues.phone || updates.phone || '',
        postalCode: smartValues.postalCode || '',
        address: smartValues.address || '',
        addressNumber: smartValues.addressNumber || '',
        complement: smartValues.complement || '',
        province: smartValues.province || '',
        city: smartValues.city || updates.city || '',
        state: smartValues.state || updates.state || '',
        email: undefined,
        password: undefined,
        confirmPassword: undefined,
      })
    } else {
      form.reset({
        name: '',
        cpfCnpj: '',
        phone: '',
        postalCode: '',
        address: '',
        addressNumber: '',
        complement: '',
        province: '',
        city: '',
        state: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
    }

    prefilledRef.current = true
  }, [open, user, userProfile])

  // CPF validation and duplicate check with merge option
  const validateCpf = async (cpf: string) => {
    if (!cpf || cpf.length < 11) return;
    
    // Validar formato do CPF
    const cpfNumbers = cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      // ✅ CORREÇÃO: Apenas alerta, não bloqueia submit
      form.setError('cpfCnpj', { 
        type: 'manual', 
        message: 'CPF deve ter 11 dígitos' 
      });
      setCpfExists(null); // Não bloquear botão
      setExistingUserData(null);
      return;
    }

    // Validar CPF repetido (111.111.111-11, etc)
    if (/^(\d)\1{10}$/.test(cpfNumbers)) {
      // ✅ CORREÇÃO: Apenas alerta, não bloqueia submit
      form.setError('cpfCnpj', { 
        type: 'manual', 
        message: 'CPF não pode ter dígitos repetidos' 
      });
      setCpfExists(null); // Não bloquear botão
      setExistingUserData(null);
      return;
    }
    
    // Limpar erros se passou nas validações de formato
    form.clearErrors('cpfCnpj');
    
    const { data } = await supabase.rpc('get_user_by_cpf', { cpf_input: cpf });
    if (data && data.length > 0 && data[0].id !== user?.id) {
      setExistingUserData(data[0]);
      if (user) {
        // For logged-in users, BLOCK submission
        setCpfExists(`⛔ CPF já cadastrado para ${data[0].full_name}. Use outro CPF ou faça login na conta existente.`);
      } else {
        // For non-logged users, offer login
        setCpfExists(`CPF já cadastrado para ${data[0].full_name}. Por favor, faça login na conta existente.`);
      }
    } else {
      setCpfExists(null);
      setExistingUserData(null);
    }
  };

  // ViaCEP integration
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setAddressLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('address', data.logradouro || '');
        form.setValue('province', data.bairro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  // Format CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  // Handle CPF merge
  const handleCpfMerge = async (selections: MergeSelections) => {
    if (!existingUserData) return;
    
    try {
      // Here you would implement the merge logic
      toast({
        title: 'Dados mesclados com sucesso',
        description: 'Os dados foram unificados no cadastro existente.',
      });
      setShowMergeDialog(false);
    } catch (error) {
      toast({
        title: 'Erro ao mesclar dados',
        description: 'Não foi possível unificar os dados.',
        variant: 'destructive',
      });
    }
  };

  // Handle smart form updates (address/contact selection)
  const handleAddressSelect = (addressId: string | null) => {
    selectAddress(addressId);
    const values = getFormValues();
    
    if (values.address) form.setValue('address', values.address);
    if (values.addressNumber) form.setValue('addressNumber', values.addressNumber);
    if (values.complement) form.setValue('complement', values.complement);
    if (values.province) form.setValue('province', values.province);
    if (values.city) form.setValue('city', values.city);
    if (values.state) form.setValue('state', values.state);
    if (values.postalCode) form.setValue('postalCode', values.postalCode);
  };

  const handleContactSelect = (contactId: string | null) => {
    selectContact(contactId);
    const values = getFormValues();
    
    if (values.phone) form.setValue('phone', values.phone);
  };

  const handleNewAddress = () => {
    setShowAddressDialog(true);
  };

  const handleAddressSuccess = async () => {
    setShowAddressDialog(false);
    
    // Refetch addresses and auto-fill form immediately
    const { data: updatedAddresses } = await refetchAddresses();
    
    if (updatedAddresses && updatedAddresses.length > 0) {
      // Get the most recent address (or primary if exists)
      const primaryAddr = updatedAddresses.find(a => a.is_primary);
      const newestAddr = primaryAddr || updatedAddresses[updatedAddresses.length - 1];
      
      if (newestAddr) {
        // Format CEP with mask
        const formattedCep = newestAddr.postal_code 
          ? newestAddr.postal_code.replace(/(\d{5})(\d{3})/, '$1-$2')
          : '';
        
        // Fill form immediately with the new address
        form.setValue('address', newestAddr.street);
        form.setValue('addressNumber', newestAddr.number || '');
        form.setValue('complement', newestAddr.complement || '');
        form.setValue('province', newestAddr.neighborhood || '');
        form.setValue('city', newestAddr.city);
        form.setValue('state', newestAddr.state);
        form.setValue('postalCode', formattedCep);
        
        // Select it in the smart selector if available
        selectAddress(newestAddr.id);
        
        toast({
          title: 'Endereço adicionado',
          description: 'Os campos foram preenchidos automaticamente.',
          duration: 3000,
        });
      }
    }
  };

  const handleSubmit = async (values: CustomerFormData) => {
    // BLOQUEIO TOTAL: Se CPF existe para outro usuário, não permitir
    if (cpfExists && existingUserData) {
      toast({
        title: 'CPF já cadastrado',
        description: user 
          ? 'Este CPF pertence a outro usuário. Use um CPF diferente ou entre em contato com o suporte.'
          : 'Este CPF já está cadastrado. Por favor, faça login na conta existente.',
        variant: 'destructive',
        duration: 8000,
      });
      return; // Block submission completely
    }

    // Prepare signup data if user is not logged in
    let signupData;
    if (!user && values.email && values.password) {
      signupData = {
        email: values.email,
        password: values.password,
        name: values.name,
        cpf: values.cpfCnpj,
      };
    }

    await onSubmit(values, signupData);
  };

  // Error handler for validation failures
  const handleValidationError = (errors: any) => {
    console.log('🚨 Erros de validação:', errors);
    
    // Get first 3 errors
    const errorList = Object.keys(errors).slice(0, 3).map(key => {
      const fieldNames: Record<string, string> = {
        name: 'Nome',
        cpfCnpj: 'CPF/CNPJ',
        phone: 'Telefone',
        postalCode: 'CEP',
        address: 'Endereço',
        addressNumber: 'Número',
        province: 'Bairro',
        city: 'Cidade',
        state: 'UF',
        email: 'Email',
        password: 'Senha',
        confirmPassword: 'Confirmar Senha',
      };
      return fieldNames[key] || key;
    });

    toast({
      title: '⚠️ Corrija os campos obrigatórios',
      description: `Verifique: ${errorList.join(', ')}`,
      variant: 'destructive',
      duration: 10000,
    });

    // Focus on first error field
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!user ? 'Cadastro e Dados para Assinatura' : 'Dados para Assinatura'}
          </DialogTitle>
          <DialogDescription>
            {!user ? (
              'Preencha seus dados para criar uma conta e assinar o plano.'
            ) : userProfile ? (
              'Alguns dados foram preenchidos automaticamente com informações do seu perfil.'
            ) : (
              'Complete os dados abaixo para finalizar sua assinatura.'
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleValidationError)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            
            {/* Signup fields for non-authenticated users */}
            {!user && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha *</FormLabel>
                      <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        ℹ️ Use letras, números e símbolos para maior segurança
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha *</FormLabel>
                      <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-medium mb-2">Dados Pessoais e de Cobrança</h3>
                </div>
              </>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2">
                    Nome completo *
                    {userProfile?.full_name && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    CPF/CNPJ *
                    <span className="text-xs text-muted-foreground font-normal">
                      (formato: 000.000.000-00)
                    </span>
                    {userProfile?.cpf && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCpfCnpj(e.target.value);
                        field.onChange(formatted);
                        validateCpf(formatted);
                      }}
                    />
                   </FormControl>
                   {cpfExists && existingUserData && (
                     <div className="text-sm p-3 rounded-md bg-destructive/10 border border-destructive/30 mt-2">
                       <p className="font-medium text-destructive mb-2">{cpfExists}</p>
                       {!user && (
                         <div className="flex gap-2 flex-wrap">
                           <Button 
                             variant="outline" 
                             size="sm"
                             asChild
                             className="h-8"
                           >
                             <a href="/auth">Fazer Login</a>
                           </Button>
                           <Button 
                             variant="link" 
                             size="sm" 
                             className="p-0 h-8 text-destructive"
                             onClick={() => setShowMergeDialog(true)}
                           >
                             Ou mesclar dados →
                           </Button>
                         </div>
                       )}
                     </div>
                   )}
                   {cpfExists && !existingUserData && (
                     <p className="text-sm text-muted-foreground mt-1">{cpfExists}</p>
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
               control={form.control}
               name="phone"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel className="flex items-center gap-2">
                     Telefone *
                     {userProfile?.phone && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                   </FormLabel>
                   <FormControl>
                     <Input placeholder="(00) 00000-0000" {...field} />
                   </FormControl>
                   <p className="text-xs text-muted-foreground mt-1">
                     📞 Com DDD (10-11 dígitos). Exemplo: (51) 99999-9999
                   </p>
                   <FormMessage />
                   {/* Smart contact selector for logged users */}
                   {user && hasPhoneContacts() && !editingContact && (
                     <div className="mt-2 space-y-2">
                       <ContactSelector
                         contacts={getContactSuggestions('phone')}
                         onSelect={handleContactSelect}
                         type="phone"
                       />
                       <Button
                         type="button"
                         variant="link"
                         size="sm"
                         className="p-0 h-auto text-xs text-primary"
                         onClick={() => setEditingContact(true)}
                       >
                         + Usar novo telefone
                       </Button>
                     </div>
                   )}
                   {user && editingContact && (
                     <Button
                       type="button"
                       variant="link"
                       size="sm"
                       className="p-0 h-auto text-xs mt-1"
                       onClick={() => setEditingContact(false)}
                     >
                       ← Voltar aos telefones cadastrados
                     </Button>
                   )}
                 </FormItem>
               )}
             />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP *</FormLabel>
                  <p className="text-xs text-muted-foreground mb-1">
                    📮 Formato: 12345-678 (busca automática de endereço)
                  </p>
                  <FormControl>
                    <Input 
                      placeholder="00000-000" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
                        field.onChange(value);
                        if (value.length === 9) {
                          fetchAddressByCep(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2">
                    Endereço *
                    {addressLoading && <span className="text-xs text-muted-foreground">Carregando...</span>}
                  </FormLabel>
                  <FormControl><Input placeholder="Rua, Avenida..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número *</FormLabel>
                  <FormControl><Input placeholder="123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento (opcional)</FormLabel>
                  <FormControl><Input placeholder="Apto, bloco..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro *</FormLabel>
                  <FormControl><Input placeholder="Bairro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Cidade *
                    {userProfile?.city && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Estado (UF) *
                    <span className="text-xs text-muted-foreground font-normal">(ex.: RS, SP)</span>
                    {userProfile?.state && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="RS" 
                      {...field}
                      maxLength={2}
                      onChange={(e) => {
                        const normalized = e.target.value.toUpperCase().slice(0, 2);
                        field.onChange(normalized);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                 </FormItem>
               )}
             />

              {/* Smart address selector for logged users */}
              {user && (
                <div className="md:col-span-2">
                  {hasAddresses() && !editingAddress ? (
                    <div className="space-y-2 mt-4">
                      <AddressSelector
                        addresses={getAddressSuggestions()}
                        onSelect={handleAddressSelect}
                        onNewAddress={handleNewAddress}
                        title="Usar endereço cadastrado"
                      />
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-primary"
                        onClick={() => {
                          setEditingAddress(true);
                          // Limpar campos de endereço para nova entrada
                          form.setValue('address', '');
                          form.setValue('addressNumber', '');
                          form.setValue('complement', '');
                          form.setValue('province', '');
                          form.setValue('city', '');
                          form.setValue('state', '');
                          form.setValue('postalCode', '');
                        }}
                      >
                        + Usar novo endereço
                      </Button>
                    </div>
                  ) : hasAddresses() && editingAddress ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs mt-1"
                      onClick={() => {
                        setEditingAddress(false);
                        // Restaurar endereço primário
                        const values = autoFillPrimary();
                        if (values.address) form.setValue('address', values.address);
                        if (values.addressNumber) form.setValue('addressNumber', values.addressNumber);
                        if (values.complement) form.setValue('complement', values.complement);
                        if (values.province) form.setValue('province', values.province);
                        if (values.city) form.setValue('city', values.city);
                        if (values.state) form.setValue('state', values.state);
                        if (values.postalCode) form.setValue('postalCode', values.postalCode);
                      }}
                    >
                      ← Voltar aos endereços cadastrados
                    </Button>
                  ) : (
                    <div className="mt-4 p-4 border border-dashed rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhum endereço cadastrado
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNewAddress}
                      >
                        Cadastrar Primeiro Endereço
                      </Button>
                    </div>
                  )}
                </div>
              )}

             <DialogFooter className="md:col-span-2 flex gap-2 justify-end mt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button 
                type="submit" 
                disabled={loading}
                onClick={() => {
                  console.log('🔍 Estado do botão Continuar:', {
                    loading,
                    cpfExists,
                    existingUserData: !!existingUserData,
                    user: !!user,
                    formValues: form.getValues(),
                  });
                }}
              >
                {loading ? 'Processando...' : !user ? 'Criar Conta e Assinar' : 'Continuar'}
              </Button>
            </DialogFooter>
          </form>
         </Form>
       </DialogContent>
       
        {/* CPF Merge Dialog */}
        {existingUserData && (
          <CpfMergeDialog
            open={showMergeDialog}
            onClose={() => setShowMergeDialog(false)}
            onMerge={handleCpfMerge}
            existingUser={existingUserData}
            newUserData={{
              name: form.getValues('name'),
              email: form.getValues('email'),
              phone: form.getValues('phone'),
              cpf: form.getValues('cpfCnpj'),
            }}
            loading={loading}
          />
        )}

        {/* Address Form Dialog */}
        <AddressFormDialog
          open={showAddressDialog}
          onClose={() => setShowAddressDialog(false)}
          onSuccess={handleAddressSuccess}
        />
     </Dialog>
   );
 };

 export default CustomerInfoDialog;
