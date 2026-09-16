import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import CobrancaDialog from '@/components/site/CobrancaDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanoPorCodigo, dinheiro } from '@/hooks/usePlanosEventos';

const PERIODO: Record<string, string> = { mensal: '/mês', anual: '/ano', unico: '' };

export default function PlanoOfertaPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data, isLoading } = usePlanoPorCodigo(codigo);
  const [abrir, setAbrir] = useState(false);

  const plano = data?.plano ?? null;

  return (
    <SiteLayout>
      <Helmet>
        <title>{plano ? `${plano.nome} | Mulheres em Convergência` : 'Oferta | Mulheres em Convergência'}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-xl">
        {isLoading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : !plano ? (
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold">Oferta indisponível</h1>
            <p className="text-muted-foreground">
              {data?.motivo === 'vencida'
                ? 'O prazo desta oferta terminou. Fale com a equipe para receber um novo convite.'
                : 'Não encontramos esta oferta. Confira o link recebido.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-primary bg-card p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium">Convite especial</p>
              <h1 className="text-2xl font-semibold">{plano.nome}</h1>
              {plano.descricao && (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: plano.descricao }}
                />
              )}
            </div>

            <p className="text-3xl font-semibold">
              {dinheiro(plano.valor_centavos)}
              <span className="text-base font-normal text-muted-foreground">
                {PERIODO[plano.periodicidade] ?? ''}
              </span>
            </p>

            {plano.beneficios?.length > 0 && (
              <ul className="space-y-2 text-sm">
                {plano.beneficios.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button className="w-full" onClick={() => setAbrir(true)}>Quero este plano</Button>
          </div>
        )}
      </section>

      {plano && abrir && (
        <CobrancaDialog
          aberto
          aoFechar={() => setAbrir(false)}
          tipo="plano"
          slug={plano.slug}
          codigo={codigo}
          titulo={`Plano ${plano.nome}`}
          valorTexto={dinheiro(plano.valor_centavos)}
        />
      )}
    </SiteLayout>
  );
}
