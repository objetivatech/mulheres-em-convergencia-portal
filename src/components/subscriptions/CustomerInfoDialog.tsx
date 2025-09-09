import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
  // If email is provided, password and confirmPassword are required
  if (data.email) {
    return data.password && data.confirmPassword && data.password === data.confirmPassword;
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
  const [cpfExists, setCpfExists] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
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

  // Pre-fill form with user profile data when dialog opens
  useEffect(() => {
    if (open && userProfile) {
      const updates: Partial<CustomerFormData> = {};
      
      if (userProfile.full_name) updates.name = userProfile.full_name;
      if (userProfile.cpf) updates.cpfCnpj = userProfile.cpf;
      if (userProfile.phone) updates.phone = userProfile.phone;
      if (userProfile.city) updates.city = userProfile.city;
      if (userProfile.state) updates.state = userProfile.state;
      
      // Reset form with new values
      form.reset({
        name: updates.name || '',
        cpfCnpj: updates.cpfCnpj || '',
        phone: updates.phone || '',
        postalCode: '',
        address: '',
        addressNumber: '',
        complement: '',
        province: '',
        city: updates.city || '',
        state: updates.state || '',
      });
    }
  }, [open, userProfile, form]);

  // CPF validation and duplicate check
  const validateCpf = async (cpf: string) => {
    if (!cpf || cpf.length < 11) return;
    
    const { data } = await supabase.rpc('get_user_by_cpf', { cpf_input: cpf });
    if (data && data.length > 0 && data[0].id !== user?.id) {
      setCpfExists(`CPF já cadastrado para ${data[0].full_name}`);
    } else {
      setCpfExists(null);
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

  const handleSubmit = async (values: CustomerFormData) => {
    // Check for CPF conflicts if user is logged in
    if (user && cpfExists) {
      return; // Block submission if CPF belongs to another user
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!user ? 'Cadastro e Dados para Assinatura' : 'Dados para Assinatura'}
          </DialogTitle>
          {!user && (
            <p className="text-sm text-muted-foreground">
              Preencha seus dados para criar uma conta e assinar o plano.
            </p>
          )}
          {user && userProfile && (
            <p className="text-sm text-muted-foreground">
              Alguns dados foram preenchidos automaticamente com informações do seu perfil.
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            
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
                    Nome completo
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
                    CPF/CNPJ
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
                  {cpfExists && (
                    <p className="text-sm text-destructive">
                      {cpfExists}. <a href="/auth" className="underline">Faça login na conta existente</a>
                    </p>
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
                    Telefone
                    {userProfile?.phone && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
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
                    Endereço
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
                  <FormLabel>Número</FormLabel>
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
                  <FormLabel>Bairro</FormLabel>
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
                    Cidade
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
                    Estado (UF)
                    {userProfile?.state && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                  </FormLabel>
                  <FormControl><Input placeholder="RS" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="md:col-span-2 flex gap-2 justify-end mt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button 
                type="submit" 
                disabled={loading || !!cpfExists}
              >
                {loading ? 'Processando...' : !user ? 'Criar Conta e Assinar' : 'Continuar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerInfoDialog;
