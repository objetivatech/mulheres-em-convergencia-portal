import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
}

const CustomerInfoDialog: React.FC<CustomerInfoDialogProps> = ({ open, loading, userProfile, onClose, onSubmit }) => {
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

  const handleSubmit = async (values: CustomerFormData) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dados para Assinatura</DialogTitle>
          {userProfile && (
            <p className="text-sm text-muted-foreground">
              Alguns dados foram preenchidos automaticamente com informações do seu perfil.
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
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
                  <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
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
              <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerInfoDialog;
