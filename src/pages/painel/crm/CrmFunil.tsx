import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import OportunidadeDialog from '@/components/crm/OportunidadeDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOportunidades, useSalvarOportunidade } from '@/hooks/useCrmMec';
import { ETAPAS, diasDesde } from '@/lib/crm';
import { dinheiro } from '@/hooks/usePlanosEventos';

export default function CrmFunil() {
  const { data, isLoading } = useOportunidades();
  const salvar = useSalvarOportunidade();
  const { toast } = useToast();
  const [verEncerradas, setVerEncerradas] = useState(false);
  const [fechar, setFechar] = useState<{ op: any; etapa: string } | null>(null);

  const colunas = useMemo(() => {
    const limite = Date.now() - 90 * 864e5;
    return ETAPAS.filter((e) => verEncerradas || !e.fechada).map((e) => {
      const itens = (data ?? []).filter((o) => o.etapa === e.v && (!e.fechada || new Date(o.fechada_em ?? o.atualizado_em).getTime() >= limite));
      return { ...e, itens, total: itens.reduce((s, o) => s + (o.valor_centavos ?? 0), 0) };
    });
  }, [data, verEncerradas]);

  const abertas = (data ?? []).filter((o) => !o.fechada_em);
  const conversao = useMemo(() => {
    const fechadas = (data ?? []).filter((o) => o.fechada_em);
    const ganhas = fechadas.filter((o) => o.etapa === 'associada').length;
    return fechadas.length ? Math.round((ganhas / fechadas.length) * 100) : null;
  }, [data]);

  const mover = (op: any, etapa: string) => {
    if (['sem_interesse', 'perdida'].includes(etapa)) return setFechar({ op, etapa });
    salvar.mutateAsync({ id: op.id, valores: { etapa } })
      .catch((e) => toast({ title: 'Não foi possível mover', description: e.message, variant: 'destructive' }));
  };

  const proxima = (etapa: string) => {
    const i = ETAPAS.findIndex((e) => e.v === etapa);
    const n = ETAPAS[i + 1];
    return n && !n.fechada ? n.v : i === 3 ? 'associada' : null;
  };

  return (
    <CrmLayout titulo="CRM · Funil" descricao="Em que ponto está cada conversa sobre associação.">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <span><strong>{abertas.length}</strong> em andamento · {dinheiro(abertas.reduce((s, o) => s + (o.valor_centavos ?? 0), 0))} esperados</span>
        {conversao !== null && <span className="text-muted-foreground">Taxa de associação das encerradas: {conversao}%</span>}
        <label className="ml-auto flex items-center gap-2">
          <Switch checked={verEncerradas} onCheckedChange={setVerEncerradas} />
          <Label>Mostrar encerradas (90 dias)</Label>
        </label>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !(data ?? []).length ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma oportunidade ainda. Abra a ficha de uma pessoa e clique em "Abrir oportunidade".
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" data-tour="crm-funil">
          {colunas.map((c) => (
            <section key={c.v} className="w-72 shrink-0 rounded-[var(--radius)] border border-border bg-card p-3">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold">{c.r}</h2>
                <span className="text-xs text-muted-foreground">{c.itens.length} · {dinheiro(c.total)}</span>
              </header>
              <ul className="space-y-2">
                {c.itens.map((o) => {
                  const prox = !c.fechada ? proxima(o.etapa) : null;
                  const parada = !c.fechada && (diasDesde(o.atualizado_em) ?? 0) >= 7;
                  return (
                    <li key={o.id} className="rounded-xl border border-border bg-background p-3 space-y-2">
                      <Link to={rotaCrm.ficha(o.pessoa_id)} className="block text-sm font-semibold hover:underline">
                        {o.pessoa?.nome_social || o.pessoa?.nome}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {o.plano?.nome ?? 'Plano a definir'} · {dinheiro(o.valor_centavos ?? 0)}
                      </p>
                      {o.proxima_acao && <p className="text-xs">→ {o.proxima_acao}</p>}
                      {o.motivo && c.fechada && <p className="text-xs text-muted-foreground">Motivo: {o.motivo}</p>}
                      <p className={parada ? 'text-xs font-semibold text-destructive' : 'text-xs text-muted-foreground'}>
                        {diasDesde(o.atualizado_em)} dia(s) sem mudança
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Select value={o.etapa} onValueChange={(v) => mover(o, v)}>
                          <SelectTrigger className="h-8 text-xs" aria-label="Mudar etapa"><SelectValue /></SelectTrigger>
                          <SelectContent>{ETAPAS.map((e) => <SelectItem key={e.v} value={e.v}>{e.r}</SelectItem>)}</SelectContent>
                        </Select>
                        {prox && (
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => mover(o, prox)} aria-label="Avançar etapa">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {!c.itens.length && <p className="text-xs text-muted-foreground">Nada por aqui.</p>}
              </ul>
            </section>
          ))}
        </div>
      )}

      {fechar && (
        <OportunidadeDialog
          aberto
          onFechar={() => setFechar(null)}
          pessoaId={fechar.op.pessoa_id}
          oportunidade={fechar.op}
          etapaInicial={fechar.etapa}
        />
      )}
    </CrmLayout>
  );
}
