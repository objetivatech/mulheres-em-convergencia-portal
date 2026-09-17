import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMeuConecta, useSalvarConectaPerfil, useMeuPerfil, useMinhaPessoa } from '@/hooks/useMinhaArea';
import {
  useConectaMembrosRede,
  useConectaGrupos,
  useAlternarGrupo,
  useMinhasIndicacoes,
  useCriarIndicacao,
  useAtualizarIndicacao,
} from '@/hooks/useConectaNovo';
import {
  useMinhasConexoes,
  useConvidarConexao,
  useResponderConexao,
  useDesfazerConexao,
  useMinhasMensagens,
  useEnviarMensagem,
  useMarcarConversaLida,
} from '@/hooks/useConectaRede';

const SITUACOES = ['aberta', 'em andamento', 'fechada', 'sem retorno'];

export default function MeuConecta() {
  const { data, isLoading } = useMeuConecta();
  const { data: perfil } = useMeuPerfil();
  const { data: pessoaId } = useMinhaPessoa();
  const salvar = useSalvarConectaPerfil();
  const { toast } = useToast();

  const liberado = !!perfil?.acesso_conecta;
  const { data: membros = [], isLoading: carregandoMembros } = useConectaMembrosRede();
  const { data: grupos = [] } = useConectaGrupos();
  const alternarGrupo = useAlternarGrupo();
  const { data: indicacoes = [] } = useMinhasIndicacoes();
  const criarIndicacao = useCriarIndicacao();
  const atualizarIndicacao = useAtualizarIndicacao();

  const { data: conexoes } = useMinhasConexoes();
  const { data: mensagens = [] } = useMinhasMensagens();
  const convidar = useConvidarConexao();
  const responder = useResponderConexao();
  const desfazer = useDesfazerConexao();
  const enviarMensagem = useEnviarMensagem();
  const marcarLida = useMarcarConversaLida();
  const [conversaCom, setConversaCom] = useState<string | null>(null);
  const [texto, setTexto] = useState('');

  const [form, setForm] = useState({
    apresentacao: '',
    empresa: '',
    cargo: '',
    interesses: '',
    aceita_contato: true,
  });
  const [busca, setBusca] = useState('');
  const [nova, setNova] = useState({ para: '', descricao: '' });

  useEffect(() => {
    if (data?.perfil) {
      setForm({
        apresentacao: data.perfil.apresentacao ?? '',
        empresa: data.perfil.empresa ?? '',
        cargo: data.perfil.cargo ?? '',
        interesses: (data.perfil.interesses ?? []).join(', '),
        aceita_contato: data.perfil.aceita_contato ?? true,
      });
    }
  }, [data?.perfil]);

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        apresentacao: form.apresentacao.trim() || null,
        empresa: form.empresa.trim() || null,
        cargo: form.cargo.trim() || null,
        interesses: form.interesses
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
        aceita_contato: form.aceita_contato,
      });
      toast({ title: 'Perfil atualizado', description: 'Suas informações do Conecta+ foram salvas.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return membros
      .filter((m) => m.pessoa_id !== pessoaId)
      .filter((m) =>
        !termo
          ? true
          : [m.nome, m.empresa, m.cargo, (m.interesses ?? []).join(' ')]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(termo)
      );
  }, [membros, busca, pessoaId]);

  const nomePor = (id: string | null) =>
    !id ? 'Rede' : membros.find((m) => m.pessoa_id === id)?.nome ?? 'Associada';

  const membroPor = (id: string) => membros.find((m) => m.pessoa_id === id);

  const situacaoCom = (outroId: string) => {
    const c = (conexoes?.todas ?? []).find(
      (x) =>
        (x.de_pessoa_id === pessoaId && x.para_pessoa_id === outroId) ||
        (x.para_pessoa_id === pessoaId && x.de_pessoa_id === outroId),
    );
    if (!c) return { situacao: 'nenhuma' as const, id: null as string | null };
    if (c.situacao === 'aceita') return { situacao: 'conectada' as const, id: c.id };
    if (c.situacao === 'recusada') return { situacao: 'recusada' as const, id: c.id };
    return {
      situacao: (c.de_pessoa_id === pessoaId ? 'pendente_enviada' : 'pendente_recebida') as
        | 'pendente_enviada'
        | 'pendente_recebida',
      id: c.id,
    };
  };

  const idsConectadas = useMemo(
    () =>
      (conexoes?.aceitas ?? []).map((c) =>
        c.de_pessoa_id === pessoaId ? c.para_pessoa_id : c.de_pessoa_id,
      ),
    [conexoes?.aceitas, pessoaId],
  );

  const naoLidasPor = useMemo(() => {
    const mapa = new Map<string, number>();
    mensagens
      .filter((m) => m.para_pessoa_id === pessoaId && !m.lida_em)
      .forEach((m) => mapa.set(m.de_pessoa_id, (mapa.get(m.de_pessoa_id) ?? 0) + 1));
    return mapa;
  }, [mensagens, pessoaId]);

  const totalNaoLidas = Array.from(naoLidasPor.values()).reduce((a, b) => a + b, 0);
  const convitesPendentes = conexoes?.recebidasPendentes.length ?? 0;

  const conversa = useMemo(
    () =>
      !conversaCom
        ? []
        : mensagens.filter(
            (m) => m.de_pessoa_id === conversaCom || m.para_pessoa_id === conversaCom,
          ),
    [mensagens, conversaCom],
  );

  const abrirConversa = (outroId: string) => {
    setConversaCom(outroId);
    if (naoLidasPor.get(outroId)) marcarLida.mutate(outroId);
  };

  const conectar = (outroId: string) =>
    convidar.mutate(
      { paraPessoaId: outroId },
      {
        onSuccess: () => toast({ title: 'Convite enviado' }),
        onError: (e: any) =>
          toast({ title: 'Não foi possível convidar', description: e.message, variant: 'destructive' }),
      },
    );

  const enviarTexto = () => {
    if (!conversaCom || !texto.trim()) return;
    enviarMensagem.mutate(
      { paraPessoaId: conversaCom, conteudo: texto },
      {
        onSuccess: () => setTexto(''),
        onError: (e: any) =>
          toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' }),
      },
    );
  };

  const registrarIndicacao = async () => {
    if (!nova.descricao.trim()) {
      toast({ title: 'Escreva a indicação', variant: 'destructive' });
      return;
    }
    try {
      await criarIndicacao.mutateAsync({
        paraPessoaId: nova.para || null,
        descricao: nova.descricao.trim(),
      });
      setNova({ para: '', descricao: '' });
      toast({ title: 'Indicação registrada' });
    } catch (e: any) {
      toast({ title: 'Não foi possível registrar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AreaLayout
      tour="conecta"
 titulo="Conecta+" descricao="Sua presença na rede de negócios entre associadas.">
      <Helmet>
        <title>Conecta+ | Minha área</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {!liberado && (
        <div className="mb-6 rounded-xl border border-dashed border-border p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            O Conecta+ é para associadas com plano ativo. Você pode preencher seu perfil desde já — a rede,
            os grupos e as indicações abrem assim que o plano estiver em dia.
          </p>
          <Button asChild size="sm"><Link to="/planos">Ver planos</Link></Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList>
            <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
            <TabsTrigger value="rede">Rede</TabsTrigger>
            <TabsTrigger value="conexoes" className="gap-2">
              Conexões
              {convitesPendentes > 0 && (
                <Badge variant="default" className="h-5 min-w-5 justify-center px-1 text-[11px]">{convitesPendentes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2">
              Mensagens
              {totalNaoLidas > 0 && (
                <Badge variant="default" className="h-5 min-w-5 justify-center px-1 text-[11px]">{totalNaoLidas}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input id="empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cargo">O que você faz</Label>
                  <Input id="cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apresentacao">Apresentação</Label>
                <Textarea id="apresentacao" rows={4} value={form.apresentacao} onChange={(e) => setForm({ ...form, apresentacao: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interesses">Interesses (separe por vírgula)</Label>
                <Input
                  id="interesses"
                  placeholder="moda, marketing, franquias"
                  value={form.interesses}
                  onChange={(e) => setForm({ ...form, interesses: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Aceito receber contato da rede</p>
                  <p className="text-xs text-muted-foreground">Outras associadas poderão falar com você.</p>
                </div>
                <Switch
                  checked={form.aceita_contato}
                  onCheckedChange={(v) => setForm({ ...form, aceita_contato: v })}
                />
              </div>
              <Button onClick={enviar} disabled={salvar.isPending}>
                {salvar.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="rede" className="space-y-4">
            <Input
              placeholder="Buscar por nome, empresa ou interesse"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />
            {carregandoMembros ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : !listaFiltrada.length ? (
              <p className="text-sm text-muted-foreground">
                {liberado ? 'Nenhuma associada encontrada.' : 'A lista abre com o plano ativo.'}
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listaFiltrada.map((m) => {
                  const s = situacaoCom(m.pessoa_id);
                  return (
                    <CartaoMembro
                      key={m.pessoa_id}
                      membro={m}
                      situacao={s.situacao}
                      desabilitado={!liberado}
                      ocupado={convidar.isPending || responder.isPending}
                      onConectar={() => conectar(m.pessoa_id)}
                      onAceitar={() => s.id && responder.mutate({ id: s.id, situacao: 'aceita' })}
                      onRecusar={() => s.id && responder.mutate({ id: s.id, situacao: 'recusada' })}
                      onMensagem={() => abrirConversa(m.pessoa_id)}
                    />
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="conexoes" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h2 className="font-semibold">Convites recebidos</h2>
              {!convitesPendentes ? (
                <p className="text-sm text-muted-foreground">Nenhum convite esperando resposta.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(conexoes?.recebidasPendentes ?? []).map((c) => (
                    <li key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{nomePor(c.de_pessoa_id)}</p>
                        {c.mensagem && <p className="text-xs text-muted-foreground">{c.mensagem}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => responder.mutate({ id: c.id, situacao: 'aceita' })}>Aceitar</Button>
                        <Button size="sm" variant="ghost" onClick={() => responder.mutate({ id: c.id, situacao: 'recusada' })}>Recusar</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h2 className="font-semibold">Minhas conexões ({idsConectadas.length})</h2>
              {!idsConectadas.length ? (
                <p className="text-sm text-muted-foreground">Você ainda não tem conexões. Convide alguém na aba Rede.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(conexoes?.aceitas ?? []).map((c) => {
                    const outro = c.de_pessoa_id === pessoaId ? c.para_pessoa_id : c.de_pessoa_id;
                    const m = membroPor(outro);
                    return (
                      <li key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{m?.nome ?? 'Associada'}</p>
                          <p className="text-xs text-muted-foreground">
                            {[m?.cargo, m?.empresa].filter(Boolean).join(' · ') || 'Associada'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => abrirConversa(outro)}>
                            Mensagem
                            {!!naoLidasPor.get(outro) && (
                              <Badge variant="default" className="ml-2 h-5 min-w-5 justify-center px-1 text-[11px]">
                                {naoLidasPor.get(outro)}
                              </Badge>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!confirm('Desfazer esta conexão?')) return;
                              desfazer.mutate(c.id);
                            }}
                          >
                            Desfazer
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {!!conexoes?.enviadasPendentes.length && (
              <section className="rounded-xl border border-border bg-card p-6 space-y-3">
                <h2 className="font-semibold">Convites enviados</h2>
                <ul className="divide-y divide-border">
                  {conexoes.enviadasPendentes.map((c) => (
                    <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <p className="text-sm">{nomePor(c.para_pessoa_id)}</p>
                      <Button size="sm" variant="ghost" onClick={() => desfazer.mutate(c.id)}>Cancelar</Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </TabsContent>

          <TabsContent value="mensagens">
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <aside className="rounded-xl border border-border bg-card p-3">
                {!idsConectadas.length ? (
                  <p className="p-2 text-sm text-muted-foreground">Conecte-se com alguém para conversar.</p>
                ) : (
                  <ul className="space-y-1">
                    {idsConectadas.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => abrirConversa(id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            conversaCom === id ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate">{nomePor(id)}</span>
                            {!!naoLidasPor.get(id) && (
                              <Badge variant="default" className="h-5 min-w-5 justify-center px-1 text-[11px]">
                                {naoLidasPor.get(id)}
                              </Badge>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>

              <section className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-[320px]">
                {!conversaCom ? (
                  <p className="m-auto text-sm text-muted-foreground">Escolha uma conexão para ver a conversa.</p>
                ) : (
                  <>
                    <h2 className="font-semibold mb-3">{nomePor(conversaCom)}</h2>
                    <div className="flex-1 space-y-2 overflow-auto pr-1">
                      {!conversa.length ? (
                        <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Diga oi!</p>
                      ) : (
                        conversa.map((msg) => {
                          const minha = msg.de_pessoa_id === pessoaId;
                          return (
                            <div
                              key={msg.id}
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                minha ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                              <p className={`mt-1 text-[11px] ${minha ? 'opacity-80' : 'text-muted-foreground'}`}>
                                {new Date(msg.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        rows={2}
                        value={texto}
                        placeholder="Escreva sua mensagem"
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            enviarTexto();
                          }
                        }}
                      />
                      <Button onClick={enviarTexto} disabled={!texto.trim() || enviarMensagem.isPending}>
                        Enviar
                      </Button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </TabsContent>


          <TabsContent value="grupos">
            {!grupos.length ? (
              <p className="text-sm text-muted-foreground">Nenhum grupo disponível no momento.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {grupos.map((g: any) => (
                  <li key={g.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{g.nome}</p>
                      {g.descricao && <p className="text-xs text-muted-foreground">{g.descricao}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={g.participo ? 'outline' : 'default'}
                      disabled={!liberado || alternarGrupo.isPending}
                      onClick={() =>
                        alternarGrupo.mutate(
                          { grupoId: g.id, participar: !g.participo },
                          {
                            onError: (e: any) =>
                              toast({ title: 'Não foi possível atualizar', description: e.message, variant: 'destructive' }),
                          }
                        )
                      }
                    >
                      {g.participo ? 'Sair' : 'Participar'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="indicacoes" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">Registrar indicação</h2>
              <div className="space-y-1.5">
                <Label>Para quem</Label>
                <Select value={nova.para} onValueChange={(v) => setNova({ ...nova, para: v })}>
                  <SelectTrigger><SelectValue placeholder="Escolha uma associada" /></SelectTrigger>
                  <SelectContent>
                    {listaFiltrada.map((m) => (
                      <SelectItem key={m.pessoa_id} value={m.pessoa_id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descricao">O que você está indicando</Label>
                <Textarea
                  id="descricao"
                  rows={3}
                  value={nova.descricao}
                  onChange={(e) => setNova({ ...nova, descricao: e.target.value })}
                />
              </div>
              <Button onClick={registrarIndicacao} disabled={!liberado || criarIndicacao.isPending}>
                {criarIndicacao.isPending ? 'Enviando…' : 'Registrar indicação'}
              </Button>
              {!liberado && <p className="text-xs text-muted-foreground">Disponível com o plano ativo.</p>}
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Histórico</h2>
              {!indicacoes.length ? (
                <p className="text-sm text-muted-foreground">Você ainda não trocou indicações.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {indicacoes.map((i: any) => {
                    const recebida = i.para_pessoa_id === pessoaId;
                    return (
                      <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm">{i.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {recebida ? `De ${nomePor(i.de_pessoa_id)}` : `Para ${nomePor(i.para_pessoa_id)}`}
                          </p>
                        </div>
                        <Select
                          value={i.situacao}
                          onValueChange={(v) =>
                            atualizarIndicacao.mutate(
                              { id: i.id, situacao: v },
                              {
                                onError: (e: any) =>
                                  toast({ title: 'Não foi possível atualizar', description: e.message, variant: 'destructive' }),
                              }
                            )
                          }
                        >
                          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[...new Set([i.situacao, ...SITUACOES])].map((s) => (
                              <SelectItem key={s as string} value={s as string}>{s as string}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
    </AreaLayout>
  );
}
