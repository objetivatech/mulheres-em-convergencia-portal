import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, GraduationCap, Store, Megaphone, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import fotoHero from '@/assets/home-hero.jpg';
import fotoEncontro from '@/assets/home-encontro.jpg';
import { usePlanos, useEventos, dinheiro } from '@/hooks/usePlanosEventos';
import CardNegocio from '@/components/site/CardNegocio';
import SiteLayout from '@/components/site/SiteLayout';
import VitrineParceiros from '@/components/site/VitrineParceiros';
import TextoSite from '@/components/site/TextoSite';
import ImagemSite from '@/components/site/ImagemSite';
import { useTexto } from '@/hooks/useTextosSite';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlocosSite, useTodosNegocios, usePosts } from '@/hooks/useSite';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { embaralhar } from '@/lib/embaralhar';

const ICONES = [Users, GraduationCap, Store, Megaphone];
const CORES_PILAR = [
  { fundo: 'bg-primary/10', texto: 'text-primary' },
  { fundo: 'bg-secondary/15', texto: 'text-secondary' },
  { fundo: 'bg-tertiary/25', texto: 'text-foreground' },
  { fundo: 'bg-warning/10', texto: 'text-warning' },
];
const PERIODO: Record<string, string> = { mensal: 'mês', trimestral: 'trimestre', semestral: 'semestre', anual: 'ano', unico: 'único' };
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
  const listaPilares = [0, 1, 2, 3].map((i) => pilares[i] ?? { titulo: undefined as any, texto: undefined as any, link: '' });
  const { data: planos = [] } = usePlanos();
  const { data: eventos = [] } = useEventos();
  const planosHome = useMemo(() => {
    const mensais = planos.filter((p) => p.periodicidade === 'mensal');
    return (mensais.length >= 2 ? mensais : planos).slice(0, 3);
  }, [planos]);
  const totalNegocios = negocios?.length ?? 0;
  const totalCidades = useMemo(() => new Set((negocios ?? []).map((n) => `${n.cidade ?? ''}-${n.uf ?? ''}`.toLowerCase()).filter((c) => c !== '-')).size, [negocios]);
  const { isAdmin } = useAuth();
  const seloTpl = useTexto('home.hero.selo');
  const seloHero = seloTpl.replace('{n}', String(totalNegocios));
  const linkBotao = useTexto('home.hero.botao_link', hero.cta_link);
  const linkBotao2 = useTexto('home.hero.botao_secundario_link');
  const fotoDepo = useTexto('home.depoimento.foto');
  const rot1 = useTexto('home.numeros.1'), rot2 = useTexto('home.numeros.2'), rot3 = useTexto('home.numeros.3'), rot4 = useTexto('home.numeros.4');
  const motivos = [useTexto('home.porque.item1'), useTexto('home.porque.item2'), useTexto('home.porque.item3'), useTexto('home.porque.item4')];
  const linksPilares = [useTexto('home.pilar1.link'), useTexto('home.pilar2.link'), useTexto('home.pilar3.link'), useTexto('home.pilar4.link')];
  const numeros = [
    { valor: totalNegocios || '—', rotulo: rot1, cor: 'text-primary' },
    { valor: tipos.length || '—', rotulo: rot2, cor: 'text-secondary' },
    { valor: eventos.length || '—', rotulo: rot3, cor: 'text-secondary' },
    { valor: totalCidades || '—', rotulo: rot4, cor: 'text-warning' },
  ];

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
      <section className="relative overflow-hidden bg-grad-hero text-primary-foreground">
        <div className="grid lg:grid-cols-2">
          <div className="relative px-6 py-16 sm:px-10 lg:py-24 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12">
            <span aria-hidden className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary-foreground/10" />
            <span className="relative inline-flex rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-semibold">
              {seloHero}
            </span>
            <TextoSite as="h1" chave="home.hero.titulo" padrao={hero.titulo} className="relative mt-6 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[3.4rem]" />
            <TextoSite as="p" multilinha chave="home.hero.subtitulo" padrao={hero.subtitulo} className="relative mt-6 max-w-xl text-lg text-primary-foreground/90" />
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-card text-primary font-semibold hover:bg-card/90">
                <Link to={linkBotao}><TextoSite chave="home.hero.botao" padrao={hero.cta_texto} /><ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/60 bg-transparent text-primary-foreground font-semibold hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to={linkBotao2}><TextoSite chave="home.hero.botao_secundario" padrao="Ver o diretório" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-[320px] lg:min-h-0">
            <ImagemSite chave="home.hero.imagem" padrao={fotoHero} alt="Empreendedora da rede" width={896} height={1152} eager className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="container mx-auto px-4">
        <div className="relative z-10 -mt-12 grid grid-cols-2 overflow-hidden rounded-[var(--radius)] border border-border bg-card lg:grid-cols-4" style={{ boxShadow: 'var(--sombra-3)' }}>
          {numeros.map((n, i) => (
            <div key={i} className={`px-4 py-6 text-center ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-border`}>
              <p className={`text-3xl font-extrabold ${n.cor}`}>{n.valor}</p>
              <p className="text-sm text-muted-foreground">{n.rotulo}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimento */}
      <section className="container mx-auto px-4 py-14">
        <figure className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent">
            {fotoDepo ? <ImagemSite chave="home.depoimento.foto" alt="Autora do depoimento" className="h-full w-full object-cover" />
              : <><span aria-hidden className="flex h-full w-full items-center justify-center text-5xl font-extrabold text-primary">“</span><ImagemSite chave="home.depoimento.foto" alt="" className="hidden" /></>}
          </div>
          <TextoSite as="blockquote" multilinha chave="home.depoimento.texto" className="flex-1 text-xl italic leading-relaxed" />
          <TextoSite as="figcaption" chave="home.depoimento.autora" className="text-sm text-muted-foreground md:max-w-[14rem]" />
        </figure>
      </section>

      {/* Pilares */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mb-10 text-center">
          <TextoSite as="h2" chave="home.pilares.titulo" />
          <TextoSite as="p" chave="home.pilares.subtitulo" className="mt-2 text-muted-foreground" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listaPilares.map((p, i) => {
            const Icone = ICONES[i % ICONES.length];
            const cor = CORES_PILAR[i % CORES_PILAR.length];
            return (
              <Link key={i} to={linksPilares[i] || p.link} className={`group rounded-[var(--radius)] p-6 transition-all hover:-translate-y-1 ${cor.fundo}`}>
                <Icone className={`mb-3 h-6 w-6 ${cor.texto}`} />
                <TextoSite as="h3" chave={`home.pilar${i + 1}.titulo`} padrao={p.titulo} className={`text-lg font-bold ${cor.texto}`} />
                <TextoSite as="p" chave={`home.pilar${i + 1}.texto`} padrao={p.texto} className="mt-1 text-sm text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

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

      {/* Por que se associar */}
      <section className="bg-surface-quente py-16 lg:py-20">
        <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2 lg:gap-14">
          <div className="relative overflow-hidden rounded-[var(--radius)]" style={{ boxShadow: 'var(--sombra-2)' }}>
            <ImagemSite chave="home.porque.imagem" padrao={fotoEncontro} alt="Encontro de associadas da rede" width={1280} height={832} className="aspect-[3/2] w-full object-cover" />
          </div>
          <div>
            <TextoSite as="p" chave="home.porque.selo" className="text-xs font-semibold uppercase tracking-widest text-secondary" />
            <TextoSite as="h2" chave="home.porque.titulo" className="mt-2" />
            <ul className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className={`flex gap-3 ${motivos[i - 1] || isAdmin ? '' : 'hidden'}`}><Check className="mt-1 h-5 w-5 shrink-0 text-success" /><TextoSite chave={`home.porque.item${i}`} /></li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 font-semibold"><Link to="/planos"><TextoSite chave="home.porque.botao" /></Link></Button>
          </div>
        </div>
      </section>

      {/* Planos */}
      {planosHome.length > 0 && (
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mb-10 text-center">
            <TextoSite as="h2" chave="home.planos.titulo" />
            <TextoSite as="p" chave="home.planos.subtitulo" className="mt-2 text-muted-foreground" />
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {planosHome.map((p) => (
              <div key={p.id} className={`relative flex flex-col rounded-[var(--radius)] border bg-card p-7 ${p.destaque ? 'border-2 border-primary sombra-marca' : 'border-border'}`}>
                {p.destaque && <span className="absolute -top-3 left-6 rounded-full bg-grad-marca px-3 py-0.5 text-xs font-semibold text-primary-foreground">Mais escolhido</span>}
                <h3 className="text-lg font-bold">{p.nome}</h3>
                {p.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>}
                <p className={`mt-4 text-3xl font-extrabold ${p.destaque ? 'text-primary' : ''}`}>{dinheiro(p.valor_centavos)}<span className="text-sm font-normal text-muted-foreground"> /{PERIODO[p.periodicidade] ?? p.periodicidade}</span></p>
                <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5 text-sm">
                  {p.beneficios.slice(0, 5).map((b) => <li key={b} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{b}</li>)}
                </ul>
                <Button asChild variant={p.destaque ? 'default' : 'outline'} className={`mt-6 font-semibold ${p.destaque ? 'bg-grad-marca' : ''}`}>
                  <Link to="/planos">Quero este plano</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm"><Link to="/planos" className="font-semibold text-primary hover:underline"><TextoSite chave="home.planos.link" /></Link></p>
        </section>
      )}

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
      <section className="bg-foreground py-20 text-background">
        <div className="container mx-auto space-y-4 px-4 text-center">
          <TextoSite as="h2" chave="home.cta.titulo" />
          <TextoSite as="p" chave="home.cta.subtitulo" className="text-background/70" />
          <Button asChild size="lg" className="bg-grad-marca font-semibold sombra-marca hover:opacity-90"><Link to="/planos"><TextoSite chave="home.cta.botao" /></Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
