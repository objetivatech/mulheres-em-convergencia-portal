import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePost } from '@/hooks/useSite';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePost(slug);

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
            author: post.autor?.nome ? { '@type': 'Person', name: post.autor.nome } : undefined,
            image: post.capa_url || undefined,
          })}
        </script>
      </Helmet>

      <article className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">{post.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            {post.publicado_em ? new Date(post.publicado_em).toLocaleDateString('pt-BR') : ''}
            {post.autor?.nome ? ` · ${post.autor.nome}` : ''}
          </p>
        </header>

        {post.capa_url && (
          <img src={post.capa_url} alt={post.titulo} loading="lazy" className="w-full rounded-[var(--radius)] object-cover" />
        )}

        {post.conteudo && (
          <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.conteudo }} />
        )}

        <div className="pt-6 border-t border-border">
          <Button asChild variant="outline"><Link to="/convergindo">Ver mais textos</Link></Button>
        </div>
      </article>
    </SiteLayout>
  );
}
