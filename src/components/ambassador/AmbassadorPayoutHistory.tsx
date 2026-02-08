import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Receipt, Clock, CheckCircle, XCircle, CalendarClock } from 'lucide-react';
import { AmbassadorPayout } from '@/hooks/useAmbassador';

interface AmbassadorPayoutHistoryProps {
  payouts: AmbassadorPayout[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  scheduled: { label: 'Agendado', variant: 'outline', icon: CalendarClock },
  paid: { label: 'Pago', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

export const AmbassadorPayoutHistory = ({ payouts, isLoading }: AmbassadorPayoutHistoryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Acompanhe todos os seus pagamentos recebidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pagamento registrado ainda.</p>
            <p className="text-sm">Seus pagamentos aparecerão aqui quando processados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>
              {payouts.length} pagamento(s) no histórico
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Recebido</p>
            <p className="text-xl font-semibold text-primary">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Valor Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                const status = statusConfig[payout.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      {payout.reference_period}
                    </TableCell>
                    <TableCell className="text-center">
                      {payout.total_sales}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payout.gross_amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payout.net_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.paid_at 
                        ? formatDate(payout.paid_at) 
                        : formatDate(payout.scheduled_date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
