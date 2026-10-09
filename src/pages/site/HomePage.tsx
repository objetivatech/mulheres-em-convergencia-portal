import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, GraduationCap, Store, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import CardNegocio from '@/components/site/CardNegocio';
import SiteLayout from '@/components/site/SiteLayout';
import VitrineParceiros from '@/components/site/VitrineParceiros';
import TextoSite from '@/components/site/TextoSite';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlocosSite, useTodosNegocios, usePosts } from '@/hooks/useSite';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { embaralhar } from '@/lib/embaralhar';

const ICONES = [Users, GraduationCap, Store, BookOpen];
const POR_PAGINA = 9; // 3 linhas x 3 colunas

export default function HomePage() {
  const { data: blocos } = useBlocosSite();
  const { data: negocios, isLoading: carregandoNegocios } = useTodosNegocios();
  // Novo sorteio a cada visita/atualização, incluindo TODOS os publicados.
  const sorteados = useMemo(() => embaralhar(negocios ?? []), [negocios]);
  const [pagina, setPagina] = useState(0);
  const [tipo, setTipo] = useState('');
  // Os 20 tipos de negócio mais comuns entre os publicados (sem repetir por maiúsculas/acentos).
  const tipos = useMemo(() => {
    const cont = new Map<string, { rotulo: string; n: number }>();
    (negocios ?? []).forEach((n) => {
      const r = n.categoria?.trim();
      if (!r) return;
      const k = r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const x = cont.get(k) ?? { rotulo: r, n: 0 };
      x.n += 1; cont.set(k, x);
    });
    return [...cont.entries()].sort((a, b) => b[1].n - a[1].n || a[1].rotulo.localeCompare(b[1].rotulo, 'pt-BR')).slice(0, 20)
      .map(([k, v]) => ({ chave: k, rotulo: v.rotulo }));
  }, [negocios]);
  const chaveDe = (c?: string | null) => (c ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtrados = useMemo(() => (tipo ? sorteados.filter((n) => chaveDe(n.categoria) === tipo) : sorteados), [sorteados, tipo]);
  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
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
              <Link to="/diretorio"><TextoSite chave="home.hero.botao_secundario" padrao="Ver o diretório" /></Link>
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
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icone className="w-5 h-5" />
                    </span>
                    <h2 className="text-base font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{p.titulo}</h2>
                  </div>
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
              <TextoSite as="h2" chave="home.negocios.titulo" padrao="Negócios da rede" className="text-2xl lg:text-3xl font-semibold tracking-tight" />
              <TextoSite as="p" chave="home.negocios.subtitulo" padrao="Empreendedoras com acesso em dia no diretório." className="text-muted-foreground" />
            </div>
            <Button asChild variant="ghost" className="shrink-0">
              <Link to="/diretorio">Ver todos <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>

          {tipos.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de negócio">
              <Button size="sm" variant={tipo === '' ? 'default' : 'outline'} className="rounded-full" onClick={() => { setTipo(''); setPagina(0); }}>Todos</Button>
              {tipos.map((t) => (
                <Button key={t.chave} size="sm" variant={tipo === t.chave ? 'default' : 'outline'} className="rounded-full uppercase tracking-wide text-xs"
                  onClick={() => { setTipo(tipo === t.chave ? '' : t.chave); setPagina(0); }}>
                  {t.rotulo}
                </Button>
              ))}
            </div>
          )}

          {carregandoNegocios ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
            </div>
          ) : sorteados.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA).map((n) => <CardNegocio key={n.id} negocio={n} />)}
              </div>
              {totalPaginas > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Páginas de negócios">
                  <Button variant="outline" size="icon" aria-label="Página anterior" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPaginas }).map((_, i) => (
                    <Button key={i} size="sm" variant={i === pagina ? 'default' : 'ghost'} onClick={() => setPagina(i)} aria-label={`Página ${i + 1}`}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" aria-label="Próxima página" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Os negócios da rede aparecem aqui assim que forem migrados.</p>
          )}
        </div>
      </section>

      {/* Blog */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <TextoSite as="h2" chave="home.blog.titulo" padrao="Convergindo" className="text-2xl lg:text-3xl font-semibold tracking-tight" />
            <TextoSite as="p" chave="home.blog.subtitulo" padrao="Histórias e aprendizados da nossa rede." className="text-muted-foreground" />
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

      <VitrineParceiros />

      {/* Chamada final */}
      <section className="py-16" style={{ background: 'var(--grad-marca)' }}>
        <div className="container mx-auto px-4 text-center text-primary-foreground space-y-4">
          <TextoSite as="h2" chave="home.cta.titulo" padrao="Pronta para fazer parte?" className="text-3xl font-semibold tracking-tight" />
          <TextoSite as="p" chave="home.cta.subtitulo" padrao="Associe-se e ganhe presença no diretório, formação e encontros." className="opacity-90" />
          <Button asChild size="lg" variant="secondary"><Link to="/planos"><TextoSite chave="home.cta.botao" padrao="Conhecer os planos" /></Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
