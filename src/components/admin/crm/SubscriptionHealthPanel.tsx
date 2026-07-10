import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, RefreshCcw, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Row = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  business_id: string | null;
  business_name: string | null;
  business_active: boolean | null;
  subscription_status: string | null;
  subscription_renewal_date: string | null;
  external_subscription_id: string | null;
  is_complimentary: boolean | null;
  health_status: string;
};

const STATUS_META: Record<string, { label: string; variant: 'default'|'secondary'|'destructive'|'outline'; icon: typeof CheckCircle2 }> = {
  healthy: { label: 'Saudável', variant: 'default', icon: CheckCircle2 },
  inconsistent_active_off: { label: 'INCONSISTENTE', variant: 'destructive', icon: AlertTriangle },
  grace_period: { label: 'Grace period', variant: 'secondary', icon: Clock },
  inactive: { label: 'Inativo', variant: 'outline', icon: XCircle },
  complimentary: { label: 'Cortesia', variant: 'secondary', icon: CheckCircle2 },
  unknown: { label: 'Desconhecido', variant: 'outline', icon: AlertTriangle },
};

export function SubscriptionHealthPanel() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subscriber-status'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_subscriber_status' as any).select('*').limit(1000);
      if (error) throw error;
      return ((data ?? []) as unknown) as Row[];
    },
  });

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.health_status] = (acc[r.health_status] ?? 0) + 1;
    return acc;
  }, {});

  const runReconcile = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reconcile-subscriptions');
      if (error) throw error;
      const r = data?.result ?? {};
      toast.success(
        `Reconciliação concluída: ${r.fixed_active_business_off ?? 0} reativados, ${r.fixed_duplicates ?? 0} duplicatas, ${r.fixed_recent_payment ?? 0} pagamentos recentes`
      );
      qc.invalidateQueries({ queryKey: ['subscriber-status'] });
    } catch (e) {
      toast.error('Falha ao reconciliar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRunning(false);
    }
  };

  const inconsistent = rows.filter((r) => r.health_status === 'inconsistent_active_off');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['healthy','inconsistent_active_off','grace_period','inactive','complimentary'] as const).map((k) => {
          const meta = STATUS_META[k];
          const Icon = meta.icon;
          return (
            <Card key={k}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                    <p className="text-2xl font-bold">{counts[k] ?? 0}</p>
                  </div>
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saúde das Assinaturas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reconciliação diária às 05:00 UTC. Use o botão para rodar agora.
            </p>
          </div>
          <Button onClick={runReconcile} disabled={running}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Reconciliar agora
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : inconsistent.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Nenhuma inconsistência detectada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuária</TableHead>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inconsistent.map((r) => (
                    <TableRow key={`${r.user_id}-${r.business_id}`}>
                      <TableCell>
                        <div className="font-medium">{r.full_name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>{r.business_name}</TableCell>
                      <TableCell className="text-xs">{r.external_subscription_id}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Inconsistente</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}