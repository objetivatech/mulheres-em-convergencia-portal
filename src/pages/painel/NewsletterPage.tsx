import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Send, Users, Mail, Plus, Trash2, Copy } from 'lucide-react';
import { MODELOS, TAG_NOME, blocoPosts, montarNewsletter, type ModeloId, type PostNews } from '@/lib/newsletterModelos';
import PainelLayout from '@/components/painel/PainelLayout';
import EditorRico from '@/components/editor/EditorRico';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { mensagemErroEdge } from '@/lib/erroEdge';

type Grupo = { id: string; title: string; recipient_count?: number; active_subscribers?: number };
type Campanha = { id: string; title?: string; subject?: string; status?: string; created?: string };

async function chamar<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('sender-newsletter', { body });
  if (error) throw new Error(await mensagemErroEdge(error));
  return data as T;
}

export default function NewsletterPage() {
  const qc = useQueryClient();
  const [novaLista, setNovaLista] = useState('');
  const [emailTeste, setEmailTeste] = useState('');
  const [contato, setContato] = useState({ email: '', nome: '' });
  const [camp, setCamp] = useState({ titulo: '', assunto: '', previa: '', html: MODELOS[0].corpoInicial, grupos: [] as string[] });

  const situacao = useQuery({
    queryKey: ['sender-situacao'],
    queryFn: () => chamar<{ conectado: boolean; canal: { canal: string; remetente: string }; grupos?: Grupo[] }>({ acao: 'situacao' }),
  });
  const campanhas = useQuery({
    queryKey: ['sender-campanhas'],
    enabled: !!situacao.data?.conectado,
    queryFn: () => chamar<{ campanhas: Campanha[] }>({ acao: 'campanhas' }),
  });

  const [modelo, setModelo] = useState<ModeloId>('boletim');
  const [cta, setCta] = useState({ rotulo: '', url: '' });
  const [postsSel, setPostsSel] = useState<string[]>([]);
  const postsQ = useQuery({
    queryKey: ['newsletter-posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts')
        .select('slug,titulo,resumo,capa_url,publicado_em')
        .eq('situacao', 'publicado').order('publicado_em', { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
  const emailEquipe = useQuery({
    queryKey: ['newsletter-remetente'],
    queryFn: async () => {
      const { data } = await supabase.from('textos_site').select('chave,valor').in('chave', ['contato.email', 'contato.endereco']);
      const m = new Map((data ?? []).map((t) => [t.chave, t.valor ?? '']));
      return { email: m.get('contato.email') || 'juntas@mulheresemconvergencia.com.br', endereco: m.get('contato.endereco') || '' };
    },
  });
  const postsEscolhidos: PostNews[] = postsSel
    .map((s) => (postsQ.data ?? []).find((p) => p.slug === s))
    .filter(Boolean) as PostNews[];
  const htmlFinal = useMemo(() => montarNewsletter({
    modelo, corpo: camp.html, previa: camp.previa, posts: postsEscolhidos,
    cta: cta.url ? cta : null,
    remetente: { nome: 'Mulheres em Convergência', email: emailEquipe.data?.email ?? 'juntas@mulheresemconvergencia.com.br', endereco: emailEquipe.data?.endereco },
  }), [modelo, camp.html, camp.previa, postsEscolhidos, cta, emailEquipe.data]);
  const copiar = async (texto: string, msg: string) => {
    await navigator.clipboard.writeText(texto);
    toast({ title: msg, description: 'Cole no bloco de HTML personalizado do Sender.' });
  };
  const copiarBlocoPosts = () => copiar(blocoPosts(postsEscolhidos), 'HTML dos posts copiado');

  const grupos = situacao.data?.grupos ?? [];
  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ['sender-situacao'] });
    qc.invalidateQueries({ queryKey: ['sender-campanhas'] });
  };

  const acao = useMutation({
    mutationFn: (body: Record<string, unknown>) => chamar(body),
    onSuccess: (_d, body) => {
      recarregar();
      const msgs: Record<string, string> = {
        criar_grupo: 'Lista criada', adicionar_contato: 'Contato adicionado',
        sincronizar_portal: 'Pessoas do portal enviadas para a lista',
        criar_campanha: 'Campanha salva como rascunho', teste_campanha: 'Teste enviado',
        enviar_campanha: 'Campanha enviada', excluir_campanha: 'Campanha excluída',
      };
      toast({ title: msgs[String(body.acao)] ?? 'Pronto' });
      if (body.acao === 'criar_campanha') setCamp({ titulo: '', assunto: '', previa: '', html: '', grupos: [] });
      if (body.acao === 'criar_grupo') setNovaLista('');
      if (body.acao === 'adicionar_contato') setContato({ email: '', nome: '' });
    },
    onError: (e: Error) => toast({ title: 'Não deu certo', description: e.message, variant: 'destructive' }),
  });

  if (situacao.data && !situacao.data.conectado) {
    return (
      <PainelLayout titulo="Newsletter" descricao="Listas, contatos e campanhas pelo Sender.net.">
        <Card>
          <CardHeader>
            <CardTitle>Sender.net ainda não conectado</CardTitle>
            <CardDescription>
              Falta cadastrar a chave de acesso do Sender.net no portal. Canal atual dos e-mails do sistema:{' '}
              <strong>{situacao.data.canal.canal}</strong>.
            </CardDescription>
          </CardHeader>
        </Card>
      </PainelLayout>
    );
  }

  return (
    <PainelLayout
      titulo="Newsletter"
      descricao="Listas, contatos e campanhas pelo Sender.net. Nada é enviado sem você clicar em enviar."
      acoes={<Button variant="outline" size="sm" onClick={recarregar}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button>}
    >
      <Tabs defaultValue="campanhas">
        <TabsList className="mb-6">
          <TabsTrigger value="campanhas"><Send className="w-4 h-4 mr-2" />Campanhas</TabsTrigger>
          <TabsTrigger value="listas"><Users className="w-4 h-4 mr-2" />Listas e contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="campanhas" className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Nova campanha</CardTitle>
              <CardDescription>Escreva, envie um teste para você e salve. O envio para a lista é feito na lista ao lado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nome interno</Label>
                <Input value={camp.titulo} onChange={(e) => setCamp({ ...camp, titulo: e.target.value })} placeholder="Ex.: Newsletter de outubro" /></div>
              <div className="space-y-2"><Label>Assunto do e-mail</Label>
                <Input value={camp.assunto} onChange={(e) => setCamp({ ...camp, assunto: e.target.value })} /></div>
              <div className="space-y-2"><Label>Texto de prévia (aparece ao lado do assunto)</Label>
                <Input value={camp.previa} onChange={(e) => setCamp({ ...camp, previa: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Modelo MeC</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MODELOS.map((m) => (
                    <button key={m.id} type="button"
                      onClick={() => {
                        if (camp.html && camp.html !== MODELOS.find((x) => x.id === modelo)?.corpoInicial
                          && !window.confirm('Trocar o modelo substitui o texto atual. Continuar?')) return;
                        setModelo(m.id); setCamp((c) => ({ ...c, html: m.corpoInicial }));
                      }}
                      className={`text-left rounded-xl border p-3 transition ${modelo === m.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                      <strong className="text-sm block">{m.nome}</strong>
                      <span className="text-xs text-muted-foreground">{m.descricao}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Texto da newsletter</Label>
                <p className="text-xs text-muted-foreground">Use <code>{TAG_NOME}</code> para chamar a pessoa pelo primeiro nome.</p>
                <EditorRico value={camp.html} onChange={(html) => setCamp((c) => ({ ...c, html }))} pasta="newsletter" /></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1"><Label>Botão principal (opcional)</Label>
                  <Input placeholder="Ex.: Garanta sua vaga" value={cta.rotulo} onChange={(e) => setCta({ ...cta, rotulo: e.target.value })} /></div>
                <div className="space-y-1"><Label>Link do botão</Label>
                  <Input placeholder="https://..." value={cta.url} onChange={(e) => setCta({ ...cta, url: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Posts do blog ({postsSel.length} escolhidos)</Label>
                  <Button type="button" size="sm" variant="outline" disabled={!postsSel.length} onClick={copiarBlocoPosts}>
                    <Copy className="w-3 h-3 mr-1" />Copiar HTML dos posts
                  </Button>
                </div>
                <div className="max-h-56 overflow-auto rounded-xl border divide-y">
                  {(postsQ.data ?? []).map((p) => (
                    <label key={p.slug} className="flex items-center gap-3 p-2 text-sm cursor-pointer">
                      <Checkbox checked={postsSel.includes(p.slug)}
                        onCheckedChange={(v) => setPostsSel(v ? [...postsSel, p.slug] : postsSel.filter((s) => s !== p.slug))} />
                      {p.capa_url && <img src={p.capa_url} alt="" className="w-12 h-8 object-cover rounded" />}
                      <span className="flex-1">{p.titulo}</span>
                      <span className="text-xs text-muted-foreground">{p.publicado_em ? new Date(p.publicado_em).toLocaleDateString('pt-BR') : ''}</span>
                    </label>
                  ))}
                  {postsQ.data && !postsQ.data.length && <p className="p-3 text-sm text-muted-foreground">Nenhum post publicado.</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prévia do e-mail</Label>
                <iframe title="Prévia da newsletter" srcDoc={htmlFinal} className="w-full h-[560px] rounded-xl border bg-background" />
                <p className="text-xs text-muted-foreground">O rodapé com "Cancelar inscrição" e os dados da MeC entra sempre. O link de cancelar só funciona no envio pelo Sender (no teste ele não abre).</p>
              </div>
              <div className="space-y-2">
                <Label>Enviar para as listas</Label>
                {grupos.length === 0 && <p className="text-sm text-muted-foreground">Crie uma lista na aba "Listas e contatos".</p>}
                {grupos.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={camp.grupos.includes(g.id)}
                      onCheckedChange={(v) => setCamp({ ...camp, grupos: v ? [...camp.grupos, g.id] : camp.grupos.filter((x) => x !== g.id) })}
                    />
                    {g.title} <span className="text-muted-foreground">({g.active_subscribers ?? g.recipient_count ?? 0})</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <Input className="max-w-xs" type="email" placeholder="seu@email.com" value={emailTeste} onChange={(e) => setEmailTeste(e.target.value)} />
                <Button variant="secondary" disabled={!emailTeste || !camp.html || acao.isPending}
                  onClick={() => acao.mutate({ acao: 'teste_campanha', email: emailTeste, assunto: camp.assunto, html: htmlFinal })}>
                  <Mail className="w-4 h-4 mr-2" />Enviar teste
                </Button>
                <Button variant="outline" disabled={!camp.html} onClick={() => copiar(htmlFinal, 'HTML completo copiado')}>
                  <Copy className="w-4 h-4 mr-2" />Copiar HTML completo
                </Button>
                <Button disabled={acao.isPending} onClick={() => acao.mutate({ acao: 'criar_campanha', ...camp, html: htmlFinal })}>
                  Salvar campanha
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Campanhas no Sender</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {campanhas.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
              {(campanhas.data?.campanhas ?? []).map((c) => (
                <div key={c.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{c.title || c.subject}</strong>
                    <Badge variant="outline">{c.status ?? '—'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.subject}</p>
                  {String(c.status ?? '').toUpperCase() === 'DRAFT' && (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={acao.isPending} onClick={() => {
                        if (window.confirm(`Enviar "${c.title || c.subject}" agora para as listas escolhidas?`)) acao.mutate({ acao: 'enviar_campanha', id: c.id });
                      }}><Send className="w-3 h-3 mr-1" />Enviar</Button>
                      <Button size="sm" variant="ghost" disabled={acao.isPending} onClick={() => {
                        if (window.confirm('Excluir este rascunho?')) acao.mutate({ acao: 'excluir_campanha', id: c.id });
                      }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  )}
                </div>
              ))}
              {campanhas.data && !campanhas.data.campanhas.length && <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listas" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Listas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {grupos.map((g) => (
                <div key={g.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <span>{g.title} <span className="text-muted-foreground">({g.active_subscribers ?? g.recipient_count ?? 0})</span></span>
                  <Button size="sm" variant="outline" disabled={acao.isPending} onClick={() => {
                    if (window.confirm(`Enviar todas as pessoas cadastradas no portal para a lista "${g.title}"?`)) acao.mutate({ acao: 'sincronizar_portal', grupo: g.id });
                  }}>Trazer pessoas do portal</Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Nome da nova lista" value={novaLista} onChange={(e) => setNovaLista(e.target.value)} />
                <Button disabled={!novaLista || acao.isPending} onClick={() => acao.mutate({ acao: 'criar_grupo', titulo: novaLista })}>
                  <Plus className="w-4 h-4 mr-1" />Criar
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Adicionar contato</CardTitle>
              <CardDescription>Entra em todas as listas marcadas na campanha ao lado, se houver.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nome" value={contato.nome} onChange={(e) => setContato({ ...contato, nome: e.target.value })} />
              <Input type="email" placeholder="email@exemplo.com" value={contato.email} onChange={(e) => setContato({ ...contato, email: e.target.value })} />
              <Button disabled={!contato.email || acao.isPending}
                onClick={() => acao.mutate({ acao: 'adicionar_contato', ...contato, grupos: camp.grupos })}>Adicionar</Button>
              <p className="text-xs text-muted-foreground">Remetente dos e-mails: {situacao.data?.canal.remetente}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PainelLayout>
  );
}
