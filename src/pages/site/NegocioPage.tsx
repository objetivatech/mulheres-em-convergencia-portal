import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { Globe, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import TextoSite from '@/components/site/TextoSite';
import SiteLayout from '@/components/site/SiteLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNegocio, useDonasNegocios } from '@/hooks/useSite';
import { useProdutos, useAvaliacoes } from '@/hooks/useCatalogo';
import Estrelas from '@/components/negocio/Estrelas';
import { CatalogoPublico, AvaliacoesPublicas } from '@/components/negocio/CatalogoPublico';
import { stripHtml } from '@/lib/stripHtml';

const SITE = 'https://mulheresemconvergencia.com.br';

export default function NegocioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: negocio, isLoading } = useNegocio(slug);
  const { data: donas } = useDonasNegocios();
  const dona = negocio ? donas?.get(negocio.id) : undefined;
  const { data: produtos = [] } = useProdutos(negocio?.id);
  const { data: avs = [] } = useAvaliacoes(negocio?.id);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 space-y-4 max-w-3xl">
          <Skeleton className="h-52 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!negocio) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Negócio não encontrado</h1>
          <Button asChild variant="outline"><Link to="/diretorio">Voltar ao diretório</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const contatos = [
    negocio.telefone && { icone: Phone, texto: negocio.telefone, href: `tel:${negocio.telefone}` },
    negocio.whatsapp && { icone: Phone, texto: 'WhatsApp', href: `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}` },
    negocio.email && { icone: Mail, texto: negocio.email, href: `mailto:${negocio.email}` },
    negocio.site && { icone: Globe, texto: 'Site', href: negocio.site },
    negocio.instagram && { icone: Instagram, texto: '@' + negocio.instagram.replace('@', ''), href: `https://instagram.com/${negocio.instagram.replace('@', '')}` },
  ].filter(Boolean) as { icone: any; texto: string; href: string }[];

  const total = avs.length;
  const media = total ? avs.reduce((t, a) => t + a.nota, 0) / total : 0;
  const url = `${SITE}/diretorio/${negocio.slug}`;
  const desc = stripHtml(negocio.descricao, 155) || `${negocio.nome} — negócio da rede Mulheres em Convergência.`;
  const ld: any = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': url, name: negocio.nome, url, description: desc,
    image: [negocio.capa_url, negocio.logo_url].filter(Boolean),
    telephone: negocio.telefone || negocio.whatsapp || undefined,
    address: { '@type': 'PostalAddress', addressLocality: negocio.cidade || undefined, addressRegion: negocio.uf || undefined, addressCountry: 'BR' },
    ...(negocio.latitude != null && negocio.longitude != null ? { geo: { '@type': 'GeoCoordinates', latitude: negocio.latitude, longitude: negocio.longitude } } : {}),
    ...(total ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: media.toFixed(1), reviewCount: total, bestRating: 5 } } : {}),
    ...(produtos.length ? { hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Produtos e serviços', itemListElement: produtos.map((p) => ({
      '@type': 'Offer', url: p.link_compra || url, ...(p.valor_centavos != null ? { price: (p.valor_centavos / 100).toFixed(2), priceCurrency: 'BRL' } : {}),
      itemOffered: { '@type': 'Product', name: p.nome, description: p.descricao, image: p.fotos.length ? p.fotos : undefined } })) } } : {}),
  };
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Diretório', item: SITE + '/diretorio' },
    { '@type': 'ListItem', position: 3, name: negocio.nome, item: url }] };

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${negocio.nome}${negocio.categoria ? ` — ${negocio.categoria}` : ''} | Diretório Mulheres em Convergência`}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={negocio.nome} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={url} />
        {(negocio.capa_url || negocio.logo_url) && <meta property="og:image" content={negocio.capa_url || negocio.logo_url!} />}
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
        <script type="application/ld+json">{JSON.stringify(trilha)}</script>
      </Helmet>

      <div className="relative h-56 lg:h-80 overflow-hidden bg-grad-hero">
        {negocio.capa_url && <img src={negocio.capa_url} alt={`Capa de ${negocio.nome}`} className="h-full w-full object-cover" />}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      <article className="container mx-auto max-w-6xl space-y-8 px-4 pb-16">
        <header className="relative -mt-14 space-y-3 rounded-[var(--radius)] border border-border bg-card p-5 sm:p-7" style={{ boxShadow: 'var(--sombra-2)' }}>
          <div className="flex items-end justify-between gap-4">
            {negocio.logo_url ? (
              <img src={negocio.logo_url} alt={`Logo de ${negocio.nome}`} className="-mt-16 h-24 w-24 shrink-0 rounded-2xl border-4 border-card bg-card object-contain p-1 sm:-mt-20 sm:h-32 sm:w-32" style={{ boxShadow: 'var(--sombra-1)' }} />
            ) : <span />}
            {dona && (
              <div className="flex flex-row-reverse items-end gap-3 text-right">
                {dona.foto_url ? (
                  <img src={dona.foto_url} alt={dona.nome} className="-mt-16 h-24 w-24 shrink-0 rounded-full border-4 border-card object-cover sm:-mt-20 sm:h-32 sm:w-32" style={{ boxShadow: 'var(--sombra-1)' }} />
                ) : null}
                <div className="pb-2 min-w-0">
                  <p className="text-sm sm:text-base font-semibold leading-tight">{dona.nome}</p>
                  <TextoSite as="p" chave="negocio.rotulo_dona" className="text-xs text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          {negocio.categoria && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{negocio.categoria}</p>}
          <h1 className="text-3xl font-extrabold lg:text-4xl">{negocio.nome}</h1>
          {total > 0 && <a href="#avaliacoes"><Estrelas media={media} total={total} /></a>}
          {(negocio.cidade || negocio.uf) && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {[negocio.bairro, negocio.cidade, negocio.uf].filter(Boolean).join(', ')}
            </p>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-10">
        {negocio.descricao && <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(negocio.descricao) }} />}

        <CatalogoPublico negocioId={negocio.id} whatsapp={negocio.whatsapp} negocio={negocio.nome} />
        {negocio.midias?.length > 0 && (
          <section className="space-y-3">
            <TextoSite as="h2" chave="negocio.titulo_galeria" className="text-xl font-bold" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {negocio.midias
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((m) => (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.legenda ?? `Imagem de ${negocio.nome}`}
                    loading="lazy"
                    className="rounded-[var(--radius)] object-cover w-full h-32"
                  />
                ))}
            </div>
          </section>
        )}

            <AvaliacoesPublicas negocioId={negocio.id} donaPessoaId={(negocio as any).pessoa_id} />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">

        {contatos.length > 0 && (
          <section className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-5">
            <TextoSite as="h2" chave="negocio.titulo_contato" className="text-base font-bold" />
            <div className="flex flex-col gap-2">
              {contatos.map((c) => (
                <Button key={c.href} asChild variant="outline" size="sm" className="w-full justify-start overflow-hidden">
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    <c.icone className="w-4 h-4 mr-2 shrink-0" /><span className="truncate">{c.texto}</span>
                  </a>
                </Button>
              ))}
            </div>
          </section>
        )}

        {negocio.comodidades?.length > 0 && (
          <section className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-5">
            <TextoSite as="h2" chave="negocio.titulo_comodidades" className="text-base font-bold" />
            <div className="flex flex-wrap gap-2">
              {negocio.comodidades.map((c) => <Badge key={c.id} variant="secondary">{c.nome}</Badge>)}
            </div>
          </section>
        )}

        {negocio.areas?.length > 0 && (
          <section className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-5">
            <TextoSite as="h2" chave="negocio.titulo_areas" className="text-base font-bold" />
            <ul className="text-sm text-muted-foreground space-y-1">
              {negocio.areas.map((a) => (
                <li key={a.id}>{[a.bairro, a.cidade, a.uf].filter(Boolean).join(', ')}</li>
              ))}
            </ul>
          </section>
        )}

          </aside>
        </div>
      </article>
    </SiteLayout>
  );
}
