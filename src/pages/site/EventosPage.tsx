import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Video, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
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

function SliderDestaques({ eventos }: { eventos: EventoLista[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000, stopOnInteraction: true })]);
  if (!eventos.length) return null;
  return (
    <section className="container mx-auto px-4 pt-10">
      <div className="relative overflow-hidden rounded-[var(--radius)]" ref={ref}>
        <div className="flex">
          {eventos.map((e) => (
            <Link key={e.id} to={`/eventos/${e.slug}`} className="relative min-w-0 flex-[0_0_100%] aspect-[16/9] md:aspect-[21/9] bg-muted">
              {e.capa_url && <img src={e.capa_url} alt={e.titulo} className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-10 max-w-3xl space-y-3 text-background">
                <p className="text-xs uppercase tracking-wider opacity-90">Próximos encontros</p>
                <h2 className="text-2xl md:text-4xl font-semibold leading-tight">{e.titulo}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {dataLonga(e.inicio_em)}</span>
                  <Modalidade e={e} />
                  <Preco e={e} />
                </div>
                <span className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
                  <Ticket className="w-4 h-4" /> Quero me inscrever
                </span>
              </div>
            </Link>
          ))}
        </div>
        {eventos.length > 1 && (
          <>
            <button aria-label="Anterior" onClick={() => api?.scrollPrev()} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronLeft className="w-5 h-5" /></button>
            <button aria-label="Próximo" onClick={() => api?.scrollNext()} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronRight className="w-5 h-5" /></button>
          </>
        )}
      </div>
    </section>
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

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 max-w-2xl space-y-4">
          <TextoSite as="h1" chave="eventos.titulo" padrao="Encontros e eventos" className="text-3xl lg:text-4xl font-semibold tracking-tight" />
          <TextoSite as="p" chave="eventos.subtitulo" padrao="Rodas de negócio, formações e celebrações da nossa rede." className="text-muted-foreground" />
        </div>
      </section>

      {!!proximos?.length && <SliderDestaques eventos={proximos.slice(0, 3)} />}

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
