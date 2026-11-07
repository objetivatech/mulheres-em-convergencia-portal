import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, UserPlus } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import NovaPessoaDialog from '@/components/crm/NovaPessoaDialog';
import WhatsAppDialog from '@/components/crm/WhatsAppDialog';
import BarraLista from '@/components/painel/BarraLista';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePessoasCrm } from '@/hooks/useCrmMec';
import { ETAPAS, diasDesde, rotuloEtapa, rotuloOrigem } from '@/lib/crm';
import { dataCurta } from '@/components/crm/datas';

const FILTROS = [
  { v: 'todas', r: 'Todas' },
  { v: 'funil', r: 'Com conversa aberta' },
  { v: 'assinantes', r: 'Associadas' },
  { v: 'nao_assinantes', r: 'Não associadas' },
  { v: 'provisorias', r: 'Sem conta no site' },
  { v: 'sem_contato', r: 'Sem contato há 30+ dias' },
];
const ORDENS = [
  { v: 'nome', r: 'Nome (A–Z)' },
  { v: 'recentes', r: 'Cadastro mais recente' },
  { v: 'contato', r: 'Último contato mais antigo' },
  { v: 'retorno', r: 'Próximo retorno' },
];

export default function CrmPessoas() {
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState(params.get('q') ?? '');
  const [termo, setTermo] = useState(busca);
  const [filtro, setFiltro] = useState('todas');
  const [ordem, setOrdem] = useState('nome');
  const [nova, setNova] = useState(false);
  const [wa, setWa] = useState<string | null>(null);

  useEffect(() => { const q = params.get('q') ?? ''; setBusca(q); setTermo(q); }, [params]);
  useEffect(() => { const t = setTimeout(() => setTermo(busca), 350); return () => clearTimeout(t); }, [busca]);

  const { data, isLoading } = usePessoasCrm(termo);

  const lista = useMemo(() => {
    const abertas = new Set(ETAPAS.filter((e) => !e.fechada).map((e) => e.v));
    let l = (data ?? []).filter((p) => {
      switch (filtro) {
        case 'funil': return !!p.etapa && abertas.has(p.etapa as any);
        case 'assinantes': return p.assinante;
        case 'nao_assinantes': return !p.assinante;
        case 'provisorias': return !p.conta_site;
        case 'sem_contato': return (diasDesde(p.ultima_interacao_em) ?? 9999) >= 30;
        default: return true;
      }
    });
    l = [...l].sort((a, b) => {
      if (ordem === 'recentes') return b.criado_em.localeCompare(a.criado_em);
      if (ordem === 'contato') return (a.ultima_interacao_em ?? '').localeCompare(b.ultima_interacao_em ?? '');
      if (ordem === 'retorno') return (a.proxima_tarefa_em ?? '9999').localeCompare(b.proxima_tarefa_em ?? '9999');
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return l;
  }, [data, filtro, ordem]);

  return (
    <CrmLayout
      titulo="CRM · Pessoas"
      descricao="Uma ficha por pessoa, com todos os contatos, negócios, encontros e conversas."
      acoes={<Button size="sm" onClick={() => setNova(true)}><UserPlus className="mr-1 h-4 w-4" /> Nova pessoa</Button>}
    >
      <BarraLista
        busca={busca}
        onBusca={(v) => { setBusca(v); if (params.get('q')) setParams({}, { replace: true }); }}
        placeholder="Nome, apelido, e-mail, telefone, CPF ou negócio"
        filtro={filtro} onFiltro={setFiltro} filtros={FILTROS}
        ordem={ordem} onOrdem={setOrdem} ordens={ORDENS}
      />
      <p className="mb-3 text-xs text-muted-foreground">{lista.length} pessoa(s)</p>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !lista.length ? (
        <p className="text-sm text-muted-foreground">Ninguém encontrado. Confira a grafia ou cadastre uma nova pessoa.</p>
      ) : (
        <ul className="divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
          {lista.map((p) => (
            <li key={p.pessoa_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link to={rotaCrm.ficha(p.pessoa_id)} className="font-semibold hover:underline">
                  {p.nome}{p.nome_social ? <span className="font-normal text-muted-foreground"> ({p.nome_social})</span> : null}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {[p.email, p.telefone].filter(Boolean).join(' · ') || 'sem contato cadastrado'}
                  {p.apelidos?.length ? ` · também: ${p.apelidos.join(', ')}` : ''}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.assinante && <Badge className="text-[10px]">Associada</Badge>}
                  <Badge variant="outline" className="text-[10px]">{p.conta_site ? 'Conta no site' : 'Contato provisório'}</Badge>
                  {p.etapa && <Badge variant="secondary" className="text-[10px]">{rotuloEtapa(p.etapa)}</Badge>}
                  {p.origem && <Badge variant="outline" className="text-[10px]">Origem: {rotuloOrigem(p.origem)}</Badge>}
                  {p.proxima_tarefa_em && <Badge variant="outline" className="text-[10px]">Retorno: {dataCurta(p.proxima_tarefa_em)}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {p.telefone && (
                  <Button size="sm" variant="outline" onClick={() => setWa(p.pessoa_id)} aria-label={`WhatsApp para ${p.nome}`}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" asChild><Link to={rotaCrm.ficha(p.pessoa_id)}>Abrir ficha</Link></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NovaPessoaDialog aberto={nova} onFechar={() => setNova(false)} />
      <WhatsAppDialog pessoaId={wa} aberto={!!wa} onFechar={() => setWa(null)} />
    </CrmLayout>
  );
}
