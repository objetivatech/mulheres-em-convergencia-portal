/**
 * Painel da equipe — Acessos e planos.
 * Mostra, em uma tabela só, o que cada plano libera e por quanto tempo,
 * e permite mudar isso sem mexer em código.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AREAS, PAPEIS, usePlanosAcessos, useResumoAcessos, useSalvarPlanoAcesso, type PlanoAcesso,
} from '@/hooks/useAcessosPlanos';

const dinheiro = (c: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((c ?? 0) / 100);

export default function PainelAcessos() {
  const { data: planos, isLoading } = usePlanosAcessos();
  const { data: resumo } = useResumoAcessos();
  const salvar = useSalvarPlanoAcesso();
  const { toast } = useToast();
  const [rascunho, setRascunho] = useState<Record<string, PlanoAcesso>>({});

  useEffect(() => {
    if (planos) setRascunho(Object.fromEntries(planos.map((p) => [p.id, p])));
  }, [planos]);

  const alterar = (id: string, campo: keyof PlanoAcesso, valor: any) =>
    setRascunho((r) => ({ ...r, [id]: { ...r[id], [campo]: valor } }));

  const alternarArea = (id: string, area: string) =>
    setRascunho((r) => {
      const atuais = r[id]?.tipos ?? [];
      const tipos = atuais.includes(area) ? atuais.filter((t) => t !== area) : [...atuais, area];
      return { ...r, [id]: { ...r[id], tipos } };
    });

  const gravar = async (id: string) => {
    const p = rascunho[id];
    if (!p.tipos.length) {
      toast({ title: 'Escolha ao menos uma área', description: 'O plano precisa liberar alguma coisa.', variant: 'destructive' });
      return;
    }
    try {
      await salvar.mutateAsync({ id, tipos: p.tipos, dias_acesso: Number(p.dias_acesso) || 31, ativo: p.ativo });
      const nomes = p.tipos.map((t) => AREAS.find((a) => a.valor === t)?.rotulo ?? t).join(', ');
      toast({ title: 'Plano atualizado', description: `${p.nome} agora libera ${nomes} por ${p.dias_acesso} dias.` });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo="Acessos e planos"
      descricao="Qual plano libera qual área e por quantos dias. É isto que o sistema usa quando um pagamento é confirmado."
    >
      <div className="space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {AREAS.map((a) => (
            <div key={a.valor} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{a.rotulo}</p>
              <p className="text-2xl font-semibold">{resumo?.porArea?.[a.valor] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">pessoas com acesso agora</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">O que cada plano libera</h2>
            <p className="text-sm text-muted-foreground">
              Ao confirmar um pagamento, o sistema libera a área escolhida aqui, pelo número de dias indicado,
              contando a partir do dia do pagamento — inclusive quando a pessoa paga em atraso.
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Plano</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Libera (pode marcar várias)</th>
                    <th className="p-3 font-medium">Dias</th>
                    <th className="p-3 font-medium">À venda</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {(planos ?? []).map((p) => {
                    const r = rascunho[p.id] ?? p;
                    const mudou =
                      r.tipos.join(',') !== p.tipos.join(',') ||
                      Number(r.dias_acesso) !== p.dias_acesso ||
                      r.ativo !== p.ativo;
                    return (
                      <tr key={p.id} className="border-t border-border align-top">
                        <td className="p-3">
                          <p className="font-medium">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.periodicidade}</p>
                        </td>
                        <td className="p-3 whitespace-nowrap">{dinheiro(p.valor_centavos)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-x-4 gap-y-2 min-w-64">
                            {AREAS.map((a) => (
                              <label key={a.valor} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={r.tipos.includes(a.valor)}
                                  onCheckedChange={() => alternarArea(p.id, a.valor)}
                                />
                                {a.rotulo}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={1}
                            className="w-24"
                            value={r.dias_acesso ?? 31}
                            onChange={(e) => alterar(p.id, 'dias_acesso', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3">
                          <Switch checked={!!r.ativo} onCheckedChange={(v) => alterar(p.id, 'ativo', v)} />
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" disabled={!mudou || salvar.isPending} onClick={() => gravar(p.id)}>
                            Salvar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-1">As áreas do portal</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Uma pessoa pode ter várias liberações ao mesmo tempo, de origens diferentes.
            </p>
            <ul className="space-y-2">
              {AREAS.map((a) => (
                <li key={a.valor} className="text-sm">
                  <span className="font-medium">{a.rotulo}</span>
                  <span className="text-muted-foreground"> — {a.explicacao}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-1">Os papéis das pessoas</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Papel é função dentro do time e da rede; acesso é o que a pessoa pode abrir.
            </p>
            <ul className="space-y-2">
              {PAPEIS.map((p) => (
                <li key={p.valor} className="text-sm">
                  <span className="font-medium">{p.rotulo}</span>
                  <span className="text-muted-foreground"> — {p.explicacao}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">Cortesia e revogação ficam na ficha da pessoa</Badge>
              <Button asChild size="sm" variant="outline"><Link to="/painel-conteudo/pessoas">Abrir Pessoas</Link></Button>
            </div>
          </div>
        </section>
      </div>
    </PainelLayout>
  );
}
