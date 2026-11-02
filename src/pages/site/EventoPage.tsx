import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Video, Users } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import CobrancaDialog from '@/components/site/CobrancaDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvento, loteVigente, tiposVigentes, dinheiro, dataLonga } from '@/hooks/usePlanosEventos';
import { ContadorEvento, DestaqueEvento, OcupacaoEvento, useRelogioEvento } from '@/components/site/EventoConversao';
import ListaEsperaEvento from '@/components/site/ListaEsperaEvento';
import TextoSite from '@/components/site/TextoSite';

export default function EventoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: evento, isLoading, refetch } = useEvento(slug);
  const [abrirCobranca, setAbrirCobranca] = useState(false);
  const [abrirEspera, setAbrirEspera] = useState(false);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const agora = useRelogioEvento();
  const { data: usoTipos, refetch: refetchUso } = useQuery({
    queryKey: ['ocupacao-tipos', evento?.id],
    enabled: !!evento?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('ocupacao_tipos_evento', { _evento_id: evento!.id });
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as { tipo_id: string; usadas: number }[]).map((r) => [r.tipo_id, Number(r.usadas)]));
    },
  });

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
  const tipos = evento.gratuito ? [] : tiposVigentes(evento.tipos_ingresso);
  const tipoEsgotado = (t: { id: string; vagas: number | null }) => t.vagas !== null && (usoTipos?.[t.id] ?? 0) >= t.vagas;
  const tipoEscolhido = tipos.find((t) => t.id === tipoId) ?? null;
  const tipo = (tipoEscolhido && !tipoEsgotado(tipoEscolhido) ? tipoEscolhido : null) ?? tipos.find((t) => !tipoEsgotado(t)) ?? null;
  const todosTiposEsgotados = tipos.length > 0 && tipos.every(tipoEsgotado);
  const valor = evento.gratuito ? 0 : tipo ? tipo.valor_centavos : lote?.valor_centavos ?? 0;
  const esgotado = (evento.disponiveis !== null && evento.disponiveis <= 0) || todosTiposEsgotados;
  const encerrado = new Date(evento.inicio_em).getTime() <= agora;
  const reservadas = !esgotado && evento.livres_para_reserva === 0;
  const semLote = !evento.gratuito && !lote && !tipo && !todosTiposEsgotados;

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
            {(tipos.length > 1 || todosTiposEsgotados) && (
              <div className="space-y-2" role="radiogroup" aria-label="Tipo de ingresso">
                <p className="text-sm font-medium">Escolha seu ingresso</p>
                {tipos.map((t) => {
                  const fora = tipoEsgotado(t);
                  return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={tipo?.id === t.id}
                    aria-disabled={fora}
                    disabled={fora}
                    onClick={() => setTipoId(t.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${fora ? 'cursor-not-allowed border-border opacity-60' : tipo?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-medium">
                      <span className={fora ? 'line-through' : ''}>{t.nome}</span>
                      {fora ? <Badge variant="secondary">Esgotado</Badge> : <span>{t.valor_centavos > 0 ? dinheiro(t.valor_centavos) : 'Gratuito'}</span>}
                    </span>
                    {t.descricao && <span className="mt-1 block text-xs text-muted-foreground">{t.descricao}</span>}
                  </button>
                  );
                })}
              </div>
            )}
            <p className="text-2xl font-semibold">{todosTiposEsgotados ? 'Esgotado' : semLote ? <TextoSite chave="eventos.sem_lote" /> : valor > 0 ? dinheiro(valor) : 'Gratuito'}</p>
            {tipo ? <p className="text-xs text-muted-foreground">{tipo.nome}{tipos.length === 1 && tipo.descricao ? ` — ${tipo.descricao}` : ''}</p> : lote && <p className="text-xs text-muted-foreground">{lote.nome}</p>}
            {!tipo && lote?.fim_em && !encerrado && <ContadorEvento inicio={lote.fim_em} compacto lote convite={false} />}
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
          titulo={tipo ? `${evento.titulo} — ${tipo.nome}` : evento.titulo}
          tipoIngressoId={tipo?.id ?? null}
          valorTexto={valor > 0 ? dinheiro(valor) : 'Gratuito'}
          permiteCupom={valor > 0}
          aoConcluir={() => { refetch(); refetchUso(); }}
        />
      )}
      {abrirEspera && <ListaEsperaEvento eventoId={evento.id} aberto aoFechar={() => setAbrirEspera(false)} />}
    </SiteLayout>
  );
}
