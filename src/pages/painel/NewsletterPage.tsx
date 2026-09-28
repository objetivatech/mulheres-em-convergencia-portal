import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Send, Users, Mail, Plus, Trash2 } from 'lucide-react';
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
  const [camp, setCamp] = useState({ titulo: '', assunto: '', previa: '', html: '', grupos: [] as string[] });

  const situacao = useQuery({
    queryKey: ['sender-situacao'],
    queryFn: () => chamar<{ conectado: boolean; canal: { canal: string; remetente: string }; grupos?: Grupo[] }>({ acao: 'situacao' }),
  });
  const campanhas = useQuery({
    queryKey: ['sender-campanhas'],
    enabled: !!situacao.data?.conectado,
    queryFn: () => chamar<{ campanhas: Campanha[] }>({ acao: 'campanhas' }),
  });

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
              <div className="space-y-2"><Label>Conteúdo</Label>
                <EditorRico value={camp.html} onChange={(html) => setCamp((c) => ({ ...c, html }))} pasta="newsletter" /></div>
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
                  onClick={() => acao.mutate({ acao: 'teste_campanha', email: emailTeste, assunto: camp.assunto, html: camp.html })}>
                  <Mail className="w-4 h-4 mr-2" />Enviar teste
                </Button>
                <Button disabled={acao.isPending} onClick={() => acao.mutate({ acao: 'criar_campanha', ...camp })}>
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
