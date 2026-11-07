import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Upload, ListChecks, CheckCircle2, AlertTriangle, History } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  importarLote, iniciarImportacao, previaImportacao, useImportacoes, type PreviaLinha, type ResultadoLinha,
} from '@/hooks/useCrmMec';
import {
  CAMPOS_IMPORTACAO, emLotes, lerPlanilha, montarLinhas, repetidasNaPlanilha, sugerirMapeamento,
  type CampoImportacao, type LinhaImportacao,
} from '@/lib/crmImportacao';
import { ORIGENS, rotuloOrigem } from '@/lib/crm';
import { dataHora } from '@/components/crm/datas';
import { cn } from '@/lib/utils';

const LIMITE = 5000;
const ACOES: Record<string, { r: string; cor: string }> = {
  criar: { r: 'Nova ficha', cor: 'bg-success/15 text-success' },
  completar: { r: 'Já existe: completar', cor: 'bg-primary/10 text-primary' },
  repetida: { r: 'Repetida na planilha', cor: 'bg-muted text-muted-foreground' },
  conflito: { r: 'Conflito: conferir', cor: 'bg-warning/15 text-warning' },
  erro: { r: 'Não dá para importar', cor: 'bg-destructive/10 text-destructive' },
};

type Linha = LinhaImportacao & { previa?: PreviaLinha; repetidaDe?: number; incluir: boolean };

function Passo({ n, titulo, ativo, children }: { n: number; titulo: string; ativo: boolean; children: any }) {
  return (
    <section className={cn('rounded-[var(--radius)] border bg-card p-4', ativo ? 'border-primary/40' : 'border-border opacity-60')}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grad-marca text-xs text-primary-foreground">{n}</span> {titulo}
      </h2>
      {ativo && children}
    </section>
  );
}

export default function CrmImportar() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: historico } = useImportacoes();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tabela, setTabela] = useState<unknown[][]>([]);
  const [mapa, setMapa] = useState<Partial<Record<CampoImportacao, number>>>({});
  const [origem, setOrigem] = useState('lista_antiga');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [filtro, setFiltro] = useState('todas');
  const [criarOp, setCriarOp] = useState(false);
  const [autorizou, setAutorizou] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoLinha[] | null>(null);

  const cabecalhos = tabela[0] ?? [];
  const passo = resultado ? 4 : linhas.length ? 3 : tabela.length ? 2 : 1;

  const recomecar = () => {
    setArquivo(null); setTabela([]); setMapa({}); setLinhas([]); setResultado(null); setProgresso(0);
    setCriarOp(false); setAutorizou(false); setFiltro('todas');
  };

  const abrirArquivo = async (f?: File | null) => {
    if (!f) return;
    setOcupado('Lendo a planilha…');
    try {
      const t = (await lerPlanilha(f)).filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== ''));
      if (t.length < 2) throw new Error('A planilha precisa ter uma linha de títulos e pelo menos uma pessoa.');
      if (t.length - 1 > LIMITE) throw new Error(`A planilha tem ${t.length - 1} linhas. Divida em arquivos de até ${LIMITE}.`);
      setArquivo(f); setTabela(t); setMapa(sugerirMapeamento(t[0])); setLinhas([]); setResultado(null);
    } catch (e: any) {
      toast({ title: 'Não foi possível ler o arquivo', description: e.message, variant: 'destructive' });
    } finally { setOcupado(null); }
  };

  const conferir = async () => {
    if (mapa.nome === undefined) return toast({ title: 'Escolha a coluna do nome', variant: 'destructive' });
    if (mapa.email === undefined && mapa.telefone === undefined && mapa.cpf === undefined) {
      return toast({ title: 'Escolha pelo menos e-mail, telefone ou CPF', description: 'Sem isso não dá para saber se a pessoa já existe.', variant: 'destructive' });
    }
    setOcupado('Conferindo cada linha com a base…');
    try {
      const base = montarLinhas(tabela, mapa);
      const rep = repetidasNaPlanilha(base);
      const previa = await previaImportacao(base.map(({ linha, nome, email, telefone, cpf }) => ({ linha, nome, email, telefone, cpf })));
      const porLinha = new Map(previa.map((p) => [p.linha, p]));
      setLinhas(base.map((l) => {
        const p = porLinha.get(l.linha);
        const repetidaDe = rep.get(l.linha);
        return { ...l, previa: p, repetidaDe, incluir: !repetidaDe && (p?.acao === 'criar' || p?.acao === 'completar') };
      }));
    } catch (e: any) {
      toast({ title: 'Não foi possível conferir', description: e.message, variant: 'destructive' });
    } finally { setOcupado(null); }
  };

  const situacao = (l: Linha) => (l.repetidaDe ? 'repetida' : l.previa?.acao ?? 'erro');
  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of linhas) c[situacao(l)] = (c[situacao(l)] ?? 0) + 1;
    return c;
  }, [linhas]);
  const visiveis = linhas.filter((l) => filtro === 'todas' || situacao(l) === filtro);
  const escolhidas = linhas.filter((l) => l.incluir);

  const importar = async () => {
    if (!arquivo || !escolhidas.length) return;
    setOcupado('Importando…'); setProgresso(0);
    try {
      const id = await iniciarImportacao(arquivo.name, origem, escolhidas.length);
      const lotes = emLotes(escolhidas.map(({ previa, repetidaDe, incluir, ...l }) => l), 200);
      const todos: ResultadoLinha[] = [];
      for (let i = 0; i < lotes.length; i++) {
        todos.push(...(await importarLote(id, lotes[i], criarOp, autorizou)));
        setProgresso(Math.round(((i + 1) / lotes.length) * 100));
      }
      setResultado(todos);
      qc.invalidateQueries({ queryKey: ['crm'] });
    } catch (e: any) {
      toast({ title: 'A importação parou', description: `${e.message}. O que já foi gravado está no histórico abaixo.`, variant: 'destructive' });
      qc.invalidateQueries({ queryKey: ['crm'] });
    } finally { setOcupado(null); }
  };

  const resumoRes = (r: ResultadoLinha[] | any[]) => ({
    criadas: r.filter((x) => x.acao === 'criar').length,
    completadas: r.filter((x) => x.acao === 'completar').length,
    problemas: r.filter((x) => x.acao === 'erro' || x.acao === 'conflito').length,
  });

  return (
    <CrmLayout
      titulo="CRM · Importar planilha"
      descricao="Traga listas de encontros, contatos antigos ou planilhas da equipe. Nada é gravado antes da sua conferência."
      acoes={passo > 1 ? <Button size="sm" variant="outline" onClick={recomecar}>Começar de novo</Button> : undefined}
    >
      <div className="space-y-4">
        <Passo n={1} titulo="Escolha o arquivo" ativo={passo === 1}>
          <div className="flex flex-wrap items-end gap-4" data-tour="crm-importar-arquivo">
            <div className="space-y-1.5">
              <Label>De onde veio esta lista?</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENS.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-grad-marca px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Upload className="h-4 w-4" /> {ocupado ?? 'Escolher planilha (.xlsx ou .csv)'}
              <input type="file" accept=".xlsx,.csv,.txt" className="sr-only" disabled={!!ocupado}
                onChange={(e) => { abrirArquivo(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A primeira linha deve ter os títulos das colunas (ex.: Nome, WhatsApp, E-mail). Até {LIMITE.toLocaleString('pt-BR')} pessoas por arquivo.
          </p>
        </Passo>

        <Passo n={2} titulo={`Diga o que é cada coluna${arquivo ? ` · ${arquivo.name}` : ''}`} ativo={passo === 2}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAMPOS_IMPORTACAO.map((c) => (
              <div key={c.v} className="space-y-1.5">
                <Label>{c.r}{c.obrigatorio ? ' *' : ''}</Label>
                <Select value={mapa[c.v] === undefined ? 'nao' : String(mapa[c.v])}
                  onValueChange={(v) => setMapa((m) => { const n = { ...m }; if (v === 'nao') delete n[c.v]; else n[c.v] = Number(v); return n; })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não usar</SelectItem>
                    {cabecalhos.map((h, i) => <SelectItem key={i} value={String(i)}>{String(h ?? `Coluna ${i + 1}`) || `Coluna ${i + 1}`}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="truncate text-[11px] text-muted-foreground">
                  {mapa[c.v] !== undefined ? `ex.: ${String(tabela[1]?.[mapa[c.v]!] ?? '—')}` : ' '}
                </p>
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={conferir} disabled={!!ocupado}>
            <ListChecks className="mr-2 h-4 w-4" /> {ocupado ?? `Conferir ${tabela.length - 1} linha(s)`}
          </Button>
        </Passo>

        <Passo n={3} titulo="Confira antes de gravar" ativo={passo === 3}>
          <div className="mb-3 flex flex-wrap gap-2" data-tour="crm-importar-previa">
            <button onClick={() => setFiltro('todas')} className={cn('rounded-full border px-3 py-1 text-xs', filtro === 'todas' && 'border-primary font-semibold')}>
              Todas ({linhas.length})
            </button>
            {Object.entries(ACOES).filter(([k]) => contagem[k]).map(([k, a]) => (
              <button key={k} onClick={() => setFiltro(k)} className={cn('rounded-full px-3 py-1 text-xs', a.cor, filtro === k && 'ring-2 ring-primary')}>
                {a.r} ({contagem[k]})
              </button>
            ))}
          </div>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs">
                <tr><th className="p-2">Usar</th><th className="p-2">Linha</th><th className="p-2">Pessoa</th><th className="p-2">Contato</th><th className="p-2">O que vai acontecer</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visiveis.slice(0, 500).map((l) => {
                  const s = situacao(l);
                  const pode = s === 'criar' || s === 'completar' || s === 'repetida';
                  return (
                    <tr key={l.linha} className={cn(!l.incluir && 'text-muted-foreground')}>
                      <td className="p-2">
                        <Checkbox checked={l.incluir} disabled={!pode} aria-label={`Usar linha ${l.linha}`}
                          onCheckedChange={(v) => setLinhas((ls) => ls.map((x) => x.linha === l.linha ? { ...x, incluir: v === true } : x))} />
                      </td>
                      <td className="p-2 text-xs">{l.linha}</td>
                      <td className="p-2">{l.nome || '—'}{l.apelido ? <span className="text-xs text-muted-foreground"> ({l.apelido})</span> : null}</td>
                      <td className="p-2 text-xs">{[l.telefone, l.email].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="p-2 text-xs">
                        <span className={cn('mr-1 inline-block rounded px-1.5 py-0.5 font-semibold', ACOES[s].cor)}>{ACOES[s].r}</span>
                        {s === 'repetida' ? `igual à linha ${l.repetidaDe}` : l.previa?.motivo}
                        {l.previa?.pessoa_id && <> · <Link to={rotaCrm.ficha(l.previa.pessoa_id)} target="_blank" className="underline">{l.previa.pessoa_nome}</Link></>}
                        {l.previa?.aviso && <p className="mt-0.5 flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> {l.previa.aviso}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visiveis.length > 500 && <p className="p-2 text-xs text-muted-foreground">Mostrando 500 de {visiveis.length}. Use os filtros acima.</p>}
          </div>

          <div className="mt-4 space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
            <label className="flex items-start gap-2">
              <Checkbox checked={criarOp} onCheckedChange={(v) => setCriarOp(v === true)} className="mt-0.5" />
              Abrir oportunidade "Nova interessada" no funil para quem ainda não tem conversa aberta
            </label>
            <label className="flex items-start gap-2">
              <Checkbox checked={autorizou} onCheckedChange={(v) => setAutorizou(v === true)} className="mt-0.5" />
              <span>As pessoas desta lista autorizaram receber mensagens por WhatsApp
                <span className="block text-xs text-muted-foreground">Marque só se houver autorização registrada (ex.: ficha de inscrição com aceite). Nunca muda quem já disse "Não quer".</span></span>
            </label>
          </div>

          {ocupado && <Progress value={progresso} className="mt-4" />}
          <Button className="mt-4" onClick={importar} disabled={!escolhidas.length || !!ocupado}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {ocupado ?? `Importar ${escolhidas.length} pessoa(s) como "${rotuloOrigem(origem)}"`}
          </Button>
        </Passo>

        {resultado && (
          <Passo n={4} titulo="Pronto!" ativo>
            {(() => { const r = resumoRes(resultado); return (
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {r.criadas} ficha(s) nova(s), {r.completadas} ficha(s) completada(s){r.problemas ? `, ${r.problemas} linha(s) com problema` : ''}.
              </p>
            ); })()}
            <ul className="mt-3 max-h-72 divide-y divide-border overflow-auto rounded-lg border border-border text-sm">
              {resultado.filter((r) => r.acao === 'erro' || r.acao === 'conflito').map((r) => (
                <li key={r.linha} className="p-2 text-xs"><b>Linha {r.linha}:</b> {r.mensagem}</li>
              ))}
              {resultado.filter((r) => r.pessoa_id).slice(0, 200).map((r) => (
                <li key={r.linha} className="flex justify-between gap-2 p-2 text-xs">
                  <span>Linha {r.linha} · {r.mensagem}</span>
                  <Link to={rotaCrm.ficha(r.pessoa_id!)} className="text-primary underline">Abrir ficha</Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Dica: confira a aba "Fichas repetidas" — pessoas com o mesmo nome aparecem lá para você decidir.
            </p>
          </Passo>
        )}

        <section className="rounded-[var(--radius)] border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><History className="h-4 w-4 text-primary" /> Importações anteriores</h2>
          {!historico?.length ? <p className="text-sm text-muted-foreground">Nenhuma importação ainda.</p> : (
            <ul className="divide-y divide-border text-sm">
              {historico.map((h) => { const r = resumoRes(h.resultado ?? []); return (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><b>{h.nome_arquivo}</b> <span className="text-muted-foreground">· {rotuloOrigem(h.origem)} · {dataHora(h.criado_em)}</span></span>
                  <span className="flex gap-1">
                    <Badge variant="secondary" className="text-[10px]">{r.criadas} novas</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.completadas} completadas</Badge>
                    {r.problemas > 0 && <Badge variant="destructive" className="text-[10px]">{r.problemas} com problema</Badge>}
                  </span>
                </li>
              ); })}
            </ul>
          )}
        </section>
      </div>
    </CrmLayout>
  );
}
