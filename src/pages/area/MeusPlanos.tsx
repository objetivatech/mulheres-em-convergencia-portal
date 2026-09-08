import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeusAcessos, useMeusPagamentos } from '@/hooks/useMinhaArea';
import { dinheiro } from '@/hooks/usePlanosEventos';

const ROTULO: Record<string, string> = {
  diretorio: 'Diretório',
  conecta: 'Conecta+',
  academy: 'Academy',
  evento: 'Encontros',
  area_embaixadora: 'Embaixadoras',
};

const SITUACAO: Record<string, { texto: string; variante: 'secondary' | 'outline' | 'destructive' }> = {
  confirmado: { texto: 'Pago', variante: 'secondary' },
  pendente: { texto: 'Aguardando pagamento', variante: 'outline' },
  estornado: { texto: 'Estornado', variante: 'destructive' },
  cancelado: { texto: 'Cancelado', variante: 'destructive' },
};

const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const linkCobranca = (p: any) =>
  p?.dados_brutos?.invoiceUrl || p?.dados_brutos?.payment?.invoiceUrl || p?.dados_brutos?.bankSlipUrl || null;

export default function MeusPlanos() {
  const { data: acessos, isLoading } = useMeusAcessos();
  const { data: pagamentos } = useMeusPagamentos();

  return (
    <AreaLayout titulo="Meus planos" descricao="Acessos vigentes e histórico de pagamentos.">
      <Helmet>
        <title>Meus planos | Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Acessos</h2>
            {!acessos?.length ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Você ainda não tem acesso ativo.</p>
                <Button asChild size="sm"><Link to="/planos">Escolher um plano</Link></Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {acessos.map((a) => {
                  const vigente = !a.fim_em || new Date(a.fim_em).getTime() > Date.now();
                  return (
                    <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{ROTULO[a.tipo] ?? a.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {data(a.inicio_em)} · {a.fim_em ? `até ${data(a.fim_em)}` : 'sem prazo'}
                          {a.origem === 'cortesia' ? ' · cortesia' : ''}
                        </p>
                      </div>
                      <Badge variant={vigente ? 'secondary' : 'outline'}>{vigente ? 'Ativo' : 'Encerrado'}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Pagamentos</h2>
            {!pagamentos?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pagamentos.map((p) => {
                  const s = SITUACAO[p.situacao] ?? { texto: p.situacao, variante: 'outline' as const };
                  const url = linkCobranca(p);
                  return (
                    <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{p.descricao || 'Cobrança'}</p>
                        <p className="text-xs text-muted-foreground">
                          {dinheiro(p.valor_centavos)} ·{' '}
                          {p.confirmado_em ? `pago em ${data(p.confirmado_em)}` : `vence em ${data(p.vencimento_em)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.variante}>{s.texto}</Badge>
                        {p.situacao === 'pendente' && url && (
                          <Button asChild size="sm" variant="outline">
                            <a href={url} target="_blank" rel="noopener noreferrer">Pagar</a>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </AreaLayout>
  );
}
