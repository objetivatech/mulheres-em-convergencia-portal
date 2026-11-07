import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, HeartHandshake, MessageCircle, Sparkles, UserX, Workflow } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import WhatsAppDialog from '@/components/crm/WhatsAppDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRadar, useRadarAcionar, type LinhaRadar } from '@/hooks/useCrmMec';
import { rotuloEtapa } from '@/lib/crm';
import { dataCurta } from '@/components/crm/datas';

const PERIODOS = [
  { v: '30', r: 'Últimos 30 dias' },
  { v: '60', r: 'Últimos 60 dias' },
  { v: '120', r: 'Últimos 4 meses' },
  { v: '365', r: 'Último ano' },
];
const FILTROS = [
  { v: 'oportunidades', r: 'Não associadas e sem conversa aberta' },
  { v: 'sem_retorno', r: 'Ainda sem contato depois do encontro' },
  { v: 'faltaram', r: 'Inscritas que faltaram' },
  { v: 'todas', r: 'Todas as inscritas' },
];

type Grupo = { id: string; titulo: string; inicio: string; online: boolean; portaria: boolean; linhas: LinhaRadar[]; total: number; presentes: number };

export default function CrmRadar() {
  const { toast } = useToast();
  const [dias, setDias] = useState('120');
  const [filtro, setFiltro] = useState('oportunidades');
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [wa, setWa] = useState<string | null>(null);
  const { data, isLoading } = useRadar(Number(dias));
  const acionar = useRadarAcionar();

  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>();
    for (const l of data ?? []) {
      const g = mapa.get(l.evento_id) ?? {
        id: l.evento_id, titulo: l.evento_titulo, inicio: l.evento_inicio, online: l.evento_online,
        portaria: l.evento_tem_portaria, linhas: [], total: 0, presentes: 0,
      };
      g.total += 1;
      if (l.compareceu) g.presentes += 1;
      const passa =
        filtro === 'todas' ? true
          : filtro === 'faltaram' ? l.evento_tem_portaria && !l.compareceu
            : filtro === 'sem_retorno' ? !l.contato_depois && !l.tarefa_feita
              : !l.assinante && !l.oportunidade_id && (!l.evento_tem_portaria || l.compareceu);
      if (passa) g.linhas.push(l);
      mapa.set(l.evento_id, g);
    }
    return [...mapa.values()];
  }, [data, filtro]);

  const alternar = (ev: string, p: string, marcado: boolean) =>
    setSel((s) => ({ ...s, [ev]: marcado ? [...new Set([...(s[ev] ?? []), p])] : (s[ev] ?? []).filter((x) => x !== p) }));

  const executar = async (g: Grupo, acao: 'oportunidade' | 'agradecer' | 'sentimos_falta') => {
    const pessoas = sel[g.id] ?? [];
    if (!pessoas.length) return;
    try {
      const r = await acionar.mutateAsync({ evento_id: g.id, pessoas, acao });
      const oque = acao === 'oportunidade' ? 'oportunidade(s) aberta(s) no funil, com tarefa para amanhã' : 'tarefa(s) criada(s) para amanhã';
      toast({
        title: `${r.criadas} ${oque}`,
        description: r.ja_existiam ? `${r.ja_existiam} pessoa(s) já tinham isso e não foram duplicadas.` : undefined,
      });
      setSel((s) => ({ ...s, [g.id]: [] }));
    } catch (e: any) {
      toast({ title: 'Não foi possível concluir', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <CrmLayout
      titulo="CRM · Radar pós-encontro"
      descricao="Quem esteve nos encontros e merece um próximo passo: agradecer, convidar para associar ou dizer que sentimos falta."
    >
      <div className="mb-4 flex flex-wrap gap-2" data-tour="crm-radar-filtros">
        <Select value={dias} onValueChange={setDias}>
          <SelectTrigger className="w-[190px]" aria-label="Período"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODOS.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-[300px]" aria-label="Quem mostrar"><SelectValue /></SelectTrigger>
          <SelectContent>{FILTROS.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : !grupos.length ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum encontro com inscritas confirmadas neste período.
        </p>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => {
            const marcadas = sel[g.id] ?? [];
            const selecionaveis = g.linhas.filter((l) => l.pessoa_id).map((l) => l.pessoa_id!);
            const todas = selecionaveis.length > 0 && selecionaveis.every((p) => marcadas.includes(p));
            return (
              <section key={g.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
                <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-bold"><CalendarDays className="h-4 w-4 text-primary" /> {g.titulo}</h2>
                    <p className="text-xs text-muted-foreground">
                      {dataCurta(g.inicio)} · {g.online ? 'Online' : 'Presencial'} · {g.total} inscrita(s)
                      {g.portaria ? ` · ${g.presentes} presença(s) na portaria` : ' · presença não registrada na portaria (mostramos todas as inscritas)'}
                    </p>
                  </div>
                  <Link to={`/painel-conteudo/eventos/${g.id}`} className="text-xs text-primary underline underline-offset-2">Abrir o encontro</Link>
                </header>

                {!g.linhas.length ? (
                  <p className="text-sm text-muted-foreground">Ninguém neste filtro. 🎉</p>
                ) : (
                  <>
                    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 p-2" data-tour="crm-radar-acoes">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={todas}
                          onCheckedChange={(v) => setSel((s) => ({ ...s, [g.id]: v === true ? selecionaveis : [] }))}
                          aria-label="Selecionar todas"
                        />
                        {marcadas.length ? `${marcadas.length} selecionada(s)` : 'Selecionar todas'}
                      </label>
                      <div className="ml-auto flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={!marcadas.length || acionar.isPending} onClick={() => executar(g, 'agradecer')}>
                          <HeartHandshake className="mr-1 h-4 w-4" /> Tarefa: agradecer
                        </Button>
                        <Button size="sm" variant="outline" disabled={!marcadas.length || acionar.isPending} onClick={() => executar(g, 'sentimos_falta')}>
                          <UserX className="mr-1 h-4 w-4" /> Tarefa: sentimos sua falta
                        </Button>
                        <Button size="sm" disabled={!marcadas.length || acionar.isPending} onClick={() => executar(g, 'oportunidade')}>
                          <Workflow className="mr-1 h-4 w-4" /> Abrir no funil
                        </Button>
                      </div>
                    </div>
                    <ul className="divide-y divide-border">
                      {g.linhas.map((l) => (
                        <li key={l.inscricao_id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                          {l.pessoa_id ? (
                            <Checkbox
                              checked={marcadas.includes(l.pessoa_id)}
                              onCheckedChange={(v) => alternar(g.id, l.pessoa_id!, v === true)}
                              aria-label={`Selecionar ${l.nome}`}
                            />
                          ) : <span className="w-4" />}
                          <div className="min-w-0 flex-1">
                            {l.pessoa_id
                              ? <Link to={rotaCrm.ficha(l.pessoa_id)} className="font-medium hover:underline">{l.nome}</Link>
                              : <span className="font-medium">{l.nome} <span className="text-xs text-muted-foreground">(sem ficha)</span></span>}
                            <p className="text-xs text-muted-foreground">{[l.telefone, l.email].filter(Boolean).join(' · ') || 'sem contato'}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {l.assinante && <Badge className="text-[10px]">Associada</Badge>}
                              {g.portaria && (l.compareceu
                                ? <Badge variant="secondary" className="text-[10px]">Presente</Badge>
                                : <Badge variant="outline" className="text-[10px]">Faltou</Badge>)}
                              {l.etapa && <Badge variant="secondary" className="text-[10px]">Funil: {rotuloEtapa(l.etapa)}</Badge>}
                              {l.contato_depois && <Badge variant="outline" className="text-[10px]">Contato em {dataCurta(l.contato_depois)}</Badge>}
                              {l.tarefa_aberta && <Badge variant="outline" className="text-[10px]">Tarefa aberta</Badge>}
                              {l.tarefa_feita && <Badge variant="outline" className="text-[10px]"><Sparkles className="mr-0.5 h-3 w-3" /> Tarefa feita</Badge>}
                              {l.whatsapp_recusado && <Badge variant="destructive" className="text-[10px]">Não quer WhatsApp</Badge>}
                            </div>
                          </div>
                          {l.pessoa_id && l.telefone && (
                            <Button size="sm" variant="outline" disabled={l.whatsapp_recusado} onClick={() => setWa(l.pessoa_id)} aria-label={`WhatsApp para ${l.nome}`}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      <WhatsAppDialog pessoaId={wa} aberto={!!wa} categoriaInicial="reconexao" onFechar={() => setWa(null)} />
    </CrmLayout>
  );
}
