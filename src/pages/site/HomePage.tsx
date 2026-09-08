import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, GraduationCap, Store, BookOpen } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlocosSite, useNegociosDestaque, usePosts } from '@/hooks/useSite';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const ICONES = [Users, GraduationCap, Store, BookOpen];

export default function HomePage() {
  const { data: blocos } = useBlocosSite();
  const { data: negocios, isLoading: carregandoNegocios } = useNegociosDestaque(6);
  const { data: posts, isLoading: carregandoPosts } = usePosts({ limite: 3 });

  const hero = blocos?.home_hero?.conteudo ?? {};
  const pilares: { titulo: string; texto: string; link: string }[] =
    blocos?.home_pilares?.conteudo?.itens ?? [];

  return (
    <SiteLayout>
      <Helmet>
        <title>Mulheres em Convergência | Rede de Empreendedorismo Feminino</title>
        <meta
          name="description"
          content="Rede de mulheres empreendedoras: associação, cursos, diretório de negócios e encontros. Conecte-se e dê visibilidade ao seu negócio."
        />
        <link rel="canonical" href={PRODUCTION_DOMAIN} />
        <meta property="og:title" content="Mulheres em Convergência | Rede de Empreendedorismo Feminino" />
        <meta property="og:description" content="Associação, cursos, diretório de negócios e encontros para mulheres empreendedoras." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PRODUCTION_DOMAIN} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'var(--grad-suave)' }}>
        <div className="container mx-auto px-4 py-20 lg:py-28 max-w-3xl text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
            {hero.titulo ?? 'Conecte-se à inteligência coletiva de mulheres empreendedoras'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {hero.subtitulo ?? 'Associação, formação e um diretório de negócios liderados por mulheres.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link to={hero.cta_link ?? '/planos'}>
                {hero.cta_texto ?? 'Quero fazer parte'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/diretorio">Ver o diretório</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pilares */}
      {pilares.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p, i) => {
              const Icone = ICONES[i % ICONES.length];
              return (
                <Link
                  key={p.titulo}
                  to={p.link}
                  className="group rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:-translate-y-1"
                  style={{ boxShadow: 'var(--sombra-1)' }}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Icone className="w-5 h-5" />
                  </span>
                  <h2 className="font-medium mb-1">{p.titulo}</h2>
                  <p className="text-sm text-muted-foreground">{p.texto}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Negócios */}
      <section className="bg-surface-quente py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Negócios da rede</h2>
              <p className="text-muted-foreground">Empreendedoras com acesso em dia no diretório.</p>
            </div>
            <Button asChild variant="ghost" className="shrink-0">
              <Link to="/diretorio">Ver todos <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>

          {carregandoNegocios ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
            </div>
          ) : negocios && negocios.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {negocios.map((n) => (
                <Link
                  key={n.id}
                  to={`/diretorio/${n.slug}`}
                  className="rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1"
                  style={{ boxShadow: 'var(--sombra-1)' }}
                >
                  <div className="h-32 bg-muted" style={n.capa_url ? { backgroundImage: `url(${n.capa_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
                  <div className="p-5">
                    <h3 className="font-medium">{n.nome}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.descricao}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Os negócios da rede aparecem aqui assim que forem migrados.</p>
          )}
        </div>
      </section>

      {/* Blog */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Convergindo</h2>
            <p className="text-muted-foreground">Histórias e aprendizados da nossa rede.</p>
          </div>
          <Button asChild variant="ghost" className="shrink-0">
            <Link to="/convergindo">Ler o blog <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>

        {carregandoPosts ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/convergindo/${p.slug}`}
                className="rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1"
                style={{ boxShadow: 'var(--sombra-1)' }}
              >
                <div className="h-32 bg-muted" style={p.capa_url ? { backgroundImage: `url(${p.capa_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
                <div className="p-5">
                  <h3 className="font-medium">{p.titulo}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.resumo}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Os textos do blog aparecem aqui assim que forem migrados.</p>
        )}
      </section>

      {/* Chamada final */}
      <section className="py-16" style={{ background: 'var(--grad-marca)' }}>
        <div className="container mx-auto px-4 text-center text-primary-foreground space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Pronta para fazer parte?</h2>
          <p className="opacity-90">Associe-se e ganhe presença no diretório, formação e encontros.</p>
          <Button asChild size="lg" variant="secondary"><Link to="/planos">Conhecer os planos</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
