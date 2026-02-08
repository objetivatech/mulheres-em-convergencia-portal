import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  DollarSign, 
  Check, 
  X, 
  Clock,
  Calendar,
  Plus,
} from 'lucide-react';
import { CreatePayoutDialog } from './CreatePayoutDialog';
import { AmbassadorWithProfile } from '@/hooks/useAmbassadorAdmin';
import { useAmbassadorAdmin } from '@/hooks/useAmbassadorAdmin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminPayoutsListProps {
  payouts: any[];
  isLoading?: boolean;
  ambassadors?: AmbassadorWithProfile[];
}

export const AdminPayoutsList = ({ payouts, isLoading, ambassadors = [] }: AdminPayoutsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [markPaidDialog, setMarkPaidDialog] = useState<{ open: boolean; payout: any | null }>({ 
    open: false, 
    payout: null 
  });
  const [createPayoutOpen, setCreatePayoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentNotes, setPaymentNotes] = useState('');

  const { useMarkPayoutPaid, useCancelPayout } = useAmbassadorAdmin();
  const markPaid = useMarkPayoutPaid();
  const cancelPayout = useCancelPayout();

  const filteredPayouts = payouts.filter(payout => {
    const ambassadorName = payout.ambassador?.profile?.full_name?.toLowerCase() || '';
    const ambassadorEmail = payout.ambassador?.profile?.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = ambassadorName.includes(search) || ambassadorEmail.includes(search);
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'outline' },
      scheduled: { label: 'Agendado', variant: 'secondary' },
      paid: { label: 'Pago', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleMarkPaid = async () => {
    if (!markPaidDialog.payout) return;
    
    await markPaid.mutateAsync({
      payoutId: markPaidDialog.payout.id,
      paymentMethod,
      notes: paymentNotes,
    });
    
    setMarkPaidDialog({ open: false, payout: null });
    setPaymentMethod('pix');
    setPaymentNotes('');
  };

  const handleCancel = async (payoutId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pagamento?')) return;
    await cancelPayout.mutateAsync({ payoutId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamentos ({payouts.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setCreatePayoutOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pagamento
              </Button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar embaixadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="scheduled">Agendados</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Embaixadora</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead className="text-center">Data Agendada</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payout.ambassador?.profile?.full_name || 'Sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payout.ambassador?.profile?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {payout.reference_period}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {payout.total_sales}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payout.gross_amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(payout.net_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {format(new Date(payout.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(payout.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {payout.status === 'pending' || payout.status === 'scheduled' ? (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setMarkPaidDialog({ open: true, payout })}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancel(payout.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : payout.status === 'paid' && payout.paid_at ? (
                        <span className="text-sm text-muted-foreground">
                          Pago em {format(new Date(payout.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para marcar como pago */}
      <Dialog open={markPaidDialog.open} onOpenChange={(open) => setMarkPaidDialog({ open, payout: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Confirmar pagamento para {markPaidDialog.payout?.ambassador?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Período:</span>
                <span className="font-medium">{markPaidDialog.payout?.reference_period}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(markPaidDialog.payout?.net_amount || 0)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Comprovante, código de transação, etc."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialog({ open: false, payout: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid} disabled={markPaid.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar pagamento */}
      <CreatePayoutDialog
        open={createPayoutOpen}
        onOpenChange={setCreatePayoutOpen}
        ambassadors={ambassadors}
      />
    </>
  );
};
