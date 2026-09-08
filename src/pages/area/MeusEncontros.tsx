import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasInscricoesArea } from '@/hooks/useMinhaArea';
import { dinheiro, dataLonga } from '@/hooks/usePlanosEventos';

export default function MeusEncontros() {
  const { data: inscricoes, isLoading } = useMinhasInscricoesArea();

  const futuros = (inscricoes ?? []).filter(
    (i) => i.evento?.inicio_em && new Date(i.evento.inicio_em).getTime() > Date.now()
  );
  const passados = (inscricoes ?? []).filter((i) => !futuros.includes(i));

  const cartao = (i: any) => (
    <li key={i.id} className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{i.evento?.titulo}</p>
          <p className="text-sm text-muted-foreground">
            {i.evento?.inicio_em ? dataLonga(i.evento.inicio_em) : '—'}
          </p>
          <p className="text-sm text-muted-foreground">
            {i.evento?.online ? 'Encontro on-line' : [i.evento?.local_nome, i.evento?.cidade].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Badge variant={i.situacao === 'confirmada' ? 'secondary' : 'outline'}>
          {i.situacao === 'confirmada' ? 'Confirmada' : i.situacao === 'cancelada' ? 'Cancelada' : 'Pagamento pendente'}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {i.valor_centavos > 0 ? dinheiro(i.valor_centavos) : 'Gratuito'}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {i.evento?.slug && (
          <Button asChild size="sm" variant="outline">
            <Link to={`/eventos/${i.evento.slug}`}>Ver encontro</Link>
          </Button>
        )}
        {i.situacao === 'confirmada' && i.evento?.online && i.evento?.link_online && (
          <Button asChild size="sm">
            <a href={i.evento.link_online} target="_blank" rel="noopener noreferrer">Entrar na sala</a>
          </Button>
        )}
        {i.situacao === 'confirmada' && (
          <Button asChild size="sm" variant="ghost">
            <Link to={`/minha-area/encontros/${i.id}`}>Meu ingresso</Link>
          </Button>
        )}
      </div>
    </li>
  );

  return (
    <AreaLayout titulo="Meus encontros" descricao="Inscrições confirmadas e histórico.">
      <Helmet>
        <title>Meus encontros | Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !inscricoes?.length ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Você ainda não se inscreveu em nenhum encontro.</p>
          <Button asChild size="sm"><Link to="/eventos">Ver próximos encontros</Link></Button>
        </div>
      ) : (
        <div className="space-y-8">
          {futuros.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3">Próximos</h2>
              <ul className="space-y-3">{futuros.map(cartao)}</ul>
            </section>
          )}
          {passados.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3">Já aconteceram</h2>
              <ul className="space-y-3 opacity-80">{passados.map(cartao)}</ul>
            </section>
          )}
        </div>
      )}
    </AreaLayout>
  );
}
