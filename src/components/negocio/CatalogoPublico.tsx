/** Vitrine pública: produtos em abas por categoria + avaliações com formulário. */
import { useEffect, useMemo, useState } from 'react';

import { ShoppingBag, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaPessoa, useMeuPerfil } from '@/hooks/useMinhaArea';
import ConviteNewsletter, { jaAssinou } from '@/components/site/ConviteNewsletter';
import { TAGS_DESTAQUE, reais, useProdutos, useAvaliacoes, useEnviarAvaliacao, useMinhaAvaliacao, type Produto } from '@/hooks/useCatalogo';

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

export function AvaliacoesPublicas({ negocioId, donaPessoaId }: { negocioId: string; donaPessoaId?: string | null }) {
  const { data: avs = [] } = useAvaliacoes(negocioId);
  const { user } = useAuth();
  const { data: pessoaId } = useMinhaPessoa();
  const { data: perfil } = useMeuPerfil();
  const { data: minha } = useMinhaAvaliacao(negocioId, pessoaId ?? undefined);
  const enviar = useEnviarAvaliacao();
  const { toast } = useToast();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [editando, setEditando] = useState(false);
  const [escrevendo, setEscrevendo] = useState(false);
  const [convite, setConvite] = useState(false);
  const [enviadaAgora, setEnviadaAgora] = useState(false);
  const souDona = !!pessoaId && pessoaId === donaPessoaId;

  useEffect(() => {
    if (minha) { setNota(minha.nota); setComentario(minha.comentario ?? ''); }
  }, [minha]);

  const nomeConta = (perfil as any)?.nome_social || (perfil as any)?.nome || user?.email?.split('@')[0] || '';
  const nome = user ? nomeConta : nomeVisitante.trim();

  const comecar = () => {
    if (!user && !jaAssinou()) setConvite(true);
    else setEscrevendo(true);
  };

  const mandar = async () => {
    if (nota < 1) { toast({ title: 'Escolha de 1 a 5 estrelas', variant: 'destructive' }); return; }
    if (nome.length < 2) { toast({ title: 'Seu nome é obrigatório', description: 'Escreva pelo menos 2 letras.', variant: 'destructive' }); return; }
    try {
      await enviar.mutateAsync({ id: user ? minha?.id : undefined, negocio_id: negocioId, pessoa_id: user ? pessoaId ?? null : null, avaliador_nome: nome, nota, comentario: comentario.trim() || undefined });
      setEditando(false); setEscrevendo(false);
      if (!user) { setEnviadaAgora(true); setNota(0); setComentario(''); }
      toast({ title: minha ? 'Avaliação atualizada' : 'Obrigada pela sua avaliação! 💜' });
    } catch (e: any) {
      toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' });
    }
  };

  const media = avs.length ? avs.reduce((t, a) => t + a.nota, 0) / avs.length : 0;
  const mostrarForm = escrevendo || editando;

  return (
    <section id="avaliacoes" className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-semibold">Avaliações</h2>
        {avs.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {media.toFixed(1).replace('.', ',')} de 5 · {avs.length} {avs.length === 1 ? 'avaliação' : 'avaliações'}
          </span>
        )}
      </div>
      {avs.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há avaliações. Seja a primeira pessoa a avaliar!</p>}
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
        {souDona ? (
          <p className="text-sm text-muted-foreground">Este é o seu negócio — as avaliações vêm de clientes e de outras associadas.</p>
        ) : user && minha && !editando ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">Você deu {minha.nota} {minha.nota === 1 ? 'estrela' : 'estrelas'} a este negócio.</p>
            <Button size="sm" variant="outline" onClick={() => setEditando(true)}>Mudar minha avaliação</Button>
          </div>
        ) : !mostrarForm ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">{enviadaAgora ? 'Obrigada! Sua avaliação já está no ar.' : 'Conhece este negócio? Conte como foi sua experiência.'}</p>
            {!enviadaAgora && <Button size="sm" onClick={comecar}><Star className="mr-2 h-4 w-4" />Deixar uma avaliação</Button>}
          </div>
        ) : (
          <>
            <p className="font-medium">{minha ? 'Mudar minha avaliação' : 'Deixe sua avaliação'}</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Nota">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setNota(n)} aria-label={`${n} estrela${n > 1 ? 's' : ''}`}>
                  <Star className={`h-7 w-7 ${n <= nota ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            {!user && (
              <div className="space-y-1">
                <label htmlFor="nome-avaliador" className="text-sm font-medium">Seu nome <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(obrigatório)</span></label>
                <Input id="nome-avaliador" required aria-required="true" placeholder="Vai aparecer na avaliação" maxLength={80} value={nomeVisitante} onChange={(e) => setNomeVisitante(e.target.value)} />
              </div>
            )}
            <Textarea maxLength={1000} rows={3} placeholder="Conte como foi sua experiência (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            {user && <p className="text-xs text-muted-foreground">Vai aparecer com o nome: {nome}</p>}
            <div className="flex gap-2">
              <Button onClick={mandar} disabled={enviar.isPending || nota < 1 || nome.length < 2}>{minha ? 'Salvar' : 'Enviar avaliação'}</Button>
              <Button variant="ghost" onClick={() => { setEscrevendo(false); setEditando(false); }}>Cancelar</Button>
            </div>
          </>
        )}
      </div>
      <ConviteNewsletter
        aberto={convite}
        onFechar={(n) => { setConvite(false); if (n) setNomeVisitante(n); setEscrevendo(true); }}
        lista="Avaliadores"
        origem={`avaliacao:${window.location.pathname}`}
        titulo="Antes de avaliar, um convite 💌"
        texto="Gostou de conhecer este negócio? Assine nossa newsletter gratuita e receba dicas de empreendedorismo, novidades da rede e histórias inspiradoras de mulheres que fazem acontecer."
        botao="Quero assinar e avaliar"
        pular="Agora não, quero só avaliar"
        sucesso="Agora é só deixar sua avaliação."
      />
    </section>
  );
}
