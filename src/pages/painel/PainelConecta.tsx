import { useMemo, useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import { useConectaAdminDados, useSalvarGrupo, useExcluirGrupo } from '@/hooks/useConectaNovo';

const vazio = { id: '', slug: '', nome: '', descricao: '', ativo: true };

export default function PainelConecta() {
  const { data, isLoading } = useConectaAdminDados();
  const salvar = useSalvarGrupo();
  const excluir = useExcluirGrupo();
  const { toast } = useToast();
  const [form, setForm] = useState(vazio);

  const nomePor = useMemo(() => {
    const mapa = new Map((data?.pessoas ?? []).map((p) => [p.pessoa_id, p.nome]));
    return (id: string | null) => (id ? mapa.get(id) ?? 'Associada' : 'Rede');
  }, [data?.pessoas]);

  const membrosPorGrupo = useMemo(() => {
    const mapa = new Map<string, number>();
    (data?.membros ?? []).forEach((m: any) => mapa.set(m.grupo_id, (mapa.get(m.grupo_id) ?? 0) + 1));
    return mapa;
  }, [data?.membros]);

  const enviar = async () => {
    const nome = form.nome.trim();
    if (!nome) {
      toast({ title: 'Informe o nome do grupo', variant: 'destructive' });
      return;
    }
    try {
      await salvar.mutateAsync({
        id: form.id || undefined,
        nome,
        slug: form.slug.trim() || slugify(nome),
        descricao: form.descricao.trim() || null,
        ativo: form.ativo,
      });
      setForm(vazio);
      toast({ title: 'Grupo salvo' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout titulo="Conecta+" descricao="Grupos, participantes e indicações da rede.">
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <Tabs defaultValue="grupos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="pessoas">Participantes</TabsTrigger>
            <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          </TabsList>

          <TabsContent value="grupos" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">{form.id ? 'Editar grupo' : 'Novo grupo'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Endereço (opcional)</Label>
                  <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                <span className="text-sm">Grupo ativo</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={enviar} disabled={salvar.isPending}>{form.id ? 'Salvar' : 'Criar grupo'}</Button>
                {form.id && <Button variant="ghost" onClick={() => setForm(vazio)}>Cancelar</Button>}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Grupos criados</h2>
              {!data?.grupos.length ? (
                <p className="text-sm text-muted-foreground">Nenhum grupo criado ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.grupos.map((g: any) => (
                    <li key={g.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {g.nome} {!g.ativo && <Badge variant="outline" className="ml-2">inativo</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {membrosPorGrupo.get(g.id) ?? 0} participante(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setForm({
                              id: g.id,
                              slug: g.slug ?? '',
                              nome: g.nome ?? '',
                              descricao: g.descricao ?? '',
                              ativo: !!g.ativo,
                            })
                          }
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!confirm(`Excluir o grupo ${g.nome}?`)) return;
                            excluir.mutate(g.id, {
                              onError: (e: any) =>
                                toast({ title: 'Não foi possível excluir', description: e.message, variant: 'destructive' }),
                            });
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="pessoas">
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Associadas na rede ({data?.pessoas.length ?? 0})</h2>
              {!data?.pessoas.length ? (
                <p className="text-sm text-muted-foreground">Nenhum perfil preenchido ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.pessoas.map((p) => (
                    <li key={p.pessoa_id} className="py-3">
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.cargo, p.empresa].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="indicacoes">
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Indicações trocadas</h2>
              {!data?.indicacoes.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma indicação registrada.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.indicacoes.map((i: any) => (
                    <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm">{i.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {nomePor(i.de_pessoa_id)} → {nomePor(i.para_pessoa_id)}
                        </p>
                      </div>
                      <Badge variant="outline">{i.situacao}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
    </PainelLayout>
  );
}
