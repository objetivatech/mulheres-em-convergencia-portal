/**
 * Cadastro de produtos e serviços do negócio (usado pela dona e pela equipe).
 */
import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, EyeOff, Package, Star, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import CampoImagem from '@/components/imagens/CampoImagem';
import { useToast } from '@/hooks/use-toast';
import {
  useProdutos, useSalvarProduto, useExcluirProduto, TAGS_DESTAQUE, reais, type Produto,
  useAvaliacoes, useModerarAvaliacao,
} from '@/hooks/useCatalogo';

const VAZIO = { nome: '', descricao: '', valor: '', categoria: '', link_compra: '', fotos: ['', '', ''], destaque_tag: '', ativo: true };

export default function GerenciarCatalogo({ negocioId, whatsapp }: { negocioId: string; whatsapp?: string | null }) {
  const { data: produtos = [] } = useProdutos(negocioId, true);
  const salvar = useSalvarProduto();
  const excluir = useExcluirProduto();
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [f, setF] = useState(VAZIO);

  const categorias = Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean))) as string[];

  const abrir = (p?: Produto) => {
    setEditId(p?.id);
    setF(p ? {
      nome: p.nome, descricao: p.descricao, valor: p.valor_centavos == null ? '' : (p.valor_centavos / 100).toFixed(2).replace('.', ','),
      categoria: p.categoria ?? '', link_compra: p.link_compra ?? '', fotos: [...p.fotos, '', '', ''].slice(0, 3),
      destaque_tag: p.destaque_tag ?? '', ativo: p.ativo,
    } : VAZIO);
    setAberto(true);
  };

  const gravar = async () => {
    if (!f.nome.trim() || !f.descricao.trim()) {
      toast({ title: 'Preencha o nome e a descrição', variant: 'destructive' });
      return;
    }
    const v = f.valor.trim() ? Math.round(Number(f.valor.replace(/\./g, '').replace(',', '.')) * 100) : null;
    if (v != null && (Number.isNaN(v) || v < 0)) {
      toast({ title: 'Valor inválido', description: 'Use só números, como 49,90.', variant: 'destructive' });
      return;
    }
    let link = f.link_compra.trim();
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    try {
      await salvar.mutateAsync({
        id: editId,
        valores: {
          negocio_id: negocioId, nome: f.nome.trim(), descricao: f.descricao.trim(), valor_centavos: v,
          categoria: f.categoria.trim() || null, link_compra: link || null,
          fotos: f.fotos.map((x) => x.trim()).filter(Boolean).slice(0, 3),
          destaque_tag: f.destaque_tag || null, ativo: f.ativo,
          ...(editId ? {} : { ordem: produtos.length }),
        },
      });
      toast({ title: editId ? 'Produto atualizado' : 'Produto cadastrado' });
      setAberto(false);
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  const mover = async (i: number, d: -1 | 1) => {
    const a = produtos[i], b = produtos[i + d];
    if (!a || !b) return;
    await salvar.mutateAsync({ id: a.id, valores: { ordem: i + d } });
    await salvar.mutateAsync({ id: b.id, valores: { ordem: i } });
  };

  const linkWhats = () => {
    const num = (whatsapp ?? '').replace(/\D/g, '');
    if (!num) { toast({ title: 'Cadastre seu WhatsApp nos contatos primeiro' }); return; }
    const txt = `Olá! Vi "${f.nome || 'seu produto'}" no portal Mulheres em Convergência e quero saber mais.`;
    setF({ ...f, link_compra: `https://wa.me/${num.startsWith('55') ? num : '55' + num}?text=${encodeURIComponent(txt)}` });
  };

  return (
    <Card data-tour="negocio-catalogo">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Produtos e serviços</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Aparecem na sua página do diretório, separados por categoria.</p>
        </div>
        <Button size="sm" onClick={() => abrir()}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {produtos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum item ainda. Clique em “Adicionar” para mostrar o que você vende.</p>
        )}
        {produtos.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
            {p.fotos[0] ? <img src={p.fotos[0]} alt="" className="h-12 w-12 rounded object-cover" /> :
              <span className="flex h-12 w-12 items-center justify-center rounded bg-muted"><Package className="h-5 w-5 text-muted-foreground" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                {[p.categoria, reais(p.valor_centavos)].filter(Boolean).join(' · ') || 'Sem categoria'}
                {p.destaque_tag && ` · ${TAGS_DESTAQUE[p.destaque_tag]?.emoji} ${TAGS_DESTAQUE[p.destaque_tag]?.rotulo}`}
              </p>
            </div>
            {!p.ativo && <Badge variant="secondary"><EyeOff className="mr-1 h-3 w-3" />Oculto</Badge>}
            <Button variant="ghost" size="icon" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Descer" disabled={i === produtos.length - 1} onClick={() => mover(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => abrir(p)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Excluir"
              onClick={() => { if (confirm(`Excluir “${p.nome}”?`)) excluir.mutate(p.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Editar item' : 'Novo produto ou serviço'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nome *</Label>
              <Input maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Bolo de pote, Consultoria de imagem" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Breve descrição *</Label>
              <Textarea rows={3} maxLength={1000} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Conte em poucas palavras o que é e para quem serve." />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (opcional)</Label>
              <Input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value.replace(/[^\d,.]/g, '') })} placeholder="Ex.: 49,90 — vazio = sob consulta" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria (opcional)</Label>
              <Input list="cat-produtos" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} placeholder="Ex.: Doces, Vestidos, Mentorias" />
              <datalist id="cat-produtos">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Link do botão de compra (opcional)</Label>
              <div className="flex gap-2">
                <Input value={f.link_compra} onChange={(e) => setF({ ...f, link_compra: e.target.value })} placeholder="Link da sua loja, Shopee, Hotmart..." />
                <Button type="button" variant="outline" onClick={linkWhats}>Usar meu WhatsApp</Button>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Como destacar este item?</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={!f.destaque_tag ? 'default' : 'outline'} onClick={() => setF({ ...f, destaque_tag: '' })}>Sem selo</Button>
                {Object.entries(TAGS_DESTAQUE).map(([k, t]) => (
                  <Button key={k} type="button" size="sm" variant={f.destaque_tag === k ? 'default' : 'outline'} onClick={() => setF({ ...f, destaque_tag: k })}>
                    {t.emoji} {t.rotulo}
                  </Button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Fotos (até 3 — a primeira é a capa)</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {f.fotos.map((u, i) => (
                  <CampoImagem key={i} pasta="negocios-produtos" alturaPrevia="h-24" value={u}
                    onChange={(url) => setF({ ...f, fotos: f.fotos.map((x, j) => (j === i ? url : x)) })} />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Mostrar no site</p>
                <p className="text-xs text-muted-foreground">Desligue para esconder sem apagar.</p>
              </div>
              <Switch checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={gravar} disabled={salvar.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Avaliações recebidas: aparecem na hora; só a equipe pode ocultar (ex.: ofensas). */
export function ModerarAvaliacoes({ negocioId, admin = false }: { negocioId: string; admin?: boolean }) {
  const { data = [] } = useAvaliacoes(negocioId, true);
  const moderar = useModerarAvaliacao();
  const visiveis = data.filter((a) => a.status === 'aprovado');
  const media = visiveis.length ? visiveis.reduce((t, a) => t + a.nota, 0) / visiveis.length : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avaliações recebidas</CardTitle>
        {visiveis.length > 0 && (
          <p className="text-sm text-muted-foreground">Média {media.toFixed(1).replace('.', ',')} · {visiveis.length} no site</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Ainda não chegou nenhuma avaliação.</p>}
        {!admin && data.length > 0 && (
          <p className="text-xs text-muted-foreground">Avaliações aparecem no site na hora. Se alguma for ofensiva, fale com a equipe.</p>
        )}
        {data.map((a) => (
          <div key={a.id} className="rounded-lg border border-border p-3 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < a.nota ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />)}</span>
              <span className="text-sm font-medium">{a.avaliador_nome}</span>
              <Badge variant={a.status === 'aprovado' ? 'default' : 'secondary'}>
                {a.status === 'aprovado' ? 'No site' : a.status === 'rejeitado' ? 'Oculta pela equipe' : 'Antiga, aguardando'}
              </Badge>
            </div>
            {a.comentario && <p className="text-sm text-muted-foreground">{a.comentario}</p>}
            {admin && (
              <div className="flex gap-2">
                {a.status !== 'aprovado' && <Button size="sm" variant="outline" onClick={() => moderar.mutate({ id: a.id, status: 'aprovado' })}><Check className="mr-1 h-4 w-4" />Mostrar no site</Button>}
                {a.status !== 'rejeitado' && <Button size="sm" variant="ghost" onClick={() => moderar.mutate({ id: a.id, status: 'rejeitado' })}><X className="mr-1 h-4 w-4" />Ocultar</Button>}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
