import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, Check, Copy, Link2, Globe, Heart, Instagram, Linkedin, MapPin, Megaphone, Sparkles, Users } from 'lucide-react';
import CabecalhoPagina from '@/components/site/CabecalhoPagina';
import SiteLayout from '@/components/site/SiteLayout';
import { stripHtml } from '@/lib/stripHtml';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicAmbassadors, type PublicAmbassador } from '@/hooks/usePublicAmbassadors';

const SITE = 'https://mulheresemconvergencia.com.br';

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function CardEmbaixadora({ e }: { e: PublicAmbassador }) {
  const local = [e.public_city, e.public_state].filter(Boolean).join(' / ');
  const redes = [
    e.public_instagram_url && { href: e.public_instagram_url, Icone: Instagram, rotulo: 'Instagram' },
    e.public_linkedin_url && { href: e.public_linkedin_url, Icone: Linkedin, rotulo: 'LinkedIn' },
    e.public_website_url && { href: e.public_website_url, Icone: Globe, rotulo: 'Site' },
  ].filter(Boolean) as { href: string; Icone: any; rotulo: string }[];
  const [copiado, setCopiado] = useState(false);
  const link = e.codigo ? `${SITE}/planos?indicacao=${encodeURIComponent(e.codigo)}` : null;
  const copiar = async () => { if (!link) return; await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-transform hover:-translate-y-1" style={{ boxShadow: 'var(--sombra-1)' }}>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {e.public_photo_url ? (
          <img src={e.public_photo_url} alt={e.public_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-secondary text-4xl font-semibold text-secondary-foreground">{iniciais(e.public_name)}</span>
        )}
        {e.nivel && <Badge className="absolute left-3 top-3">{e.nivel}</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold leading-snug">{e.public_name}</h3>
        {local && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{local}</p>}
        {e.indicacoes > 0 && (
          <p className="flex items-center gap-1 text-sm text-primary"><Heart className="h-4 w-4 fill-primary" />
            Já trouxe {e.indicacoes} {e.indicacoes === 1 ? 'nova associada' : 'novas associadas'}
          </p>
        )}
        {e.public_bio && <p className="line-clamp-4 text-sm text-muted-foreground">{stripHtml(e.public_bio, 300)}</p>}
        <div className="mt-auto space-y-3 pt-3">
          {link && (
            <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Use o meu link</p>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1"><a href={link}><Link2 className="mr-2 h-4 w-4" />Use o meu link</a></Button>
                <Button size="sm" variant="outline" onClick={copiar} aria-label="Copiar link">{copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">{link.replace(/^https?:\/\//, '')}</p>
            </div>
          )}
          {redes.length > 0 && (
            <div className="flex gap-2">
              {redes.map(({ href, Icone, rotulo }) => (
                <Button key={href} asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${rotulo} de ${e.public_name}`}><Icone className="h-4 w-4" /></a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Embaixadoras() {
  const { data: lista = [], isLoading, error } = usePublicAmbassadors();
  const totalIndicacoes = lista.reduce((t, e) => t + e.indicacoes, 0);
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Embaixadoras Mulheres em Convergência', url: `${SITE}/embaixadoras`,
    mainEntity: { '@type': 'ItemList', itemListElement: lista.map((e, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Person', name: e.public_name, image: e.public_photo_url || undefined } })) },
  };

  return (
    <SiteLayout>
      <Helmet>
        <title>Nossas Embaixadoras | Mulheres em Convergência</title>
        <meta name="description" content="Conheça as embaixadoras do Mulheres em Convergência: mulheres que espalham a rede e trazem novas empreendedoras para a comunidade." />
        <link rel="canonical" href={`${SITE}/embaixadoras`} />
        <meta property="og:title" content="Nossas Embaixadoras | Mulheres em Convergência" />
        <meta property="og:description" content="Mulheres que espalham a rede e trazem novas empreendedoras para a comunidade." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>

      <CabecalhoPagina prefixo="embaixadoras">
        {lista.length > 0 && (
          <div className="flex flex-wrap gap-8 text-primary-foreground">
            <div><p className="text-3xl font-extrabold">{lista.length}</p><p className="text-xs opacity-80">embaixadoras</p></div>
            {totalIndicacoes > 0 && <div><p className="text-3xl font-extrabold">{totalIndicacoes}</p><p className="text-xs opacity-80">novas associadas trazidas</p></div>}
          </div>
        )}
      </CabecalhoPagina>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-[var(--radius)]" />)}</div>
        ) : error ? (
          <p className="py-12 text-center text-muted-foreground">Não foi possível carregar as embaixadoras agora. Tente de novo em instantes.</p>
        ) : lista.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Em breve você vai conhecer nossas embaixadoras!</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 [&>*]:w-full sm:[&>*]:w-[calc(50%-12px)] lg:[&>*]:w-[calc(33.333%-16px)]">{lista.map((e) => <CardEmbaixadora key={e.id} e={e} />)}</div>
        )}
      </section>

      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-10">
          <h2 className="text-center text-2xl md:text-3xl font-bold">Como funciona o programa</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icone: Users, t: 'Ela é convidada', d: 'A equipe convida associadas que vivem a rede e querem levá-la mais longe.' },
              { Icone: Megaphone, t: 'Ela compartilha', d: 'Recebe campanhas prontas e um link próprio para indicar novas empreendedoras.' },
              { Icone: Heart, t: 'A rede cresce', d: 'Cada indicação que vira associada é reconhecida e valorizada pela comunidade.' },
            ].map(({ Icone, t, d }) => (
              <div key={t} className="rounded-[var(--radius)] border border-border bg-card p-6 space-y-2">
                <Icone className="h-7 w-7 text-primary" />
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Quer fazer parte dessa rede de mulheres que fazem acontecer?</p>
            <Button asChild size="lg"><Link to="/planos">Conheça os planos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
