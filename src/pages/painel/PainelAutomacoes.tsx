import PainelLayout from '@/components/painel/PainelLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAutomacoes, useReprocessarWebhooks } from '@/hooks/useAdminNovo';

const quando = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PainelAutomacoes() {
  const { data, isLoading } = useAutomacoes();
  const reprocessar = useReprocessarWebhooks();
  const { toast } = useToast();

  const rodar = async () => {
    try {
      await reprocessar.mutateAsync();
      toast({ title: 'Reprocessamento iniciado', description: 'Os avisos com erro serão tentados de novo.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível reprocessar', description: e.message, variant: 'destructive' });
    }
  };

  const comErro = (data?.webhooks ?? []).filter((w) => w.erro || !w.processado_em);

  return (
    <PainelLayout
      titulo="Automações"
      descricao="Avisos de pagamento, liberações de acesso e comunicados."
      acoes={
        <Button size="sm" variant="outline" onClick={rodar} disabled={reprocessar.isPending}>
          {reprocessar.isPending ? 'Reprocessando…' : 'Reprocessar avisos'}
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Avisos com problema</p>
              <p className="text-2xl font-semibold">{comErro.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Cobranças aguardando</p>
              <p className="text-2xl font-semibold">{data?.pendentes.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Liberações recentes</p>
              <p className="text-2xl font-semibold">{data?.concessoes.length ?? 0}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Últimos avisos do Asaas</h2>
            {!data?.webhooks.length ? (
              <p className="text-sm text-muted-foreground">Nenhum aviso recebido ainda.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.webhooks.map((w) => (
                  <li key={w.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{w.tipo_evento ?? w.provedor}</p>
                      <p className="text-xs text-muted-foreground">{quando(w.recebido_em)}</p>
                      {w.erro && <p className="text-xs text-destructive">{w.erro}</p>}
                    </div>
                    <Badge variant={w.processado_em && !w.erro ? 'secondary' : 'outline'}>
                      {w.processado_em && !w.erro ? 'Processado' : `Tentativas: ${w.tentativas ?? 0}`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Liberações de acesso</h2>
            {!data?.concessoes.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma liberação recente.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.concessoes.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <span>{c.pessoa?.nome ?? 'Sem identificação'} · {c.tipo}</span>
                    <span className="text-xs text-muted-foreground">{c.origem} · até {quando(c.fim_em)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Comunicados</h2>
            {!data?.campanhas.length ? (
              <p className="text-sm text-muted-foreground">Nenhum comunicado criado.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.campanhas.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <span>{c.assunto}</span>
                    <Badge variant={c.situacao === 'enviada' ? 'secondary' : 'outline'}>{c.situacao}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link to="/painel-conteudo/comunicados">Abrir comunicados</Link>
            </Button>
          </section>
        </div>
      )}
    </PainelLayout>
  );
}
