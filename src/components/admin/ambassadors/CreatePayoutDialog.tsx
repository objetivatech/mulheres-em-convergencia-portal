import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, FileText, User } from 'lucide-react';
import { useAmbassadorAdmin, AmbassadorWithProfile } from '@/hooks/useAmbassadorAdmin';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreatePayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ambassadors: AmbassadorWithProfile[];
  preselectedAmbassador?: AmbassadorWithProfile | null;
}

const manualPayoutSchema = z.object({
  ambassadorId: z.string().min(1, 'Selecione uma embaixadora'),
  referencePeriod: z.string().min(1, 'Informe o período de referência'),
  totalSales: z.number().min(0, 'Número de vendas deve ser positivo'),
  grossAmount: z.number().min(0.01, 'Valor bruto deve ser maior que zero'),
  netAmount: z.number().min(0.01, 'Valor líquido deve ser maior que zero'),
  scheduledDate: z.string().min(1, 'Selecione a data do pagamento'),
  notes: z.string().optional(),
});

type ManualPayoutForm = z.infer<typeof manualPayoutSchema>;

export const CreatePayoutDialog = ({
  open,
  onOpenChange,
  ambassadors,
  preselectedAmbassador,
}: CreatePayoutDialogProps) => {
  const [mode, setMode] = useState<'manual' | 'pending'>('manual');
  const [selectedAmbassador, setSelectedAmbassador] = useState<AmbassadorWithProfile | null>(null);
  
  const { useCreatePayout } = useAmbassadorAdmin();
  const createPayout = useCreatePayout();

  const form = useForm<ManualPayoutForm>({
    resolver: zodResolver(manualPayoutSchema),
    defaultValues: {
      ambassadorId: '',
      referencePeriod: format(new Date(), 'yyyy-MM'),
      totalSales: 0,
      grossAmount: 0,
      netAmount: 0,
      scheduledDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // Atualizar quando preselectedAmbassador mudar
  useEffect(() => {
    if (preselectedAmbassador && open) {
      form.setValue('ambassadorId', preselectedAmbassador.id);
      setSelectedAmbassador(preselectedAmbassador);
    }
  }, [preselectedAmbassador, open, form]);

  // Atualizar embaixadora selecionada quando mudar no form
  const watchAmbassadorId = form.watch('ambassadorId');
  useEffect(() => {
    const amb = ambassadors.find(a => a.id === watchAmbassadorId);
    setSelectedAmbassador(amb || null);
  }, [watchAmbassadorId, ambassadors]);

  // Auto-calcular net_amount baseado em gross_amount e taxa
  const watchGrossAmount = form.watch('grossAmount');
  useEffect(() => {
    if (selectedAmbassador && watchGrossAmount > 0) {
      // Net = Gross (sem deduções por padrão, mas pode-se customizar)
      form.setValue('netAmount', watchGrossAmount);
    }
  }, [watchGrossAmount, selectedAmbassador, form]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (data: ManualPayoutForm) => {
    await createPayout.mutateAsync({
      ambassadorId: data.ambassadorId,
      referenceMonth: data.referencePeriod,
      totalSales: data.totalSales,
      grossAmount: data.grossAmount,
      netAmount: data.netAmount,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
    });
    
    form.reset();
    onOpenChange(false);
  };

  const handleCreateFromPending = async (ambassador: AmbassadorWithProfile) => {
    if (!ambassador.pending_commission || ambassador.pending_commission <= 0) return;
    
    await createPayout.mutateAsync({
      ambassadorId: ambassador.id,
      referenceMonth: format(new Date(), 'yyyy-MM'),
      totalSales: ambassador.total_sales || 0,
      grossAmount: ambassador.pending_commission,
      netAmount: ambassador.pending_commission,
      scheduledDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
      notes: 'Gerado automaticamente a partir de comissões pendentes',
    });
    
    onOpenChange(false);
  };

  const ambassadorsWithPending = ambassadors.filter(
    a => a.active && (a.pending_commission || 0) > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Novo Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre um pagamento para uma embaixadora. O registro gerará uma notificação automática.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'pending')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Comissões Pendentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ambassadorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embaixadora</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma embaixadora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ambassadors.filter(a => a.active).map((amb) => (
                            <SelectItem key={amb.id} value={amb.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {amb.profile?.full_name || 'Sem nome'} 
                                <span className="text-muted-foreground">
                                  ({amb.referral_code})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedAmbassador && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Taxa de Comissão:</span>
                          <span className="ml-2 font-medium">{selectedAmbassador.commission_rate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comissão Pendente:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {formatCurrency(selectedAmbassador.pending_commission || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PIX:</span>
                          <span className="ml-2 font-medium">
                            {selectedAmbassador.pix_key || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Preferência:</span>
                          <span className="ml-2 font-medium">
                            {selectedAmbassador.payment_preference === 'pix' ? 'PIX' : 'Transferência'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referencePeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período de Referência</FormLabel>
                        <FormControl>
                          <Input type="month" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalSales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Vendas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grossAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Bruto (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Líquido (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Pagamento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Comprovante, código de transação, informações adicionais..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPayout.isPending}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <div className="space-y-4">
              {ambassadorsWithPending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma embaixadora com comissões pendentes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selecione uma embaixadora para gerar um pagamento baseado nas comissões pendentes:
                  </p>
                  {ambassadorsWithPending.map((amb) => (
                    <Card 
                      key={amb.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {amb.profile?.full_name || 'Sem nome'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {amb.profile?.email} • {amb.referral_code}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Pendente</p>
                              <p className="font-bold text-green-600">
                                {formatCurrency(amb.pending_commission || 0)}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleCreateFromPending(amb)}
                              disabled={createPayout.isPending}
                              size="sm"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Criar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
