import { useMemo, useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinanceiro } from '@/hooks/useAdminNovo';
import { dinheiro } from '@/hooks/usePlanosEventos';

const hoje = new Date();
const inicioPadrao = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString().slice(0, 10);
const fimPadrao = hoje.toISOString().slice(0, 10);

const dataBr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export default function PainelFinanceiro() {
  const [desde, setDesde] = useState(inicioPadrao);
  const [ate, setAte] = useState(fimPadrao);
  const { data, isLoading } = useFinanceiro(desde, ate);

  const totais = useMemo(() => {
    const pagos = (data?.pagamentos ?? []).filter((p) => p.situacao === 'confirmado');
    const pendentes = (data?.pagamentos ?? []).filter((p) => p.situacao === 'pendente');
    return {
      recebido: pagos.reduce((s, p) => s + (p.valor_centavos ?? 0), 0),
      aReceber: pendentes.reduce((s, p) => s + (p.valor_centavos ?? 0), 0),
      quantidade: pagos.length,
      pendentes: pendentes.length,
    };
  }, [data]);

  const baixar = () => {
    const linhas = [
      ['Data', 'Pessoa', 'Descrição', 'Valor', 'Situação'].join(';'),
      ...(data?.pagamentos ?? []).map((p) =>
        [dataBr(p.criado_em), p.pessoa?.nome ?? '', (p.descricao ?? '').replace(/;/g, ','), (p.valor_centavos / 100).toFixed(2), p.situacao].join(';')
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([linhas], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${desde}-a-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PainelLayout
      titulo="Financeiro"
      descricao="O que entrou, o que está aguardando e a receita mês a mês."
      acoes={<Button variant="outline" size="sm" onClick={baixar}>Baixar planilha</Button>}
    >
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="space-y-1.5">
          <Label htmlFor="desde">De</Label>
          <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="text-2xl font-semibold">{dinheiro(totais.recebido)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">A receber</p>
              <p className="text-2xl font-semibold">{dinheiro(totais.aReceber)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Pagamentos confirmados</p>
              <p className="text-2xl font-semibold">{totais.quantidade}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Aguardando</p>
              <p className="text-2xl font-semibold">{totais.pendentes}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Receita por mês</h2>
            {!data?.mensal.length ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.mensal.map((m: any) => (
                  <li key={m.mes} className="py-2 flex items-center justify-between">
                    <span>{new Date(m.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground">{m.pagamentos} pagamentos</span>
                      <strong>{dinheiro(Number(m.recebido_centavos ?? 0))}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Pagamentos no período</h2>
            {!data?.pagamentos.length ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento no período.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.pagamentos.slice(0, 200).map((p) => (
                  <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.pessoa?.nome ?? 'Sem identificação'}</p>
                      <p className="text-xs text-muted-foreground">{p.descricao ?? 'Cobrança'} · {dataBr(p.criado_em)}</p>
                    </div>
                    <span className="flex items-center gap-3">
                      {dinheiro(p.valor_centavos)}
                      <Badge variant={p.situacao === 'confirmado' ? 'secondary' : 'outline'}>{p.situacao}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PainelLayout>
  );
}
