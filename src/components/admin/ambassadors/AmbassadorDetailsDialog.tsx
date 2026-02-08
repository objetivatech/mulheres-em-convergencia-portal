import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AmbassadorWithProfile } from '@/hooks/useAmbassadorAdmin';
import { useAmbassador } from '@/hooks/useAmbassador';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Crown, 
  MousePointerClick, 
  TrendingUp, 
  DollarSign, 
  Link as LinkIcon,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface AmbassadorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ambassador: AmbassadorWithProfile | null;
}

export const AmbassadorDetailsDialog = ({
  open,
  onOpenChange,
  ambassador,
}: AmbassadorDetailsDialogProps) => {
  const { useReferrals, useClicks, usePayouts } = useAmbassador();
  
  const { data: referrals } = useReferrals(ambassador?.id);
  const { data: clicks } = useClicks(ambassador?.id);
  const { data: payouts } = usePayouts(ambassador?.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'outline' },
      confirmed: { label: 'Confirmado', variant: 'secondary' },
      paid: { label: 'Pago', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };
    const c = config[status] || { label: status, variant: 'outline' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (!ambassador) return null;

  const conversionRate = ambassador.link_clicks > 0 
    ? ((ambassador.total_sales / ambassador.link_clicks) * 100).toFixed(2) 
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            {ambassador.profile?.full_name || 'Sem nome'}
            {!ambassador.active && (
              <Badge variant="destructive">Inativa</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{ambassador.link_clicks || 0}</p>
                <p className="text-xs text-muted-foreground">Cliques</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{ambassador.total_sales || 0}</p>
                <p className="text-xs text-muted-foreground">Conversões ({conversionRate}%)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(ambassador.total_earnings || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Ganho</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(ambassador.pending_commission || 0)}</p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{ambassador.profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{ambassador.referral_code}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Comissão:</span>
                <span>{ambassador.commission_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cadastro:</span>
                <span>{format(new Date(ambassador.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Dados de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferência:</span>
                <span>{ambassador.payment_preference === 'pix' ? 'PIX' : 'Transferência'}</span>
              </div>
              {ambassador.pix_key && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chave PIX:</span>
                  <span className="truncate max-w-[200px]">{ambassador.pix_key}</span>
                </div>
              )}
              {ambassador.bank_data?.bank_name && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco:</span>
                    <span>{ambassador.bank_data.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agência/Conta:</span>
                    <span>{ambassador.bank_data.agency} / {ambassador.bank_data.account}</span>
                  </div>
                </>
              )}
              {!ambassador.pix_key && !ambassador.bank_data?.bank_name && (
                <p className="text-muted-foreground italic">Nenhum dado cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs com histórico */}
        <Tabs defaultValue="referrals">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referrals">Indicações ({referrals?.length || 0})</TabsTrigger>
            <TabsTrigger value="clicks">Cliques ({clicks?.length || 0})</TabsTrigger>
            <TabsTrigger value="payouts">Pagamentos ({payouts?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="referrals" className="mt-4">
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals?.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell>
                        {format(new Date(ref.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{ref.plan_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ref.sale_amount)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(ref.commission_amount)}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(ref.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!referrals || referrals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhuma indicação registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="clicks" className="mt-4">
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>UTM Source</TableHead>
                    <TableHead>UTM Medium</TableHead>
                    <TableHead>UTM Campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clicks?.slice(0, 50).map((click) => (
                    <TableRow key={click.id}>
                      <TableCell>
                        {format(new Date(click.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{click.utm_source || '-'}</TableCell>
                      <TableCell>{click.utm_medium || '-'}</TableCell>
                      <TableCell>{click.utm_campaign || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(!clicks || clicks.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum clique registrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="payouts" className="mt-4">
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Data Pgto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts?.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.reference_period}</TableCell>
                      <TableCell className="text-center">{payout.total_sales}</TableCell>
                      <TableCell className="text-right">{formatCurrency(payout.net_amount)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {payout.paid_at 
                          ? format(new Date(payout.paid_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!payouts || payouts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhum pagamento registrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
