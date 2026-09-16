import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2 } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import { EditorRico } from '@/components/editor/EditorRico';
import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';
import {
  useEventoAdmin, useSalvarEvento, useSalvarFilha, useExcluirFilha, useInscricoesEvento,
} from '@/hooks/usePainelPlanosEventos';
import { dinheiro } from '@/hooks/usePlanosEventos';

const VAZIO = {
  titulo: '', slug: '', resumo: '', descricao: '', capa_url: '',
  online: false, link_online: '', local_nome: '', endereco: '', cidade: '', uf: '',
  inicio_em: '', fim_em: '', vagas: '', gratuito: false, publicado: false, destaque: false,
};

const paraCentavos = (texto: string) => {
  const limpo = String(texto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round((Number(limpo) || 0) * 100);
};
const paraReais = (centavos: number) =>
  ((centavos ?? 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const paraLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

export default function PainelEventoEditor() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: evento } = useEventoAdmin(id);
  const salvar = useSalvarEvento();
  const salvarLote = useSalvarFilha('evento_lotes');
  const excluirLote = useExcluirFilha('evento_lotes');
  const salvarPalestrante = useSalvarFilha('evento_palestrantes');
  const excluirPalestrante = useExcluirFilha('evento_palestrantes');
  const salvarCupom = useSalvarFilha('evento_cupons');
  const excluirCupom = useExcluirFilha('evento_cupons');
  const { data: inscricoes } = useInscricoesEvento(novo ? undefined : id);
  const [form, setForm] = useState<Record<string, any>>(VAZIO);

  useEffect(() => {
    if (!evento) return;
    setForm({
      ...VAZIO,
      ...Object.fromEntries(Object.entries(evento).filter(([k]) => k in VAZIO).map(([k, v]) => [k, v ?? ''])),
      inicio_em: paraLocal(evento.inicio_em),
      fim_em: paraLocal(evento.fim_em),
      vagas: evento.vagas ?? '',
      online: !!evento.online,
      gratuito: !!evento.gratuito,
      publicado: !!evento.publicado,
      destaque: !!evento.destaque,
    });
  }, [evento]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const gravar = async () => {
    if (!form.titulo.trim()) {
      toast({ title: 'Dê um título ao encontro', variant: 'destructive' });
      return;
    }
    if (!form.inicio_em) {
      toast({ title: 'Informe a data e a hora de início', variant: 'destructive' });
      return;
    }
    const valores = {
      titulo: form.titulo.trim(),
      slug: (form.slug || slugify(form.titulo, { lower: true, strict: true })).trim(),
      resumo: form.resumo || null,
      descricao: form.descricao || null,
      capa_url: form.capa_url || null,
      online: !!form.online,
      link_online: form.link_online || null,
      local_nome: form.local_nome || null,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      inicio_em: new Date(form.inicio_em).toISOString(),
      fim_em: form.fim_em ? new Date(form.fim_em).toISOString() : null,
      vagas: form.vagas === '' ? null : Number(form.vagas),
      gratuito: !!form.gratuito,
      publicado: !!form.publicado,
      destaque: !!form.destaque,
    };
    const novoId = await salvar.mutateAsync({ id: novo ? undefined : id, valores });
    if (novo) navigate(`/painel-conteudo/eventos/${novoId}`, { replace: true });
  };

  const lotes = (evento?.lotes ?? []).slice().sort((a: any, b: any) => a.ordem - b.ordem);
  const palestrantes = (evento?.palestrantes ?? []).slice().sort((a: any, b: any) => a.ordem - b.ordem);
  const cupons = evento?.cupons ?? [];

  return (
    <PainelLayout
      titulo={novo ? 'Novo encontro' : form.titulo || 'Editar encontro'}
      descricao="Data, local, ingressos e inscrições."
      acoes={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/painel-conteudo/planos-eventos')}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="lotes" disabled={novo}>Ingressos</TabsTrigger>
          <TabsTrigger value="cupons" disabled={novo}>Cupons</TabsTrigger>
          <TabsTrigger value="palestrantes" disabled={novo}>Quem fala</TabsTrigger>
          <TabsTrigger value="inscricoes" disabled={novo}>Inscrições</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Título</Label>
                      <Input value={form.titulo} onChange={(e) => campo('titulo', e.target.value)} />
                    </div>
                    <div>
                      <Label>Endereço na internet</Label>
                      <Input value={form.slug} placeholder="gerado a partir do título"
                        onChange={(e) => campo('slug', e.target.value)} />
                    </div>
                    <div>
                      <Label>Começa em</Label>
                      <Input type="datetime-local" value={form.inicio_em}
                        onChange={(e) => campo('inicio_em', e.target.value)} />
                    </div>
                    <div>
                      <Label>Termina em (opcional)</Label>
                      <Input type="datetime-local" value={form.fim_em}
                        onChange={(e) => campo('fim_em', e.target.value)} />
                    </div>
                    <div>
                      <Label>Vagas (deixe vazio para ilimitado)</Label>
                      <Input type="number" min={1} value={form.vagas}
                        onChange={(e) => campo('vagas', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Chamada curta</Label>
                    <Textarea rows={2} value={form.resumo} onChange={(e) => campo('resumo', e.target.value)} />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <EditorRico
                      value={form.descricao}
                      onChange={(html) => campo('descricao', html)}
                      pasta="eventos"
                      minHeight={280}
                      placeholder="Conte como será o encontro..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Onde acontece</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encontro online</span>
                    <Switch checked={form.online} onCheckedChange={(v) => campo('online', v)} />
                  </div>
                  {form.online ? (
                    <div>
                      <Label>Link da sala</Label>
                      <Input value={form.link_online} onChange={(e) => campo('link_online', e.target.value)} />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Nome do local</Label>
                        <Input value={form.local_nome} onChange={(e) => campo('local_nome', e.target.value)} />
                      </div>
                      <div>
                        <Label>Endereço</Label>
                        <Input value={form.endereco} onChange={(e) => campo('endereco', e.target.value)} />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input value={form.cidade} onChange={(e) => campo('cidade', e.target.value)} />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input maxLength={2} value={form.uf}
                          onChange={(e) => campo('uf', e.target.value.toUpperCase())} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Imagem de capa</CardTitle></CardHeader>
                <CardContent>
                  <ImageCropUploader
                    value={form.capa_url || undefined}
                    onChange={(url) => campo('capa_url', url ?? '')}
                    folder="eventos"
                    label="Capa do encontro"
                    dimensions={IMAGE_PRESETS.blogFeatured}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Publicação</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aparece no site</span>
                    <Switch checked={form.publicado} onCheckedChange={(v) => campo('publicado', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Destacar</span>
                    <Switch checked={form.destaque} onCheckedChange={(v) => campo('destaque', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entrada gratuita</span>
                    <Switch checked={form.gratuito} onCheckedChange={(v) => campo('gratuito', v)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Ingressos ------------------------------------------------------ */}
        <TabsContent value="lotes" className="space-y-3">
          {lotes.map((lote: any) => (
            <Card key={lote.id}>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Label>Nome</Label>
                  <Input defaultValue={lote.nome}
                    onBlur={(e) => salvarLote.mutate({ id: lote.id, valores: { nome: e.target.value } })} />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input defaultValue={paraReais(lote.valor_centavos)}
                    onBlur={(e) => salvarLote.mutate({ id: lote.id, valores: { valor_centavos: paraCentavos(e.target.value) } })} />
                </div>
                <div>
                  <Label>Vagas</Label>
                  <Input type="number" defaultValue={lote.vagas ?? ''}
                    onBlur={(e) => salvarLote.mutate({ id: lote.id, valores: { vagas: e.target.value === '' ? null : Number(e.target.value) } })} />
                </div>
                <div>
                  <Label>Vende até</Label>
                  <Input type="datetime-local" defaultValue={paraLocal(lote.fim_em)}
                    onBlur={(e) => salvarLote.mutate({ id: lote.id, valores: { fim_em: e.target.value ? new Date(e.target.value).toISOString() : null } })} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={lote.ativo}
                      onCheckedChange={(v) => salvarLote.mutate({ id: lote.id, valores: { ativo: v } })} />
                    <span className="text-xs text-muted-foreground">À venda</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => excluirLote.mutate(lote.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline"
            onClick={() => salvarLote.mutate({ valores: { evento_id: id, nome: 'Novo lote', valor_centavos: 0, ordem: lotes.length, ativo: true } })}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar lote
          </Button>
        </TabsContent>

        {/* Cupons --------------------------------------------------------- */}
        <TabsContent value="cupons" className="space-y-3">
          {cupons.map((cupom: any) => (
            <Card key={cupom.id}>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-5">
                <div>
                  <Label>Código</Label>
                  <Input defaultValue={cupom.codigo}
                    onBlur={(e) => salvarCupom.mutate({ id: cupom.id, valores: { codigo: e.target.value.toUpperCase() } })} />
                </div>
                <div>
                  <Label>Desconto</Label>
                  <Input defaultValue={cupom.desconto_valor}
                    onBlur={(e) => salvarCupom.mutate({ id: cupom.id, valores: { desconto_valor: Number(e.target.value) || 0 } })} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input defaultValue={cupom.desconto_tipo} placeholder="percentual ou valor"
                    onBlur={(e) => salvarCupom.mutate({ id: cupom.id, valores: { desconto_tipo: e.target.value } })} />
                </div>
                <div>
                  <Label>Limite de usos</Label>
                  <Input type="number" defaultValue={cupom.limite_uso ?? ''}
                    onBlur={(e) => salvarCupom.mutate({ id: cupom.id, valores: { limite_uso: e.target.value === '' ? null : Number(e.target.value) } })} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={cupom.ativo}
                      onCheckedChange={(v) => salvarCupom.mutate({ id: cupom.id, valores: { ativo: v } })} />
                    <span className="text-xs text-muted-foreground">Ativo</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => excluirCupom.mutate(cupom.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline"
            onClick={() => salvarCupom.mutate({ valores: { evento_id: id, codigo: 'NOVO', desconto_tipo: 'percentual', desconto_valor: 10, ativo: true } })}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar cupom
          </Button>
        </TabsContent>

        {/* Palestrantes --------------------------------------------------- */}
        <TabsContent value="palestrantes" className="space-y-3">
          {palestrantes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Label>Nome</Label>
                  <Input defaultValue={p.nome}
                    onBlur={(e) => salvarPalestrante.mutate({ id: p.id, valores: { nome: e.target.value } })} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Mini currículo</Label>
                  <Input defaultValue={p.minibio ?? ''}
                    onBlur={(e) => salvarPalestrante.mutate({ id: p.id, valores: { minibio: e.target.value } })} />
                </div>
                <div className="flex items-end justify-end">
                  <Button variant="ghost" size="sm" onClick={() => excluirPalestrante.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="sm:col-span-6">
                  <ImageCropUploader
                    value={p.foto_url ?? undefined}
                    onChange={(url) => salvarPalestrante.mutate({ id: p.id, valores: { foto_url: url } })}
                    folder="eventos"
                    label="Foto"
                    dimensions={IMAGE_PRESETS.ambassadorPhoto}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline"
            onClick={() => salvarPalestrante.mutate({ valores: { evento_id: id, nome: 'Nova convidada', ordem: palestrantes.length } })}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar convidada
          </Button>
        </TabsContent>

        {/* Inscrições ----------------------------------------------------- */}
        <TabsContent value="inscricoes" className="space-y-3">
          {!inscricoes?.length ? (
            <p className="text-muted-foreground">Nenhuma inscrição ainda.</p>
          ) : (
            inscricoes.map((i: any) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{i.nome}</p>
                  <p className="text-sm text-muted-foreground">{i.email}{i.telefone ? ` · ${i.telefone}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{dinheiro(i.valor_centavos)}</span>
                  <Badge variant={i.situacao === 'confirmada' ? 'default' : 'secondary'}>{i.situacao}</Badge>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PainelLayout>
  );
}
