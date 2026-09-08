import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhaEmbaixadora } from '@/hooks/useMinhaArea';
import { dinheiro } from '@/hooks/usePlanosEventos';
import { useToast } from '@/hooks/use-toast';

const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function MinhaEmbaixadora() {
  const { data: painel, isLoading } = useMinhaEmbaixadora();
  const { toast } = useToast();

  const link = painel?.ficha?.codigo
    ? `${window.location.origin}/planos?indicacao=${painel.ficha.codigo}`
    : '';

  return (
    <AreaLayout titulo="Embaixadoras" descricao="Suas indicações, comissões e materiais.">
      <Helmet>
        <title>Embaixadoras | Minha área</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !painel ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Você ainda não faz parte do programa de embaixadoras. Fale com a equipe para participar.
          </p>
          <Button asChild size="sm" variant="outline"><Link to="/contato">Falar com a equipe</Link></Button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Seu link de indicação</p>
                <p className="text-sm text-muted-foreground break-all">{link}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast({ title: 'Link copiado', description: 'Agora é só compartilhar.' });
                }}
              >
                Copiar link
              </Button>
            </div>
            {painel.ficha?.nivel?.nome && (
              <Badge variant="secondary">
                Nível {painel.ficha.nivel.nome} · {painel.ficha.nivel.comissao_percentual}% de comissão
              </Badge>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Indicações</p>
              <p className="text-2xl font-semibold">{painel.resumo?.indicacoes ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Pagas</p>
              <p className="text-2xl font-semibold">{painel.resumo?.indicacoes_pagas ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Comissão acumulada</p>
              <p className="text-2xl font-semibold">{dinheiro(Number(painel.resumo?.comissao_centavos ?? 0))}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Minhas indicações</h2>
            {!painel.indicacoes.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma indicação registrada ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {painel.indicacoes.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{i.nome || i.email || 'Indicação'}</p>
                      <p className="text-xs text-muted-foreground">{data(i.criado_em)}</p>
                    </div>
                    <Badge variant={i.pagamento?.situacao === 'confirmado' ? 'secondary' : 'outline'}>
                      {i.pagamento?.situacao === 'confirmado' ? 'Pagou' : 'Aguardando'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Repasses</h2>
            {!painel.repasses.length ? (
              <p className="text-sm text-muted-foreground">Nenhum repasse lançado.</p>
            ) : (
              <ul className="divide-y divide-border">
                {painel.repasses.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <p className="text-sm">{data(r.competencia)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{dinheiro(r.valor_centavos)}</span>
                      <Badge variant={r.situacao === 'pago' ? 'secondary' : 'outline'}>{r.situacao}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {painel.materiais.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">Materiais para divulgar</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {painel.materiais.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{m.titulo}</p>
                    {m.descricao && <p className="text-xs text-muted-foreground mb-2">{m.descricao}</p>}
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-4">
                      Baixar
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AreaLayout>
  );
}
