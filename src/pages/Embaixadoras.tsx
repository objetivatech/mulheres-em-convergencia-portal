import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Heart, Instagram, Linkedin, MapPin, Megaphone, Sparkles, Users } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
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
        {e.public_bio && <p className="line-clamp-4 text-sm text-muted-foreground">{e.public_bio}</p>}
        {redes.length > 0 && (
          <div className="mt-auto flex gap-2 pt-2">
            {redes.map(({ href, Icone, rotulo }) => (
              <Button key={href} asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${rotulo} de ${e.public_name}`}><Icone className="h-4 w-4" /></a>
              </Button>
            ))}
          </div>
        )}
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

      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: 'var(--gradiente-mec, linear-gradient(135deg, hsl(var(--primary) / .12), hsl(var(--accent) / .25)))' }}>
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-1.5 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />Quem faz a rede crescer</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Nossas Embaixadoras</h1>
          <p className="text-lg text-muted-foreground">
            Cada nova associada que chega à rede tem por trás uma mulher que acreditou e compartilhou. Elas abrem portas,
            fazem pontes e espalham o Mulheres em Convergência por todo o Brasil.
          </p>
          {lista.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 pt-2">
              <div><p className="text-3xl font-bold text-primary">{lista.length}</p><p className="text-xs text-muted-foreground">embaixadoras</p></div>
              {totalIndicacoes > 0 && <div><p className="text-3xl font-bold text-primary">{totalIndicacoes}</p><p className="text-xs text-muted-foreground">novas associadas trazidas</p></div>}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-[var(--radius)]" />)}</div>
        ) : error ? (
          <p className="py-12 text-center text-muted-foreground">Não foi possível carregar as embaixadoras agora. Tente de novo em instantes.</p>
        ) : lista.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Em breve você vai conhecer nossas embaixadoras!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{lista.map((e) => <CardEmbaixadora key={e.id} e={e} />)}</div>
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
