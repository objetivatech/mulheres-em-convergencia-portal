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
import { ContadorEvento, DestaqueEvento, OcupacaoEvento, useRelogioEvento } from '@/components/site/EventoConversao';
import ListaEsperaEvento from '@/components/site/ListaEsperaEvento';
import TextoSite from '@/components/site/TextoSite';

export default function EventoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: evento, isLoading, refetch } = useEvento(slug);
  const [abrirCobranca, setAbrirCobranca] = useState(false);
  const [abrirEspera, setAbrirEspera] = useState(false);
  const agora = useRelogioEvento();

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
  const encerrado = new Date(evento.inicio_em).getTime() <= agora;
  const reservadas = !esgotado && evento.livres_para_reserva === 0;
  const semLote = !evento.gratuito && !lote;

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

      <section className="relative overflow-hidden bg-grad-hero text-primary-foreground">
        <div className={`container mx-auto grid items-center gap-8 px-4 py-12 lg:py-16 ${evento.capa_url ? 'lg:grid-cols-[1.2fr_1fr]' : ''}`}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {evento.destaque && <DestaqueEvento />}
              {evento.gratuito && <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">Gratuito</Badge>}
              {evento.online && <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">Online</Badge>}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">{evento.titulo}</h1>
            {evento.resumo && <p className="text-lg text-primary-foreground/90">{evento.resumo}</p>}
          </div>
          {evento.capa_url && <img src={evento.capa_url} alt={evento.titulo} className="aspect-[16/10] w-full rounded-[var(--radius)] object-cover" style={{ boxShadow: 'var(--sombra-3)' }} />}
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <article className="space-y-6 min-w-0">
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
          <ContadorEvento inicio={evento.inicio_em} convite={!esgotado && !reservadas && !semLote} />
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-primary" /> {dataLonga(evento.inicio_em)}
          </p>
          <p className="flex items-center gap-2 text-sm">
            {evento.online ? <Video className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
            {evento.online
              ? 'Encontro online'
              : [evento.local_nome, evento.endereco, evento.cidade].filter(Boolean).join(' · ') || 'Local a confirmar'}
          </p>
          <OcupacaoEvento ocupadas={evento.ocupadas} vagas={evento.vagas} />

          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-2xl font-semibold">{semLote ? <TextoSite chave="eventos.sem_lote" /> : valor > 0 ? dinheiro(valor) : 'Gratuito'}</p>
            {lote && <p className="text-xs text-muted-foreground">{lote.nome}</p>}
            {lote?.fim_em && !encerrado && <ContadorEvento inicio={lote.fim_em} compacto lote convite={false} />}
          </div>

          <Button
            className="w-full"
            disabled={encerrado || (!esgotado && (reservadas || semLote))}
            onClick={() => esgotado ? setAbrirEspera(true) : setAbrirCobranca(true)}
          >
            <TextoSite chave={encerrado ? 'eventos.convite.encerrado' : esgotado ? 'eventos.espera.botao' : semLote ? 'eventos.sem_lote' : 'eventos.inscrever'} />
          </Button>
          {reservadas && <p className="text-xs text-muted-foreground"><TextoSite chave="eventos.reservadas" /></p>}
          {!esgotado && !encerrado && !semLote && <p className="text-xs text-muted-foreground">
            Sua vaga é confirmada assim que o pagamento é aprovado.
          </p>}
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
      {abrirEspera && <ListaEsperaEvento eventoId={evento.id} aberto aoFechar={() => setAbrirEspera(false)} />}
    </SiteLayout>
  );
}
