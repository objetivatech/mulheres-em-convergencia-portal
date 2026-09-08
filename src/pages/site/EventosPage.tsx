import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Video } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventos, dataLonga } from '@/hooks/usePlanosEventos';

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
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Encontros e eventos</h1>
          <p className="text-muted-foreground">Rodas de negócio, formações e celebrações da nossa rede.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-10">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : !proximos?.length ? (
          <p className="text-muted-foreground">Nenhum encontro marcado agora. Em breve teremos novidades.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {proximos.map((e) => (
              <Link
                key={e.id}
                to={`/eventos/${e.slug}`}
                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                {e.capa_url && (
                  <img src={e.capa_url} alt={e.titulo} loading="lazy" className="h-40 w-full object-cover" />
                )}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    {e.gratuito && <Badge variant="secondary">Gratuito</Badge>}
                    {e.online && <Badge variant="outline">Online</Badge>}
                  </div>
                  <h2 className="font-semibold leading-snug">{e.titulo}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> {dataLonga(e.inicio_em)}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    {e.online ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {e.online ? 'Encontro online' : [e.local_nome, e.cidade].filter(Boolean).join(' · ') || 'Local a confirmar'}
                  </p>
                </div>
              </Link>
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
