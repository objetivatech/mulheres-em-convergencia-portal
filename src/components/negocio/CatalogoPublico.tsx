/** Vitrine pública: produtos em abas por categoria + avaliações com formulário. */
import { useMemo, useState } from 'react';
import { ShoppingBag, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TAGS_DESTAQUE, reais, useProdutos, useAvaliacoes, useEnviarAvaliacao, type Produto } from '@/hooks/useCatalogo';

function CardProduto({ p, whatsapp, negocio }: { p: Produto; whatsapp?: string | null; negocio: string }) {
  const [aberto, setAberto] = useState(false);
  const [foto, setFoto] = useState(0);
  const tag = p.destaque_tag ? TAGS_DESTAQUE[p.destaque_tag] : null;
  const num = (whatsapp ?? '').replace(/\D/g, '');
  const link = p.link_compra || (num ? `https://wa.me/${num.startsWith('55') ? num : '55' + num}?text=${encodeURIComponent(`Olá! Vi "${p.nome}" de ${negocio} no portal Mulheres em Convergência e quero saber mais.`)}` : null);
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card" style={{ boxShadow: 'var(--sombra-1)' }}>
      <button type="button" className="relative aspect-square bg-muted" onClick={() => p.fotos.length && setAberto(true)} aria-label={`Ver fotos de ${p.nome}`}>
        {p.fotos[0] ? <img src={p.fotos[0]} alt={p.nome} loading="lazy" className="h-full w-full object-cover" /> :
          <ShoppingBag className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />}
        {tag && <Badge className="absolute left-2 top-2">{tag.emoji} {tag.rotulo}</Badge>}
      </button>
      {p.fotos.length > 1 && (
        <div className="flex gap-1 px-3 pt-2">
          {p.fotos.map((f, i) => (
            <button key={i} type="button" onClick={() => { setFoto(i); setAberto(true); }} aria-label={`Foto ${i + 1}`}>
              <img src={f} alt="" loading="lazy" className="h-10 w-10 rounded object-cover border border-border" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-medium leading-snug">{p.nome}</h3>
        <p className="text-sm font-semibold text-primary">{reais(p.valor_centavos) ?? 'Sob consulta'}</p>
        <p className="line-clamp-3 text-sm text-muted-foreground">{p.descricao}</p>
        {link && (
          <Button asChild size="sm" className="mt-auto">
            <a href={link} target="_blank" rel="noopener noreferrer">
              {p.link_compra ? <ShoppingBag className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              {p.link_compra ? 'Comprar' : 'Quero saber mais'}
            </a>
          </Button>
        )}
      </div>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{p.nome}</DialogTitle></DialogHeader>
          {p.fotos[foto] && <img src={p.fotos[foto]} alt={p.nome} className="max-h-[60vh] w-full rounded object-contain" />}
          <div className="flex gap-2">{p.fotos.map((f, i) => (
            <button key={i} type="button" onClick={() => setFoto(i)}><img src={f} alt="" className={`h-14 w-14 rounded object-cover border ${i === foto ? 'border-primary' : 'border-border'}`} /></button>
          ))}</div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function CatalogoPublico({ negocioId, whatsapp, negocio }: { negocioId: string; whatsapp?: string | null; negocio: string }) {
  const { data: produtos = [] } = useProdutos(negocioId);
  const cats = useMemo(() => Array.from(new Set(produtos.map((p) => p.categoria?.trim()).filter(Boolean))) as string[], [produtos]);
  if (!produtos.length) return null;
  const grade = (lista: Produto[]) => (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{lista.map((p) => <CardProduto key={p.id} p={p} whatsapp={whatsapp} negocio={negocio} />)}</div>
  );
  return (
    <section id="produtos" className="space-y-4">
      <h2 className="text-xl font-semibold">Produtos e serviços</h2>
      {cats.length < 1 ? grade(produtos) : (
        <Tabs defaultValue="__todos">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="__todos">Todos</TabsTrigger>
            {cats.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="__todos" className="mt-4">{grade(produtos)}</TabsContent>
          {cats.map((c) => <TabsContent key={c} value={c} className="mt-4">{grade(produtos.filter((p) => p.categoria?.trim() === c))}</TabsContent>)}
        </Tabs>
      )}
    </section>
  );
}

export function AvaliacoesPublicas({ negocioId }: { negocioId: string }) {
  const { data: avs = [] } = useAvaliacoes(negocioId);
  const enviar = useEnviarAvaliacao();
  const { toast } = useToast();
  const [nota, setNota] = useState(0);
  const [nome, setNome] = useState('');
  const [comentario, setComentario] = useState('');
  const [enviada, setEnviada] = useState(false);

  const mandar = async () => {
    if (nota < 1 || nome.trim().length < 2) { toast({ title: 'Escolha as estrelas e escreva seu nome', variant: 'destructive' }); return; }
    try {
      await enviar.mutateAsync({ negocio_id: negocioId, avaliador_nome: nome.trim(), nota, comentario: comentario.trim() || undefined });
      setEnviada(true);
    } catch (e: any) {
      toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <section id="avaliacoes" className="space-y-4">
      <h2 className="text-xl font-semibold">Avaliações</h2>
      {avs.length === 0 && <p className="text-sm text-muted-foreground">Seja a primeira pessoa a avaliar.</p>}
      <ul className="space-y-3">
        {avs.map((a) => (
          <li key={a.id} className="rounded-[var(--radius)] border border-border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < a.nota ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />)}</span>
              <span className="text-sm font-medium">{a.avaliador_nome}</span>
              <span className="text-xs text-muted-foreground">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
            {a.comentario && <p className="text-sm text-muted-foreground">{a.comentario}</p>}
          </li>
        ))}
      </ul>
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 space-y-3">
        {enviada ? <p className="text-sm">Obrigada! Sua avaliação aparece aqui assim que a empreendedora aprovar. 💜</p> : (
          <>
            <p className="font-medium">Deixe sua avaliação</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Nota">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setNota(n)} aria-label={`${n} estrela${n > 1 ? 's' : ''}`}>
                  <Star className={`h-7 w-7 ${n <= nota ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <Input maxLength={80} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Textarea maxLength={1000} rows={3} placeholder="Conte como foi sua experiência (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            <Button onClick={mandar} disabled={enviar.isPending}>Enviar avaliação</Button>
          </>
        )}
      </div>
    </section>
  );
}
