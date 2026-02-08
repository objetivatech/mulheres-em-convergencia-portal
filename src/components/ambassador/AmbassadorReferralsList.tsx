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
import { Users, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { AmbassadorReferral } from '@/hooks/useAmbassador';

interface AmbassadorReferralsListProps {
  referrals: AmbassadorReferral[];
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
  confirmed: { label: 'Confirmada', variant: 'default', icon: CheckCircle },
  paid: { label: 'Paga', variant: 'outline', icon: Wallet },
  cancelled: { label: 'Cancelada', variant: 'destructive', icon: XCircle },
};

export const AmbassadorReferralsList = ({ referrals, isLoading }: AmbassadorReferralsListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Indicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Indicações
          </CardTitle>
          <CardDescription>
            Acompanhe todas as suas indicações e comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não possui indicações.</p>
            <p className="text-sm">Compartilhe seu link para começar a ganhar!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totalConfirmed = referrals
    .filter(r => r.status === 'confirmed' || r.status === 'paid')
    .reduce((sum, r) => sum + r.commission_amount, 0);
  
  const totalPending = referrals
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.commission_amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Minhas Indicações
            </CardTitle>
            <CardDescription>
              {referrals.length} indicação(ões) no total
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Confirmado</p>
              <p className="font-semibold text-primary">{formatCurrency(totalConfirmed)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Pendente</p>
              <p className="font-semibold text-muted-foreground">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Elegível em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => {
                const status = statusConfig[referral.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {formatDate(referral.created_at)}
                    </TableCell>
                    <TableCell>{referral.plan_name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(referral.sale_amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(referral.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {referral.payout_eligible_date 
                        ? formatDate(referral.payout_eligible_date) 
                        : '-'}
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
