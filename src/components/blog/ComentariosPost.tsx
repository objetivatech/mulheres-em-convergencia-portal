/** Comentários públicos do post — mesma mecânica das avaliações de negócio.
 *  Visitante comenta com nome obrigatório; convite opcional da newsletter (lista "Leitoras do Blog")
 *  só inscreve quem preencher e confirmar. Entra no ar na hora; só a equipe oculta. */
import { useState } from 'react';
import { MessageCircle, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TextoSite from '@/components/site/TextoSite';
import ConviteNewsletter, { jaAssinou } from '@/components/site/ConviteNewsletter';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaPessoa, useMeuPerfil } from '@/hooks/useMinhaArea';
import { useToast } from '@/hooks/use-toast';
import { useTexto } from '@/hooks/useTextosSite';
import { useComentarios, useEnviarComentario, useOcultarComentario } from '@/hooks/useBlogExtras';

export default function ComentariosPost({ postId }: { postId: string }) {
  const { user, isAdmin } = useAuth();
  const { data: pessoaId } = useMinhaPessoa();
  const { data: perfil } = useMeuPerfil();
  const { data: lista = [] } = useComentarios(postId);
  const enviar = useEnviarComentario();
  const ocultar = useOcultarComentario();
  const { toast } = useToast();
  const vazio = useTexto('blog.post.comentarios_vazio');
  const [escrevendo, setEscrevendo] = useState(false);
  const [convite, setConvite] = useState(false);
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [texto, setTexto] = useState('');

  const nomeConta = (perfil as any)?.nome_social || (perfil as any)?.nome || user?.email?.split('@')[0] || '';
  const nome = (user ? nomeConta : nomeVisitante).trim();

  const comecar = () => { if (!user && !jaAssinou()) setConvite(true); else setEscrevendo(true); };

  const mandar = async () => {
    if (nome.length < 2) { toast({ title: 'Seu nome é obrigatório', description: 'Escreva pelo menos 2 letras.', variant: 'destructive' }); return; }
    if (texto.trim().length < 2) { toast({ title: 'Escreva seu comentário', variant: 'destructive' }); return; }
    try {
      await enviar.mutateAsync({ post_id: postId, nome: nome.slice(0, 80), conteudo: texto.trim().slice(0, 2000), pessoa_id: user ? pessoaId ?? null : null });
      setTexto(''); setEscrevendo(false);
      toast({ title: 'Obrigada pelo seu comentário! 💜' });
    } catch (e: any) {
      toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <section id="comentarios" className="space-y-4">
      <div className="flex items-baseline gap-3">
        <TextoSite as="h2" chave="blog.post.comentarios" className="text-2xl font-extrabold" />
        {lista.length > 0 && <span className="text-sm text-muted-foreground">{lista.length}</span>}
      </div>
      {lista.length === 0 && <p className="text-sm text-muted-foreground">{vazio}</p>}
      <ul className="space-y-3">
        {lista.map((c) => (
          <li key={c.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-marca text-sm font-bold text-primary-foreground">{c.nome.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.nome}</p>
                <p className="text-xs text-muted-foreground">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</p>
              </div>
              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => ocultar.mutate({ id: c.id, post_id: postId })} aria-label="Ocultar comentário">
                  <EyeOff className="mr-1 h-4 w-4" />Ocultar
                </Button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-foreground/90">{c.conteudo}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-4">
        {!escrevendo ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TextoSite as="p" chave="blog.post.comentar_convite" className="text-sm" />
            <Button size="sm" onClick={comecar}><MessageCircle className="mr-2 h-4 w-4" /><TextoSite chave="blog.post.comentar_botao" /></Button>
          </div>
        ) : (
          <>
            {!user && (
              <div className="space-y-1">
                <label htmlFor="nome-comentario" className="text-sm font-medium">Seu nome <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(obrigatório)</span></label>
                <Input id="nome-comentario" required aria-required="true" maxLength={80} placeholder="Vai aparecer no comentário" value={nomeVisitante} onChange={(e) => setNomeVisitante(e.target.value)} />
              </div>
            )}
            <Textarea rows={4} maxLength={2000} placeholder="Escreva seu comentário" value={texto} onChange={(e) => setTexto(e.target.value)} />
            {user && <p className="text-xs text-muted-foreground">Vai aparecer com o nome: {nome}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEscrevendo(false)}>Cancelar</Button>
              <Button onClick={mandar} disabled={enviar.isPending || nome.length < 2 || texto.trim().length < 2}>Publicar comentário</Button>
            </div>
          </>
        )}
      </div>
      <ConviteNewsletter
        aberto={convite}
        onFechar={(n) => { setConvite(false); if (n) setNomeVisitante(n); setEscrevendo(true); }}
        lista="Leitoras do Blog"
        origem={`blog:${window.location.pathname}`}
        prefixo="convite.blog"
      />
    </section>
  );
}
