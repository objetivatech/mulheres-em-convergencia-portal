import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import TextoSite from '@/components/site/TextoSite';
import SiteLayout from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePost } from '@/hooks/useSite';
import { useMemo } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import BannerNoPost from '@/components/blog/BannerNoPost';
import ComentariosPost from '@/components/blog/ComentariosPost';
import { useNegocioDaAutora, usePostsRelacionados } from '@/hooks/useBlogExtras';
import { stripHtml } from '@/lib/stripHtml';

const minutos = (html?: string | null) => Math.max(1, Math.round(stripHtml(html).split(/\s+/).filter(Boolean).length / 200));

/** Divide o HTML no fim do parágrafo do meio, para o banner automático. */
function dividir(html: string): [string, string] {
  const fins: number[] = [];
  const re = /<\/p>/gi; let m;
  while ((m = re.exec(html))) fins.push(m.index + m[0].length);
  if (fins.length < 2) return [html, ''];
  const corte = fins[Math.floor(fins.length / 2) - 1];
  return [html.slice(0, corte), html.slice(corte)];
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePost(slug);
  const autor = post?.autor as { nome?: string; foto_url?: string | null; bio?: string | null; pessoa_id?: string | null } | undefined;
  const { data: negocioAutora } = useNegocioDaAutora(autor?.pessoa_id);
  const { data: relacionados = [] } = usePostsRelacionados(post?.id);
  const [parte1, parte2] = useMemo(() => dividir(post?.conteudo ?? ''), [post?.conteudo]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 max-w-3xl space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-56 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-40 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!post) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Texto não encontrado</h1>
          <Button asChild variant="outline"><Link to="/convergindo">Voltar ao blog</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const titulo = post.seo_titulo || post.titulo;

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${titulo} | Convergindo`}</title>
        {(post.seo_descricao || post.resumo) && (
          <meta name="description" content={(post.seo_descricao || post.resumo || '').slice(0, 155)} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={titulo} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.titulo,
            datePublished: post.publicado_em,
            author: autor?.nome ? { '@type': 'Person', name: autor.nome } : undefined,
            image: post.capa_url || undefined,
          })}
        </script>
      </Helmet>

      <section className="bg-grad-hero text-primary-foreground">
        <header className="container mx-auto max-w-3xl space-y-3 px-4 py-14">
          <TextoSite as="p" chave="blog.titulo" className="text-xs font-semibold uppercase tracking-widest opacity-80" />
          <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">{post.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-primary-foreground/90">
            {autor?.nome && (
              <span className="flex items-center gap-2 font-semibold">
                {autor.foto_url
                  ? <img src={autor.foto_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-foreground/60" />
                  : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 font-bold">{autor.nome.charAt(0)}</span>}
                {autor.nome}
              </span>
            )}
            {post.publicado_em && <span>· {new Date(post.publicado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>}
            <span className="flex items-center gap-1">· <Clock className="h-3.5 w-3.5" /> {minutos(post.conteudo)} min de leitura</span>
          </div>
        </header>
      </section>

      <article className="container mx-auto max-w-3xl space-y-6 px-4 py-12">
        {post.capa_url && (
          <img src={post.capa_url} alt={post.titulo} loading="lazy" className="w-full rounded-[var(--radius)] object-cover" />
        )}

        {post.conteudo && (
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: parte1 }} />
            <BannerNoPost />
            {parte2 && <div dangerouslySetInnerHTML={{ __html: parte2 }} />}
          </div>
        )}

        {autor?.nome && (
          <aside className="flex flex-col gap-5 rounded-[var(--radius)] border border-border bg-card p-6 sm:flex-row sm:items-center" style={{ boxShadow: 'var(--sombra-1)' }}>
            {autor.foto_url
              ? <img src={autor.foto_url} alt={autor.nome} className="h-24 w-24 shrink-0 rounded-full object-cover" />
              : <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-grad-marca text-3xl font-bold text-primary-foreground">{autor.nome.charAt(0)}</span>}
            <div className="min-w-0 flex-1 space-y-2">
              <TextoSite as="p" chave="blog.post.autora_titulo" className="texto-grad-marca text-xs font-bold uppercase tracking-widest" />
              <p className="text-xl font-extrabold">{autor.nome}</p>
              {autor.bio && <p className="text-sm text-muted-foreground">{stripHtml(autor.bio, 400)}</p>}
              {negocioAutora && (
                <Button asChild size="sm" className="mt-1">
                  <Link to={`/diretorio/${negocioAutora.slug}`}><TextoSite chave="blog.post.negocio_botao" /><ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
            </div>
          </aside>
        )}

        {relacionados.length > 0 && (
          <section className="space-y-4 pt-4">
            <TextoSite as="h2" chave="blog.post.relacionados" className="text-2xl font-extrabold" />
            <div className="grid gap-4 sm:grid-cols-3">
              {relacionados.map((r) => (
                <Link key={r.id} to={`/convergindo/${r.slug}`} className="group overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-transform hover:-translate-y-1" style={{ boxShadow: 'var(--sombra-1)' }}>
                  <div className="aspect-[16/10] overflow-hidden bg-grad-marca">
                    {r.capa_url && <img src={r.capa_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 font-semibold leading-snug">{r.titulo}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {minutos(r.conteudo)} min de leitura</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <ComentariosPost postId={post.id} />

        <div className="pt-6 border-t border-border">
          <Button asChild variant="outline"><Link to="/convergindo"><TextoSite chave="blog.post.voltar" /></Link></Button>
        </div>
      </article>
    </SiteLayout>
  );
}
