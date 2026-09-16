import { useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

  const [importando, setImportando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [asaas, setAsaas] = useState<{ apontandoParaCa: boolean; destinoEsperado: string; webhooks: any[] } | null>(null);

  const verificarAsaas = async () => {
    setVerificando(true);
    try {
      const { data: r, error } = await supabase.functions.invoke('diagnostico-asaas', { body: {} });
      if (error) throw error;
      if ((r as any)?.error) throw new Error((r as any).error);
      setAsaas(r as any);
      toast({
        title: (r as any).apontandoParaCa ? 'Asaas conectado ao portal novo' : 'Asaas ainda não aponta para o portal novo',
        description: (r as any).apontandoParaCa
          ? 'Os avisos de pagamento chegam aqui.'
          : 'Atualize o endereço de aviso no painel do Asaas.',
        variant: (r as any).apontandoParaCa ? undefined : 'destructive',
      });
    } catch (e: any) {
      toast({ title: 'Não foi possível verificar o Asaas', description: e?.message, variant: 'destructive' });
    } finally {
      setVerificando(false);
    }
  };


  const importarAcessos = async () => {
    setImportando(true);
    try {
      const { data: r, error } = await supabase.functions.invoke('migrar-legado', {
        body: { acao: 'migrar', alvos: ['acessos'] },
      });
      if (error) throw error;
      if ((r as any)?.error) throw new Error((r as any).error);
      const a = (r as any)?.resumo?.acessos ?? {};
      toast({
        title: 'Acessos trazidos do site antigo',
        description: `${a.concessoes_criadas ?? 0} liberações criadas · ${a.sem_pessoa_correspondente ?? 0} sem pessoa correspondente.`,
      });
    } catch (e: any) {
      toast({ title: 'Não foi possível trazer os acessos', description: e?.message, variant: 'destructive' });
    } finally {
      setImportando(false);
    }
  };

  const comErro = (data?.webhooks ?? []).filter((w) => w.erro || !w.processado_em);

  return (
    <PainelLayout
      titulo="Automações"
      descricao="Avisos de pagamento, liberações de acesso e comunicados."
      acoes={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={importarAcessos} disabled={importando}>
            {importando ? 'Trazendo…' : 'Trazer acessos do site antigo'}
          </Button>
          <Button size="sm" variant="outline" onClick={verificarAsaas} disabled={verificando}>
            {verificando ? 'Verificando…' : 'Verificar conexão com o Asaas'}
          </Button>
          <Button size="sm" variant="outline" onClick={rodar} disabled={reprocessar.isPending}>
            {reprocessar.isPending ? 'Reprocessando…' : 'Reprocessar avisos'}
          </Button>

        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="space-y-6">
          {asaas && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-semibold">
                {asaas.apontandoParaCa ? 'Asaas conectado ao portal novo' : 'Asaas ainda não aponta para o portal novo'}
              </p>
              <p className="text-xs text-muted-foreground break-all mt-1">Endereço esperado: {asaas.destinoEsperado}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {asaas.webhooks.map((w, i) => (
                  <li key={i} className="break-all">
                    {w.nome ?? 'Aviso'} · {w.url} · {w.ativo === false ? 'desligado' : 'ativo'}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
