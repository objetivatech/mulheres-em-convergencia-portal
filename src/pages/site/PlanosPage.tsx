import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import CobrancaDialog from '@/components/site/CobrancaDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanos, dinheiro, type Plano } from '@/hooks/usePlanosEventos';

const PERIODO: Record<string, string> = { mensal: '/mês', anual: '/ano', unico: '' };

export default function PlanosPage() {
  const { data: planos, isLoading } = usePlanos();
  const [escolhido, setEscolhido] = useState<Plano | null>(null);

  return (
    <SiteLayout>
      <Helmet>
        <title>Planos de assinatura | Mulheres em Convergência</title>
        <meta
          name="description"
          content="Escolha o plano que dá visibilidade ao seu negócio no diretório e acesso à comunidade Mulheres em Convergência."
        />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 max-w-2xl space-y-4 text-center">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Planos</h1>
          <p className="text-muted-foreground">
            Faça parte da rede: seu negócio no diretório, presença nos encontros e acesso à comunidade.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : !planos?.length ? (
          <p className="text-center text-muted-foreground">Os planos estão sendo atualizados. Volte em breve.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-start">
            {planos.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-xl border bg-card p-6 flex flex-col gap-5 ${
                  p.destaque ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {p.destaque && (
                  <Badge className="absolute -top-3 left-6">Mais escolhido</Badge>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{p.nome}</h2>
                  {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
                </div>
                <p className="text-3xl font-semibold">
                  {dinheiro(p.valor_centavos)}
                  <span className="text-base font-normal text-muted-foreground">{PERIODO[p.periodicidade] ?? ''}</span>
                </p>
                {p.beneficios.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {p.beneficios.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button className="mt-auto" onClick={() => setEscolhido(p)}>
                  Quero este plano
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {escolhido && (
        <CobrancaDialog
          aberto
          aoFechar={() => setEscolhido(null)}
          tipo="plano"
          slug={escolhido.slug}
          titulo={`Plano ${escolhido.nome}`}
          valorTexto={dinheiro(escolhido.valor_centavos)}
        />
      )}
    </SiteLayout>
  );
}
