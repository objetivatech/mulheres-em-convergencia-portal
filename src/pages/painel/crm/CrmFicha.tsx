import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MessageCircle, NotebookPen, Plus, Pencil, Eye, EyeOff, X, ShieldCheck, ArrowLeft, Store, Ticket, BadgeCheck, GitMerge,
} from 'lucide-react';
import FusaoDialog from '@/components/crm/FusaoDialog';
import SeletorPessoa from '@/components/painel/SeletorPessoa';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import WhatsAppDialog from '@/components/crm/WhatsAppDialog';
import RegistrarContatoDialog from '@/components/crm/RegistrarContatoDialog';
import TarefaDialog from '@/components/crm/TarefaDialog';
import TarefaItem from '@/components/crm/TarefaItem';
import OportunidadeDialog from '@/components/crm/OportunidadeDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useFichaCrm, useAdicionarContato, useApelido, useRegistrarConsentimento, useSalvarFicha,
  useAtualizarPessoa, useSalvarOportunidade, useVinculoNegocio, useNegociosParaVinculo,
} from '@/hooks/useCrmMec';
import {
  CANAIS_CONSENTIMENTO, ETAPAS, ORIGENS, consentimentoAtual, mascararCpf, rotuloCanal, rotuloEtapa, rotuloOrigem, situacaoTarefa,
} from '@/lib/crm';
import { dinheiro } from '@/hooks/usePlanosEventos';
import { dataCurta, dataHora } from '@/components/crm/datas';
import { cn } from '@/lib/utils';

function Bloco({ titulo, acao, children, tour }: { titulo: string; acao?: any; children: any; tour?: string }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4" data-tour={tour}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{titulo}</h2>
        {acao}
      </header>
      {children}
    </section>
  );
}

const TIPO_LINHA: Record<string, string> = {
  pagamento: 'Pagamento', inscricao: 'Inscrição em encontro', acesso: 'Acesso liberado',
};

export default function CrmFicha() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data, isLoading } = useFichaCrm(id);
  const addContato = useAdicionarContato();
  const apelido = useApelido();
  const consent = useRegistrarConsentimento();
  const salvarFicha = useSalvarFicha();
  const atualizarPessoa = useAtualizarPessoa();
  const salvarOp = useSalvarOportunidade();
  const vinculo = useVinculoNegocio();
  const { data: negociosLista } = useNegociosParaVinculo();

  const [verCpf, setVerCpf] = useState(false);
  const [wa, setWa] = useState(false);
  const [registrar, setRegistrar] = useState(false);
  const [tarefa, setTarefa] = useState<{ aberta: boolean; t?: any }>({ aberta: false });
  const [opDialog, setOpDialog] = useState<{ aberto: boolean; etapa?: string }>({ aberto: false });
  const [editarDados, setEditarDados] = useState(false);
  const [dados, setDados] = useState<any>({});
  const [novoContato, setNovoContato] = useState({ tipo: 'whatsapp', valor: '' });
  const [novoApelido, setNovoApelido] = useState('');
  const [novoVinculo, setNovoVinculo] = useState({ negocio_id: '', papel: 'socia' });
  const [filtroHist, setFiltroHist] = useState<'tudo' | 'conversas' | 'site'>('tudo');
  const [unir, setUnir] = useState<{ aberto: boolean; outra: string | null }>({ aberto: false, outra: null });
  const navegar = useNavigate();

  const falha = (titulo: string) => (e: any) => toast({ title: titulo, description: e.message, variant: 'destructive' });

  const p = data?.pessoa;
  const opAberta = data?.oportunidades.find((o) => !o.fechada_em) ?? null;
  const opUltima = opAberta ?? data?.oportunidades[0] ?? null;
  const tarefasAbertas = (data?.atividades ?? []).filter((t) => !['concluida', 'cancelada'].includes(situacaoTarefa(t)));
  const acessos = [
    ['diretorio', 'Diretório', data?.perfil?.acesso_diretorio],
    ['conecta', 'Conecta+', data?.perfil?.acesso_conecta],
    ['academy', 'Academy', data?.perfil?.acesso_academy],
    ['area_embaixadora', 'Embaixadora', data?.perfil?.acesso_embaixadora],
  ].filter((a) => a[2]);
  const pagPlanos = (data?.pagamentos ?? []).filter((x) => x.plano && x.situacao === 'confirmado');
  const primeiraAdesao = pagPlanos.map((x) => x.confirmado_em ?? x.criado_em).sort()[0];

  const historico = useMemo(() => {
    if (!data) return [];
    const crm = data.interacoes.map((i) => ({
      chave: `i-${i.id}`, quando: i.ocorrido_em, grupo: 'conversas',
      titulo: i.resumo, detalhe: [rotuloCanal(i.canal), i.objecao ? `objeção: ${i.objecao}` : null].filter(Boolean).join(' · '),
      sistema: i.canal === 'sistema',
    }));
    const site = data.linha.map((l, n) => ({
      chave: `l-${n}`, quando: l.ocorrido_em, grupo: 'site',
      titulo: `${TIPO_LINHA[l.tipo] ?? l.tipo}: ${l.titulo ?? ''}`, detalhe: l.detalhe ?? '', sistema: true,
    }));
    return [...crm, ...site]
      .filter((h) => filtroHist === 'tudo' || h.grupo === filtroHist)
      .sort((a, b) => (b.quando ?? '').localeCompare(a.quando ?? ''));
  }, [data, filtroHist]);

  const abrirEdicao = () => {
    setDados({
      nome_social: p?.nome_social ?? '', data_nascimento: p?.data_nascimento ?? '',
      origem: data?.ficha?.origem ?? '', origem_detalhe: data?.ficha?.origem_detalhe ?? '',
      primeiro: data?.ficha?.primeiro_contato_em?.slice(0, 10) ?? '', observacoes: data?.ficha?.observacoes ?? '',
    });
    setEditarDados(true);
  };

  const gravarDados = async () => {
    try {
      await atualizarPessoa.mutateAsync({ id: id!, valores: {
        nome_social: dados.nome_social.trim() || null, data_nascimento: dados.data_nascimento || null,
      } });
      await salvarFicha.mutateAsync({
        pessoa_id: id!, origem: dados.origem || null, origem_detalhe: dados.origem_detalhe.trim() || null,
        primeiro_contato_em: dados.primeiro ? new Date(`${dados.primeiro}T12:00:00`).toISOString() : null,
        observacoes: dados.observacoes.trim() || null,
      });
      setEditarDados(false);
      toast({ title: 'Dados salvos' });
    } catch (e: any) { falha('Não foi possível salvar')(e); }
  };

  const moverEtapa = (etapa: string) => {
    if (!opAberta) return setOpDialog({ aberto: true, etapa });
    if (['sem_interesse', 'perdida'].includes(etapa)) return setOpDialog({ aberto: true, etapa });
    salvarOp.mutateAsync({ id: opAberta.id, valores: { etapa } })
      .then(() => toast({ title: `Etapa: ${rotuloEtapa(etapa)}` }))
      .catch(falha('Não foi possível mudar a etapa'));
  };

  if (isLoading) return <CrmLayout titulo="Ficha"><Skeleton className="h-96 rounded-xl" /></CrmLayout>;
  if (!p) return <CrmLayout titulo="Ficha"><p className="text-sm text-muted-foreground">Pessoa não encontrada.</p></CrmLayout>;

  return (
    <CrmLayout
      titulo={p.nome}
      descricao={p.nome_social ? `Prefere ser chamada de ${p.nome_social}` : 'Ficha completa da pessoa'}
      acoes={
        <div className="flex flex-wrap gap-2" data-tour="crm-ficha-acoes">
          <Button size="sm" onClick={() => setWa(true)}><MessageCircle className="mr-1 h-4 w-4" /> WhatsApp</Button>
          <Button size="sm" variant="outline" onClick={() => setRegistrar(true)}><NotebookPen className="mr-1 h-4 w-4" /> Registrar contato</Button>
          <Button size="sm" variant="outline" onClick={() => setTarefa({ aberta: true })}><Plus className="mr-1 h-4 w-4" /> Tarefa</Button>
          <Button size="sm" variant="ghost" onClick={() => setUnir({ aberto: true, outra: null })}><GitMerge className="mr-1 h-4 w-4" /> Unir com outra ficha</Button>
        </div>
      }
    >
      <Link to={rotaCrm.pessoas} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para pessoas
      </Link>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {acessos.length > 0 && <Badge>Associada</Badge>}
        <Badge variant="outline">{p.auth_user_id ? 'Conta no site' : 'Contato provisório (sem conta)'}</Badge>
        {(data?.perfil?.papeis ?? []).map((r: string) => <Badge key={r} variant="secondary">{r}</Badge>)}
        {opAberta && <Badge variant="secondary">Funil: {rotuloEtapa(opAberta.etapa)}</Badge>}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* -------- coluna da identidade -------- */}
        <div className="space-y-6">
          <Bloco titulo="Dados" acao={<Button size="sm" variant="ghost" onClick={abrirEdicao}><Pencil className="h-4 w-4" /></Button>}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">CPF</dt>
                <dd className="flex items-center gap-1">
                  {p.cpf ? (verCpf ? p.cpf : mascararCpf(p.cpf)) : 'não informado'}
                  {p.cpf && <button onClick={() => setVerCpf((v) => !v)} aria-label={verCpf ? 'Ocultar CPF' : 'Mostrar CPF'}>{verCpf ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>}
                </dd>
              </div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Nascimento</dt><dd>{p.data_nascimento ? new Date(`${p.data_nascimento}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Como chegou</dt><dd>{rotuloOrigem(data?.ficha?.origem)}{data?.ficha?.origem_detalhe ? ` · ${data.ficha.origem_detalhe}` : ''}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Primeiro contato</dt><dd>{data?.ficha?.primeiro_contato_em ? dataCurta(data.ficha.primeiro_contato_em) : 'não informado'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">No sistema desde</dt><dd>{dataCurta(p.criado_em)}</dd></div>
              {p.ultimo_acesso_em && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Último acesso ao site</dt><dd>{dataCurta(p.ultimo_acesso_em)}</dd></div>}
            </dl>
            {data?.ficha?.observacoes && <p className="mt-3 whitespace-pre-line rounded-lg bg-muted p-2 text-xs">{data.ficha.observacoes}</p>}
            <Link to={`/painel-conteudo/pessoas?pessoa=${p.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Papéis, acessos e cortesias
            </Link>
          </Bloco>

          <Bloco titulo="Contatos">
            <ul className="space-y-1.5 text-sm">
              {data.contatos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="break-all">{c.valor}</span>
                  <span className="flex shrink-0 gap-1">
                    <Badge variant="outline" className="text-[10px]">{c.tipo}</Badge>
                    {c.principal && <Badge variant="secondary" className="text-[10px]">principal</Badge>}
                  </span>
                </li>
              ))}
              {!data.contatos.length && <li className="text-muted-foreground">Nenhum contato.</li>}
            </ul>
            <div className="mt-3 flex gap-2">
              <Select value={novoContato.tipo} onValueChange={(v) => setNovoContato({ ...novoContato, tipo: v })}>
                <SelectTrigger className="w-32" aria-label="Tipo de contato"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
              <Input value={novoContato.valor} onChange={(e) => setNovoContato({ ...novoContato, valor: e.target.value })} placeholder="Novo contato" aria-label="Novo contato" />
              <Button size="sm" disabled={!novoContato.valor.trim() || addContato.isPending}
                onClick={() => addContato.mutateAsync({ pessoa_id: p.id, tipo: novoContato.tipo as any, valor: novoContato.valor })
                  .then(() => setNovoContato({ ...novoContato, valor: '' })).catch(falha('Não foi possível incluir'))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Bloco>

          <Bloco titulo="Apelidos e nomes conhecidos">
            <div className="flex flex-wrap gap-1.5">
              {data.apelidos.map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-1">
                  {a.apelido}
                  <button onClick={() => apelido.mutateAsync({ acao: 'remover', id: a.id }).catch(falha('Não foi possível remover'))} aria-label={`Remover ${a.apelido}`}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {!data.apelidos.length && <p className="text-sm text-muted-foreground">Nenhum apelido.</p>}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (!novoApelido.trim()) return;
              apelido.mutateAsync({ acao: 'incluir', pessoa_id: p.id, apelido: novoApelido }).then(() => setNovoApelido('')).catch(falha('Não foi possível incluir'));
            }}>
              <Input value={novoApelido} onChange={(e) => setNovoApelido(e.target.value)} placeholder="Ex.: Laura, Lau da Confeitaria" aria-label="Novo apelido" />
              <Button size="sm" type="submit" disabled={!novoApelido.trim()}><Plus className="h-4 w-4" /></Button>
            </form>
          </Bloco>

          <Bloco titulo="Permissão para contato" tour="crm-consentimento">
            <ul className="space-y-2 text-sm">
              {CANAIS_CONSENTIMENTO.map((c) => {
                const atual = consentimentoAtual(data.consentimentos, c.v);
                return (
                  <li key={c.v} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{c.r}: <strong className={cn(atual === 'recusado' && 'text-destructive')}>{atual === 'autorizado' ? 'autorizou' : atual === 'recusado' ? 'não quer' : 'não perguntado'}</strong></span>
                    <span className="flex gap-1">
                      <Button size="sm" variant={atual === 'autorizado' ? 'default' : 'outline'} className="h-7 px-2 text-xs"
                        onClick={() => consent.mutateAsync({ pessoa_id: p.id, canal: c.v, situacao: 'autorizado' }).catch(falha('Erro'))}>Autorizou</Button>
                      <Button size="sm" variant={atual === 'recusado' ? 'destructive' : 'outline'} className="h-7 px-2 text-xs"
                        onClick={() => consent.mutateAsync({ pessoa_id: p.id, canal: c.v, situacao: 'recusado' }).catch(falha('Erro'))}>Não quer</Button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Estar na newsletter não autoriza mensagens por WhatsApp.</p>
          </Bloco>

          <Bloco titulo="Negócios">
            <ul className="space-y-1.5 text-sm">
              {data.negocios.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2">
                  <Link to={`/diretorio/${n.slug}`} target="_blank" className="flex items-center gap-1 hover:underline"><Store className="h-3.5 w-3.5" /> {n.nome}</Link>
                  <Badge variant="outline" className="text-[10px]">dona{!n.publicado ? ' · não publicado' : ''}</Badge>
                </li>
              ))}
              {data.vinculos.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2">
                  <Link to={`/diretorio/${v.negocio?.slug}`} target="_blank" className="flex items-center gap-1 hover:underline"><Store className="h-3.5 w-3.5" /> {v.negocio?.nome}</Link>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{v.papel}</Badge>
                    <button onClick={() => vinculo.mutateAsync({ acao: 'remover', id: v.id }).catch(falha('Erro'))} aria-label="Remover vínculo"><X className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
              {!data.negocios.length && !data.vinculos.length && <li className="text-muted-foreground">Nenhum negócio ligado.</li>}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Select value={novoVinculo.negocio_id} onValueChange={(v) => setNovoVinculo({ ...novoVinculo, negocio_id: v })}>
                <SelectTrigger className="min-w-[160px] flex-1" aria-label="Negócio"><SelectValue placeholder="Ligar a um negócio" /></SelectTrigger>
                <SelectContent>{(negociosLista ?? []).map((n) => <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={novoVinculo.papel} onValueChange={(v) => setNovoVinculo({ ...novoVinculo, papel: v })}>
                <SelectTrigger className="w-36" aria-label="Papel no negócio"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="socia">Sócia</SelectItem>
                  <SelectItem value="proprietaria">Proprietária</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!novoVinculo.negocio_id}
                onClick={() => vinculo.mutateAsync({ acao: 'incluir', pessoa_id: p.id, ...novoVinculo }).then(() => setNovoVinculo({ negocio_id: '', papel: 'socia' })).catch(falha('Não foi possível ligar'))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Bloco>
        </div>

        {/* -------- coluna do relacionamento -------- */}
        <div className="space-y-6 xl:col-span-2">
          <Bloco
            titulo="Conversa sobre associação"
            tour="crm-oportunidade"
            acao={opUltima && <Button size="sm" variant="ghost" onClick={() => setOpDialog({ aberto: true })}><Pencil className="h-4 w-4" /></Button>}
          >
            {!opAberta && !opUltima ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Nenhuma conversa comercial aberta.</p>
                <Button size="sm" onClick={() => setOpDialog({ aberto: true })}>Abrir oportunidade</Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {ETAPAS.map((e) => (
                    <button
                      key={e.v}
                      onClick={() => moverEtapa(e.v)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        opAberta?.etapa === e.v || (!opAberta && opUltima?.etapa === e.v)
                          ? 'border-transparent bg-grad-marca font-semibold text-primary-foreground'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {e.r}
                    </button>
                  ))}
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Plano de interesse</dt><dd>{opUltima?.plano?.nome ?? '—'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Valor esperado</dt><dd>{dinheiro(opUltima?.valor_centavos ?? 0)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Interesse desde</dt><dd>{dataCurta(opUltima?.interesse_em)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Plano apresentado em</dt><dd>{dataCurta(opUltima?.plano_apresentado_em)}</dd></div>
                  {opUltima?.proxima_acao && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Próxima ação</dt><dd>{opUltima.proxima_acao}</dd></div>}
                  {opUltima?.motivo && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Motivo</dt><dd>{opUltima.motivo}</dd></div>}
                </dl>
                {!opAberta && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-2 text-xs">
                    <span>Encerrada em {dataCurta(opUltima?.fechada_em)}.</span>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setOpDialog({ aberto: true, etapa: 'nova' })}>Nova conversa</Button>
                  </div>
                )}
              </>
            )}
          </Bloco>

          <Bloco titulo={`Tarefas abertas (${tarefasAbertas.length})`} acao={<Button size="sm" variant="ghost" onClick={() => setTarefa({ aberta: true })}><Plus className="h-4 w-4" /></Button>}>
            {!tarefasAbertas.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa aberta para esta pessoa.</p>
            ) : (
              <ul className="space-y-2">
                {tarefasAbertas.map((t) => <TarefaItem key={t.id} t={t} mostrarPessoa={false} onWhatsApp={() => setWa(true)} onEditar={(x) => setTarefa({ aberta: true, t: x })} />)}
              </ul>
            )}
          </Bloco>

          <div className="grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Associação">
              {acessos.length ? (
                <p className="flex flex-wrap items-center gap-1 text-sm"><BadgeCheck className="h-4 w-4 text-primary" /> Acesso ativo: {acessos.map((a) => a[1]).join(', ')}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem acesso de associada no momento.</p>
              )}
              <p className="mt-2 text-sm">Primeira adesão paga: <strong>{primeiraAdesao ? dataCurta(primeiraAdesao) : 'nenhuma'}</strong></p>
              {!!pagPlanos.length && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {pagPlanos.slice(0, 5).map((x) => <li key={x.id}>{dataCurta(x.confirmado_em ?? x.criado_em)} · {x.plano?.nome} · {dinheiro(x.valor_centavos)}</li>)}
                </ul>
              )}
            </Bloco>

            <Bloco titulo={`Encontros (${data.inscricoes.length})`}>
              {!data.inscricoes.length ? (
                <p className="text-sm text-muted-foreground">Ainda não se inscreveu em encontros.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {data.inscricoes.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-2">
                      <span className="flex items-start gap-1"><Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {i.evento?.titulo} <span className="text-xs text-muted-foreground">· {dataCurta(i.evento?.inicio_em)}</span></span>
                      <span className="flex shrink-0 gap-1">
                        <Badge variant="outline" className="text-[10px]">{i.situacao}</Badge>
                        {i.presencas?.length ? <Badge className="text-[10px]">presente</Badge> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bloco>
          </div>

          <Bloco
            titulo="Histórico"
            tour="crm-historico"
            acao={
              <div className="flex gap-1">
                {(['tudo', 'conversas', 'site'] as const).map((f) => (
                  <Button key={f} size="sm" variant={filtroHist === f ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setFiltroHist(f)}>
                    {f === 'tudo' ? 'Tudo' : f === 'conversas' ? 'Conversas' : 'Site'}
                  </Button>
                ))}
              </div>
            }
          >
            {!historico.length ? (
              <p className="text-sm text-muted-foreground">Sem registros ainda. Use "Registrar contato" depois de cada conversa.</p>
            ) : (
              <ol className="space-y-3 border-l border-border pl-4">
                {historico.map((h) => (
                  <li key={h.chave} className="relative">
                    <span className={cn('absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full', h.sistema ? 'bg-muted-foreground/40' : 'bg-primary')} />
                    <p className="text-xs text-muted-foreground">{dataHora(h.quando)}{h.detalhe ? ` · ${h.detalhe}` : ''}</p>
                    <p className={cn('text-sm whitespace-pre-line', h.sistema && 'text-muted-foreground')}>{h.titulo}</p>
                  </li>
                ))}
              </ol>
            )}
          </Bloco>
        </div>
      </div>

      <Dialog open={editarDados} onOpenChange={setEditarDados}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar dados</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="fd-ns">Como prefere ser chamada</Label>
              <Input id="fd-ns" value={dados.nome_social ?? ''} onChange={(e) => setDados({ ...dados, nome_social: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="fd-nasc">Data de nascimento</Label>
              <Input id="fd-nasc" type="date" value={dados.data_nascimento ?? ''} onChange={(e) => setDados({ ...dados, data_nascimento: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Como chegou</Label>
                <Select value={dados.origem || 'nao'} onValueChange={(v) => setDados({ ...dados, origem: v === 'nao' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não informada</SelectItem>
                    {ORIGENS.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label htmlFor="fd-od">Detalhe da origem</Label>
                <Input id="fd-od" value={dados.origem_detalhe ?? ''} onChange={(e) => setDados({ ...dados, origem_detalhe: e.target.value })} placeholder="Ex.: indicada pela Ana" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="fd-pc">Data real do primeiro contato</Label>
              <Input id="fd-pc" type="date" value={dados.primeiro ?? ''} onChange={(e) => setDados({ ...dados, primeiro: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="fd-obs">Observações internas</Label>
              <Textarea id="fd-obs" rows={4} value={dados.observacoes ?? ''} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} /></div>
            <Button className="w-full" onClick={gravarDados}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={unir.aberto && !unir.outra} onOpenChange={(o) => !o && setUnir({ aberto: false, outra: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Unir com outra ficha</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Procure a outra ficha da mesma pessoa. Antes de unir, você verá tudo o que vai acontecer.</p>
          <SeletorPessoa
            value={null}
            placeholder="Nome, e-mail, CPF ou apelido"
            onChange={(outra) => {
              if (outra === p.id) return toast({ title: 'Escolha uma ficha diferente desta', variant: 'destructive' });
              setUnir({ aberto: true, outra });
            }}
          />
        </DialogContent>
      </Dialog>
      <FusaoDialog
        aberto={unir.aberto && !!unir.outra}
        a={p.id}
        b={unir.outra}
        onFechar={() => setUnir({ aberto: false, outra: null })}
        onUnida={(mantida) => { if (mantida !== p.id) navegar(rotaCrm.ficha(mantida), { replace: true }); }}
      />

      <WhatsAppDialog pessoaId={p.id} oportunidadeId={opAberta?.id} aberto={wa} onFechar={() => setWa(false)} />
      <RegistrarContatoDialog pessoaId={p.id} oportunidadeId={opAberta?.id} aberto={registrar} onFechar={() => setRegistrar(false)} />
      <TarefaDialog aberto={tarefa.aberta} tarefa={tarefa.t} pessoaId={p.id} oportunidadeId={opAberta?.id} onFechar={() => setTarefa({ aberta: false })} />
      <OportunidadeDialog
        aberto={opDialog.aberto}
        onFechar={() => setOpDialog({ aberto: false })}
        pessoaId={p.id}
        oportunidade={opDialog.etapa === 'nova' && !opAberta ? null : opAberta ?? (opDialog.etapa ? null : opUltima)}
        etapaInicial={opDialog.etapa}
      />
    </CrmLayout>
  );
}
