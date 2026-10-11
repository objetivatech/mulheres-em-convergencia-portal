import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Video, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import CabecalhoPagina from '@/components/site/CabecalhoPagina';
import { SliderEventos } from '@/components/site/SliderHero';
import SiteLayout from '@/components/site/SiteLayout';
import TextoSite from '@/components/site/TextoSite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventos, dataLonga, dinheiro, menorValorEvento } from '@/hooks/usePlanosEventos';

type EventoLista = NonNullable<ReturnType<typeof useEventos>['data']>[number];

function Preco({ e }: { e: EventoLista }) {
  if (e.gratuito) return <Badge variant="secondary">Gratuito</Badge>;
  const v = menorValorEvento(e.lotes);
  return v ? <Badge>{dinheiro(v)}</Badge> : <Badge variant="outline">Pago</Badge>;
}

function Modalidade({ e }: { e: EventoLista }) {
  return (
    <Badge variant="outline" className="gap-1">
      {e.online ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
      {e.online ? 'Online' : 'Presencial'}
    </Badge>
  );
}

export default function EventosPage() {
  const { data: proximos, isLoading } = useEventos({ futuros: true });
  const { data: passados } = useEventos({ futuros: false });

  return (
    <SiteLayout>
      <Helmet>
        <title>Encontros e eventos | Mulheres em Convergência</title>
        <meta name="description" content="Participe dos encontros, rodas de negócio e formações da rede Mulheres em Convergência." />
      </Helmet>

      <CabecalhoPagina prefixo="eventos" lateral={<SliderEventos />} />

      <section className="container mx-auto px-4 py-12 space-y-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-[var(--radius)]" />)}
          </div>
        ) : !proximos?.length ? (
          <p className="text-muted-foreground">Nenhum encontro marcado agora. Em breve teremos novidades.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((e) => (
              <article key={e.id} className="flex flex-col rounded-[var(--radius)] border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--sombra-1)' }}>
                <Link to={`/eventos/${e.slug}`} className="block aspect-[16/9] bg-muted">
                  {e.capa_url && <img src={e.capa_url} alt={e.titulo} loading="lazy" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col p-5 gap-3">
                  <div className="flex flex-wrap gap-2"><Modalidade e={e} /><Preco e={e} /></div>
                  <h2 className="text-lg font-semibold leading-snug">
                    <Link to={`/eventos/${e.slug}`} className="hover:text-primary">{e.titulo}</Link>
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> {dataLonga(e.inicio_em)}
                  </p>
                  <Button asChild className="mt-auto w-full">
                    <Link to={`/eventos/${e.slug}`}><Ticket className="w-4 h-4 mr-2" /> Ver e me inscrever</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!!passados?.length && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Já aconteceram</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {passados.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link to={`/eventos/${e.slug}`} className="text-sm hover:text-primary">
                    {e.titulo} — {dataLonga(e.inicio_em)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
