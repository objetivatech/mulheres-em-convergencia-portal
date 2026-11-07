import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cake, AlertTriangle, CalendarCheck, Radar, Hourglass, CalendarDays, Plus, UserPlus } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import TarefaItem from '@/components/crm/TarefaItem';
import TarefaDialog from '@/components/crm/TarefaDialog';
import WhatsAppDialog from '@/components/crm/WhatsAppDialog';
import NovaPessoaDialog from '@/components/crm/NovaPessoaDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgendaHoje } from '@/hooks/useCrmMec';
import { useAuth } from '@/hooks/useAuth';
import { ETAPAS, aniversario, diasDesde, situacaoTarefa, primeiroNome } from '@/lib/crm';
import { dinheiro } from '@/hooks/usePlanosEventos';
import { dataCurta } from '@/components/crm/datas';

function Cartao({ titulo, icone: Icone, children, contagem, tour }: { titulo: string; icone: any; children: any; contagem?: number; tour?: string }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4" data-tour={tour}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Icone className="h-4 w-4 text-primary" /> {titulo}</h2>
        {contagem !== undefined && <span className="text-xs text-muted-foreground">{contagem}</span>}
      </header>
      {children}
    </section>
  );
}

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

export default function CrmHoje() {
  const { data, isLoading } = useAgendaHoje();
  const { user } = useAuth();
  const [wa, setWa] = useState<{ pessoa: string; op?: string | null; cat?: string } | null>(null);
  const [novaTarefa, setNovaTarefa] = useState(false);
  const [editar, setEditar] = useState<any>(null);
  const [novaPessoa, setNovaPessoa] = useState(false);

  const r = useMemo(() => {
    const ativ = data?.atividades ?? [];
    const atrasadas = ativ.filter((t) => situacaoTarefa(t) === 'atrasada');
    const hoje = ativ.filter((t) => situacaoTarefa(t) === 'hoje');
    const semana = ativ.filter((t) => situacaoTarefa(t) === 'futura');
    const doDia = [...atrasadas, ...hoje];
    const aniv = (data?.aniversarios ?? [])
      .map((p) => ({ ...p, quando: aniversario(p.data_nascimento) }))
      .filter((p) => p.quando)
      .sort((a, b) => a.data_nascimento.slice(8, 10).localeCompare(b.data_nascimento.slice(8, 10)));
    const abertas = (data?.oportunidades ?? []).filter((o) => !o.fechada_em);
    const paradas = abertas.filter((o) => (diasDesde(o.atualizado_em) ?? 0) >= 7)
      .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em));
    const radar = (data?.participantes ?? [])
      .filter((p) => !p.assinante && (diasDesde(p.ultima_participacao) ?? 999) <= 60)
      .slice(0, 8);
    const porEtapa = ETAPAS.filter((e) => !e.fechada).map((e) => {
      const itens = abertas.filter((o) => o.etapa === e.v);
      return { ...e, n: itens.length, total: itens.reduce((s, o) => s + (o.valor_centavos ?? 0), 0) };
    });
    return {
      atrasadas, hoje, semana, doDia, aniv, paradas, radar, porEtapa,
      resumo: {
        retornos: doDia.filter((t) => t.tipo === 'conversao').length,
        relacionamentos: doDia.filter((t) => t.tipo === 'relacionamento').length,
        ativacoes: doDia.filter((t) => t.tipo === 'ativacao').length,
        aniversarios: aniv.filter((a) => a.quando === 'hoje').length,
      },
    };
  }, [data]);

  const nomeUsuaria = primeiroNome(user?.user_metadata?.full_name ?? '');

  return (
    <CrmLayout
      titulo="CRM · Agenda de hoje"
      descricao="O que precisa da sua atenção hoje, em poucos cliques."
      acoes={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setNovaPessoa(true)}><UserPlus className="mr-1 h-4 w-4" /> Nova pessoa</Button>
          <Button size="sm" onClick={() => setNovaTarefa(true)}><Plus className="mr-1 h-4 w-4" /> Nova tarefa</Button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="rounded-[var(--radius)] bg-grad-marca p-5 text-primary-foreground sombra-marca" data-tour="crm-resumo">
            <p className="text-lg font-bold">{saudacao()}{nomeUsuaria ? `, ${nomeUsuaria}` : ''}!</p>
            <p className="mt-1 text-sm opacity-95">
              Hoje: {r.resumo.retornos} retorno(s), {r.resumo.relacionamentos} relacionamento(s),{' '}
              {r.resumo.aniversarios} aniversário(s), {r.resumo.ativacoes} ativação(ões)
              {r.atrasadas.length ? ` · ${r.atrasadas.length} atrasada(s)` : ''}.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Cartao titulo="Para hoje (inclui atrasadas)" icone={CalendarCheck} contagem={r.doDia.length} tour="crm-hoje">
                {!r.doDia.length ? (
                  <p className="text-sm text-muted-foreground">Nada pendente para hoje. 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {r.doDia.map((t) => (
                      <TarefaItem key={t.id} t={t} onWhatsApp={(p, op) => setWa({ pessoa: p, op })} onEditar={setEditar} />
                    ))}
                  </ul>
                )}
              </Cartao>

              <Cartao titulo="Próximos 7 dias" icone={CalendarDays} contagem={r.semana.length}>
                {!r.semana.length ? (
                  <p className="text-sm text-muted-foreground">Sem tarefas nos próximos dias.</p>
                ) : (
                  <ul className="space-y-2">
                    {r.semana.slice(0, 10).map((t) => (
                      <TarefaItem key={t.id} t={t} onWhatsApp={(p, op) => setWa({ pessoa: p, op })} onEditar={setEditar} />
                    ))}
                  </ul>
                )}
              </Cartao>

              <Cartao titulo="Radar pós-encontro: foram a encontros e ainda não assinam" icone={Radar} contagem={r.radar.length}>
                {!r.radar.length ? (
                  <p className="text-sm text-muted-foreground">Ninguém nos últimos 60 dias.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {r.radar.map((p) => (
                      <li key={p.pessoa_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <span>
                          <Link to={rotaCrm.ficha(p.pessoa_id)} className="font-medium hover:underline">{p.nome}</Link>
                          <span className="text-muted-foreground"> · {p.ultimo_evento} · {dataCurta(p.ultima_participacao)}</span>
                        </span>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => setWa({ pessoa: p.pessoa_id, cat: 'reconexao' })}>WhatsApp</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Link to={rotaCrm.radar} className="mt-3 inline-block text-sm text-primary underline underline-offset-2">
                  Abrir o radar completo (por encontro, com ações em lote)
                </Link>
              </Cartao>
            </div>

            <div className="space-y-6">
              <Cartao titulo="Funil resumido" icone={Hourglass}>
                <ul className="space-y-1.5 text-sm">
                  {r.porEtapa.map((e) => (
                    <li key={e.v} className="flex items-center justify-between">
                      <span>{e.r}</span>
                      <span className="text-muted-foreground">{e.n} · {dinheiro(e.total)}</span>
                    </li>
                  ))}
                </ul>
                <Link to={rotaCrm.funil} className="mt-3 inline-block text-sm text-primary underline underline-offset-2">Abrir o funil</Link>
              </Cartao>

              <Cartao titulo="Conversas paradas há 7+ dias" icone={AlertTriangle} contagem={r.paradas.length}>
                {!r.paradas.length ? (
                  <p className="text-sm text-muted-foreground">Nenhuma oportunidade parada.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {r.paradas.slice(0, 8).map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2">
                        <Link to={rotaCrm.ficha(o.pessoa?.id)} className="hover:underline">{o.pessoa?.nome_social || o.pessoa?.nome}</Link>
                        <span className="text-xs text-muted-foreground">{diasDesde(o.atualizado_em)} dias</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Cartao>

              <Cartao titulo="Aniversariantes do mês" icone={Cake} contagem={r.aniv.length}>
                {!r.aniv.length ? (
                  <p className="text-sm text-muted-foreground">Ninguém com data de nascimento neste mês.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {r.aniv.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>
                          <Link to={rotaCrm.ficha(p.id)} className="hover:underline">{p.nome_social || p.nome}</Link>
                          <span className="text-muted-foreground"> · dia {Number(p.data_nascimento.slice(8, 10))}</span>
                          {p.quando === 'hoje' && <span className="ml-1 font-semibold text-primary">hoje!</span>}
                        </span>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setWa({ pessoa: p.id, cat: 'aniversario' })}>Parabenizar</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Cartao>

              <Cartao titulo="Próximos encontros" icone={CalendarDays}>
                {!data?.eventos.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum encontro publicado à frente.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.eventos.map((e) => (
                      <li key={e.id}>
                        <Link to={`/painel-conteudo/eventos/${e.id}`} className="font-medium hover:underline">{e.titulo}</Link>
                        <p className="text-xs text-muted-foreground">{dataCurta(e.inicio_em)} · {e.online ? 'Online' : e.cidade ?? 'Presencial'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Cartao>
            </div>
          </div>
        </div>
      )}

      <WhatsAppDialog pessoaId={wa?.pessoa ?? null} oportunidadeId={wa?.op} categoriaInicial={wa?.cat} aberto={!!wa} onFechar={() => setWa(null)} />
      <TarefaDialog aberto={novaTarefa || !!editar} tarefa={editar} onFechar={() => { setNovaTarefa(false); setEditar(null); }} />
      <NovaPessoaDialog aberto={novaPessoa} onFechar={() => setNovaPessoa(false)} />
    </CrmLayout>
  );
}
