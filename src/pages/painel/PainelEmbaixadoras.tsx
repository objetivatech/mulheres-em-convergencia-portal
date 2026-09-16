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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { dinheiro } from '@/hooks/usePlanosEventos';
import {
  useEmbaixadorasAdmin,
  useSalvarEmbaixadora,
  useSalvarNivel,
  useSalvarMaterial,
  useExcluirMaterial,
  useSalvarRepasse,
  useBuscarPessoas,
} from '@/hooks/useEmbaixadorasAdmin';

const dataBr = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function PainelEmbaixadoras() {
  const { data, isLoading } = useEmbaixadorasAdmin();
  const salvarFicha = useSalvarEmbaixadora();
  const salvarNivel = useSalvarNivel();
  const salvarMaterial = useSalvarMaterial();
  const excluirMaterial = useExcluirMaterial();
  const salvarRepasse = useSalvarRepasse();
  const { toast } = useToast();

  const [busca, setBusca] = useState('');
  const { data: encontradas = [] } = useBuscarPessoas(busca);
  const [novaFicha, setNovaFicha] = useState({ pessoa_id: '', codigo: '', nivel_id: '' });
  const [nivel, setNivel] = useState({ id: '', nome: '', comissao_percentual: '10', minimo_indicacoes: '0', ordem: '0' });
  const [material, setMaterial] = useState({ id: '', titulo: '', descricao: '', url: '', tipo: 'arquivo', ordem: '0', ativo: true });
  const [repasse, setRepasse] = useState({ embaixadora_id: '', competencia: '', valor: '', situacao: 'pendente' });

  const resumoPor = useMemo(() => {
    const mapa = new Map((data?.resumo ?? []).map((r: any) => [r.embaixadora_id, r]));
    return (id: string) => mapa.get(id) as any;
  }, [data?.resumo]);

  const erro = (e: any) =>
    toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });

  const criarFicha = async () => {
    if (!novaFicha.pessoa_id || !novaFicha.codigo.trim()) {
      toast({ title: 'Escolha a associada e defina o código', variant: 'destructive' });
      return;
    }
    try {
      await salvarFicha.mutateAsync({
        pessoa_id: novaFicha.pessoa_id,
        codigo: novaFicha.codigo.trim().toLowerCase(),
        nivel_id: novaFicha.nivel_id || null,
        publicada: false,
        ativa: true,
      });
      setNovaFicha({ pessoa_id: '', codigo: '', nivel_id: '' });
      setBusca('');
      toast({ title: 'Embaixadora cadastrada' });
    } catch (e: any) {
      erro(e);
    }
  };

  return (
    <PainelLayout titulo="Embaixadoras" descricao="Programa de indicações: participantes, níveis, materiais e repasses.">
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <Tabs defaultValue="embaixadoras" className="space-y-6">
          <TabsList>
            <TabsTrigger value="embaixadoras">Embaixadoras</TabsTrigger>
            <TabsTrigger value="niveis">Níveis</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="repasses">Repasses</TabsTrigger>
          </TabsList>

          <TabsContent value="embaixadoras" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">Cadastrar embaixadora</h2>
              <div className="space-y-1.5">
                <Label htmlFor="busca">Buscar associada (nome, CPF ou e-mail)</Label>
                <Input id="busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite ao menos 3 letras" />
                {!!encontradas.length && (
                  <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                    {encontradas.map((p: any) => (
                      <li key={p.pessoa_id} className="flex items-center justify-between gap-3 p-2">
                        <span className="text-sm">{p.nome}</span>
                        <Button
                          size="sm"
                          variant={novaFicha.pessoa_id === p.pessoa_id ? 'default' : 'outline'}
                          onClick={() => setNovaFicha({ ...novaFicha, pessoa_id: p.pessoa_id })}
                        >
                          {novaFicha.pessoa_id === p.pessoa_id ? 'Escolhida' : 'Escolher'}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="codigo">Código de indicação</Label>
                  <Input id="codigo" value={novaFicha.codigo} onChange={(e) => setNovaFicha({ ...novaFicha, codigo: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nível</Label>
                  <Select value={novaFicha.nivel_id} onValueChange={(v) => setNovaFicha({ ...novaFicha, nivel_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sem nível" /></SelectTrigger>
                    <SelectContent>
                      {(data?.niveis ?? []).map((n: any) => (
                        <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={criarFicha} disabled={salvarFicha.isPending}>Cadastrar</Button>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Participantes</h2>
              {!data?.fichas.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma embaixadora cadastrada.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.fichas.map((f: any) => {
                    const r = resumoPor(f.id);
                    return (
                      <li key={f.id} className="py-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {f.pessoa?.nome_social || f.pessoa?.nome || 'Associada'}{' '}
                              <span className="text-xs text-muted-foreground">/{f.codigo}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r?.indicacoes ?? 0} indicação(ões) · {dinheiro(Number(r?.comissao_centavos ?? 0))} em comissão
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={!!f.publicada}
                                onCheckedChange={(v) => salvarFicha.mutate({ id: f.id, publicada: v }, { onError: erro })}
                              />
                              Publicada
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={!!f.ativa}
                                onCheckedChange={(v) => salvarFicha.mutate({ id: f.id, ativa: v }, { onError: erro })}
                              />
                              Ativa
                            </label>
                            <Select
                              value={f.nivel_id ?? ''}
                              onValueChange={(v) => salvarFicha.mutate({ id: f.id, nivel_id: v }, { onError: erro })}
                            >
                              <SelectTrigger className="w-40"><SelectValue placeholder="Nível" /></SelectTrigger>
                              <SelectContent>
                                {(data.niveis ?? []).map((n: any) => (
                                  <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="niveis" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">{nivel.id ? 'Editar nível' : 'Novo nível'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nivel-nome">Nome</Label>
                  <Input id="nivel-nome" value={nivel.nome} onChange={(e) => setNivel({ ...nivel, nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comissao">Comissão (%)</Label>
                  <Input id="comissao" type="number" value={nivel.comissao_percentual} onChange={(e) => setNivel({ ...nivel, comissao_percentual: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minimo">Mínimo de indicações</Label>
                  <Input id="minimo" type="number" value={nivel.minimo_indicacoes} onChange={(e) => setNivel({ ...nivel, minimo_indicacoes: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ordem-nivel">Ordem</Label>
                  <Input id="ordem-nivel" type="number" value={nivel.ordem} onChange={(e) => setNivel({ ...nivel, ordem: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={salvarNivel.isPending}
                  onClick={() => {
                    if (!nivel.nome.trim()) {
                      toast({ title: 'Informe o nome do nível', variant: 'destructive' });
                      return;
                    }
                    salvarNivel.mutate(
                      {
                        id: nivel.id || undefined,
                        nome: nivel.nome.trim(),
                        slug: nivel.nome.trim().toLowerCase().replace(/\s+/g, '-'),
                        comissao_percentual: Number(nivel.comissao_percentual) || 0,
                        minimo_indicacoes: Number(nivel.minimo_indicacoes) || 0,
                        ordem: Number(nivel.ordem) || 0,
                      },
                      {
                        onSuccess: () => setNivel({ id: '', nome: '', comissao_percentual: '10', minimo_indicacoes: '0', ordem: '0' }),
                        onError: erro,
                      }
                    );
                  }}
                >
                  Salvar nível
                </Button>
                {nivel.id && (
                  <Button variant="ghost" onClick={() => setNivel({ id: '', nome: '', comissao_percentual: '10', minimo_indicacoes: '0', ordem: '0' })}>
                    Cancelar
                  </Button>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <ul className="divide-y divide-border">
                {(data?.niveis ?? []).map((n: any) => (
                  <li key={n.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{n.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.comissao_percentual}% · a partir de {n.minimo_indicacoes} indicação(ões)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setNivel({
                          id: n.id,
                          nome: n.nome,
                          comissao_percentual: String(n.comissao_percentual),
                          minimo_indicacoes: String(n.minimo_indicacoes),
                          ordem: String(n.ordem),
                        })
                      }
                    >
                      Editar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="materiais" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">{material.id ? 'Editar material' : 'Novo material'}</h2>
              <div className="space-y-1.5">
                <Label htmlFor="mat-titulo">Título</Label>
                <Input id="mat-titulo" value={material.titulo} onChange={(e) => setMaterial({ ...material, titulo: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mat-desc">Descrição</Label>
                <Textarea id="mat-desc" rows={2} value={material.descricao} onChange={(e) => setMaterial({ ...material, descricao: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mat-url">Link do arquivo</Label>
                  <Input id="mat-url" value={material.url} onChange={(e) => setMaterial({ ...material, url: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mat-ordem">Ordem</Label>
                  <Input id="mat-ordem" type="number" value={material.ordem} onChange={(e) => setMaterial({ ...material, ordem: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={material.ativo} onCheckedChange={(v) => setMaterial({ ...material, ativo: v })} />
                <span className="text-sm">Visível para as embaixadoras</span>
              </div>
              <Button
                disabled={salvarMaterial.isPending}
                onClick={() => {
                  if (!material.titulo.trim() || !material.url.trim()) {
                    toast({ title: 'Informe título e link', variant: 'destructive' });
                    return;
                  }
                  salvarMaterial.mutate(
                    {
                      id: material.id || undefined,
                      titulo: material.titulo.trim(),
                      descricao: material.descricao.trim() || null,
                      url: material.url.trim(),
                      tipo: material.tipo,
                      ordem: Number(material.ordem) || 0,
                      ativo: material.ativo,
                    },
                    {
                      onSuccess: () => setMaterial({ id: '', titulo: '', descricao: '', url: '', tipo: 'arquivo', ordem: '0', ativo: true }),
                      onError: erro,
                    }
                  );
                }}
              >
                Salvar material
              </Button>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              {!data?.materiais.length ? (
                <p className="text-sm text-muted-foreground">Nenhum material publicado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.materiais.map((m: any) => (
                    <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{m.titulo} {!m.ativo && <Badge variant="outline" className="ml-2">oculto</Badge>}</p>
                        <p className="text-xs text-muted-foreground break-all">{m.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setMaterial({
                              id: m.id,
                              titulo: m.titulo ?? '',
                              descricao: m.descricao ?? '',
                              url: m.url ?? '',
                              tipo: m.tipo ?? 'arquivo',
                              ordem: String(m.ordem ?? 0),
                              ativo: !!m.ativo,
                            })
                          }
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!confirm(`Excluir ${m.titulo}?`)) return;
                            excluirMaterial.mutate(m.id, { onError: erro });
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

          <TabsContent value="repasses" className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
              <h2 className="font-semibold">Lançar repasse</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Embaixadora</Label>
                  <Select value={repasse.embaixadora_id} onValueChange={(v) => setRepasse({ ...repasse, embaixadora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                    <SelectContent>
                      {(data?.fichas ?? []).map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.pessoa?.nome_social || f.pessoa?.nome || f.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="competencia">Mês de referência</Label>
                  <Input id="competencia" type="date" value={repasse.competencia} onChange={(e) => setRepasse({ ...repasse, competencia: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" step="0.01" value={repasse.valor} onChange={(e) => setRepasse({ ...repasse, valor: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Situação</Label>
                  <Select value={repasse.situacao} onValueChange={(v) => setRepasse({ ...repasse, situacao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                disabled={salvarRepasse.isPending}
                onClick={() => {
                  if (!repasse.embaixadora_id || !repasse.competencia || !repasse.valor) {
                    toast({ title: 'Preencha embaixadora, mês e valor', variant: 'destructive' });
                    return;
                  }
                  salvarRepasse.mutate(
                    {
                      embaixadora_id: repasse.embaixadora_id,
                      competencia: repasse.competencia,
                      valor_centavos: Math.round(Number(repasse.valor) * 100),
                      situacao: repasse.situacao,
                      pago_em: repasse.situacao === 'pago' ? new Date().toISOString() : null,
                    },
                    {
                      onSuccess: () => setRepasse({ embaixadora_id: '', competencia: '', valor: '', situacao: 'pendente' }),
                      onError: erro,
                    }
                  );
                }}
              >
                Lançar
              </Button>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              {!data?.repasses.length ? (
                <p className="text-sm text-muted-foreground">Nenhum repasse lançado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.repasses.map((r: any) => {
                    const ficha = (data.fichas ?? []).find((f: any) => f.id === r.embaixadora_id);
                    return (
                      <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{ficha?.pessoa?.nome_social || ficha?.pessoa?.nome || '—'}</p>
                          <p className="text-xs text-muted-foreground">{dataBr(r.competencia)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{dinheiro(r.valor_centavos)}</span>
                          {r.situacao === 'pago' ? (
                            <Badge variant="secondary">pago</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                salvarRepasse.mutate(
                                  { id: r.id, situacao: 'pago', pago_em: new Date().toISOString() },
                                  { onError: erro }
                                )
                              }
                            >
                              Marcar como pago
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
    </PainelLayout>
  );
}
