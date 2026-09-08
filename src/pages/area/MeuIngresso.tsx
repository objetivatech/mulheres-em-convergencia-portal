import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { QRCodeSVG } from 'qrcode.react';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasInscricoesArea } from '@/hooks/useMinhaArea';
import { dataLonga } from '@/hooks/usePlanosEventos';

export default function MeuIngresso() {
  const { id } = useParams();
  const { data: inscricoes, isLoading } = useMinhasInscricoesArea();
  const inscricao = (inscricoes ?? []).find((i) => i.id === id);

  return (
    <AreaLayout titulo="Meu ingresso" descricao="Apresente este código na entrada do encontro.">
      <Helmet>
        <title>Meu ingresso | Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !inscricao ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Não encontramos essa inscrição.</p>
          <Button asChild size="sm" variant="outline"><Link to="/minha-area/encontros">Voltar</Link></Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 max-w-md space-y-4 text-center">
          <div>
            <p className="font-semibold text-lg">{inscricao.evento?.titulo}</p>
            <p className="text-sm text-muted-foreground">
              {inscricao.evento?.inicio_em ? dataLonga(inscricao.evento.inicio_em) : ''}
            </p>
          </div>
          <div className="flex justify-center bg-white p-4 rounded-lg">
            <QRCodeSVG value={inscricao.id} size={200} />
          </div>
          <p className="text-xs text-muted-foreground break-all">Código: {inscricao.id}</p>
          <Button asChild variant="outline" size="sm"><Link to="/minha-area/encontros">Voltar</Link></Button>
        </div>
      )}
    </AreaLayout>
  );
}
