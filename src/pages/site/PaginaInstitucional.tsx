import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagina } from '@/hooks/useSite';

export default function PaginaInstitucional({ slug: slugFixo }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugFixo ?? params.slug;
  const { data: pagina, isLoading } = usePagina(slug);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 max-w-3xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!pagina) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Página não encontrada</h1>
          <Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${pagina.seo_titulo || pagina.titulo} | Mulheres em Convergência`}</title>
        {pagina.seo_descricao && <meta name="description" content={pagina.seo_descricao} />}
      </Helmet>

      <article className="container mx-auto px-4 py-14 max-w-3xl space-y-6">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">{pagina.titulo}</h1>
        {pagina.conteudo && (
          <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: pagina.conteudo }} />
        )}
      </article>
    </SiteLayout>
  );
}
