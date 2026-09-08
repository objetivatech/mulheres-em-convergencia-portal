import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Video, Users } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import CobrancaDialog from '@/components/site/CobrancaDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvento, loteVigente, dinheiro, dataLonga } from '@/hooks/usePlanosEventos';

export default function EventoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: evento, isLoading, refetch } = useEvento(slug);
  const [abrirCobranca, setAbrirCobranca] = useState(false);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-14 space-y-4 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!evento) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-20 text-center space-y-3">
          <h1 className="text-2xl font-semibold">Encontro não encontrado</h1>
          <Link to="/eventos" className="text-primary underline underline-offset-4">Ver todos os encontros</Link>
        </div>
      </SiteLayout>
    );
  }

  const lote = loteVigente(evento.lotes);
  const valor = evento.gratuito ? 0 : lote?.valor_centavos ?? 0;
  const esgotado = evento.disponiveis !== null && evento.disponiveis <= 0;
  const encerrado = new Date(evento.inicio_em).getTime() < Date.now();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: evento.titulo,
    startDate: evento.inicio_em,
    endDate: evento.fim_em ?? undefined,
    eventAttendanceMode: evento.online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: evento.online
      ? { '@type': 'VirtualLocation', url: evento.link_online ?? undefined }
      : {
          '@type': 'Place',
          name: evento.local_nome ?? 'A confirmar',
          address: [evento.endereco, evento.cidade, evento.uf].filter(Boolean).join(', '),
        },
    description: evento.resumo ?? undefined,
    image: evento.capa_url ?? undefined,
  };

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${evento.titulo} | Mulheres em Convergência`}</title>
        <meta name="description" content={evento.resumo ?? `Participe do encontro ${evento.titulo}.`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {evento.capa_url && (
        <img src={evento.capa_url} alt={evento.titulo} className="w-full max-h-[380px] object-cover" />
      )}

      <div className="container mx-auto px-4 py-12 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <article className="space-y-6 min-w-0">
          <div className="flex flex-wrap gap-2">
            {evento.gratuito && <Badge variant="secondary">Gratuito</Badge>}
            {evento.online && <Badge variant="outline">Online</Badge>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{evento.titulo}</h1>
          {evento.resumo && <p className="text-lg text-muted-foreground">{evento.resumo}</p>}
          {evento.descricao && (
            <div
              className="prose prose-neutral max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: evento.descricao }}
            />
          )}

          {evento.palestrantes.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Quem estará com a gente</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {evento.palestrantes.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-lg border border-border p-4">
                    {p.foto_url && <img src={p.foto_url} alt={p.nome} className="w-14 h-14 rounded-full object-cover" />}
                    <div>
                      <p className="font-medium">{p.nome}</p>
                      {p.minibio && <p className="text-sm text-muted-foreground">{p.minibio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="rounded-xl border border-border bg-card p-6 space-y-4 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-primary" /> {dataLonga(evento.inicio_em)}
          </p>
          <p className="flex items-center gap-2 text-sm">
            {evento.online ? <Video className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
            {evento.online
              ? 'Encontro online'
              : [evento.local_nome, evento.endereco, evento.cidade].filter(Boolean).join(' · ') || 'Local a confirmar'}
          </p>
          {evento.vagas !== null && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" /> {evento.ocupadas} inscritas de {evento.vagas} vagas
            </p>
          )}

          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-2xl font-semibold">{valor > 0 ? dinheiro(valor) : 'Gratuito'}</p>
            {lote && <p className="text-xs text-muted-foreground">{lote.nome}</p>}
          </div>

          <Button
            className="w-full"
            disabled={esgotado || encerrado}
            onClick={() => setAbrirCobranca(true)}
          >
            {encerrado ? 'Encontro encerrado' : esgotado ? 'Vagas esgotadas' : 'Garantir minha vaga'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Sua vaga é confirmada assim que o pagamento é aprovado.
          </p>
        </aside>
      </div>

      {abrirCobranca && (
        <CobrancaDialog
          aberto
          aoFechar={() => setAbrirCobranca(false)}
          tipo="evento"
          slug={evento.slug}
          titulo={evento.titulo}
          valorTexto={valor > 0 ? dinheiro(valor) : 'Gratuito'}
          permiteCupom={valor > 0}
          aoConcluir={() => refetch()}
        />
      )}
    </SiteLayout>
  );
}
