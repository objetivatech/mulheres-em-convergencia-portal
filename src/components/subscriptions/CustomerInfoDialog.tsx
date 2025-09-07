import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

interface CustomerInfoDialogProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
}

const CustomerInfoDialog: React.FC<CustomerInfoDialogProps> = ({ open, loading, onClose, onSubmit }) => {
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

  const handleSubmit = async (values: CustomerFormData) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dados para Assinatura</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome completo</FormLabel>
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
                  <FormLabel>CPF/CNPJ</FormLabel>
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
                  <FormLabel>Telefone</FormLabel>
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
                  <FormLabel>Cidade</FormLabel>
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
                  <FormLabel>Estado (UF)</FormLabel>
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
