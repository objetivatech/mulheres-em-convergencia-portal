import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CopyCheck, GitMerge, History, Undo2, UserCheck } from 'lucide-react';
import CrmLayout, { rotaCrm } from '@/components/crm/CrmLayout';
import FusaoDialog from '@/components/crm/FusaoDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDesfazerIgnorar, useDuplicadas, useHistoricoRepetidas, useIgnorarDuplicada } from '@/hooks/useCrmMec';
import { dataHora } from '@/components/crm/datas';

const ROTULO_MOV: Record<string, string> = {
  contatos: 'contatos', acessos: 'acessos', pagamentos: 'pagamentos', inscricoes: 'inscrições',
  negocios: 'negócios', oportunidades: 'oportunidades', historico: 'registros de histórico', tarefas: 'tarefas',
};

export default function CrmRepetidas() {
  const { toast } = useToast();
  const { data, isLoading } = useDuplicadas();
  const { data: hist } = useHistoricoRepetidas();
  const ignorar = useIgnorarDuplicada();
  const desfazer = useDesfazerIgnorar();
  const [par, setPar] = useState<{ a: string; b: string } | null>(null);
  const [mostrarFracas, setMostrarFracas] = useState(true);

  const lista = useMemo(() => (data ?? []).filter((p) => mostrarFracas || p.forte), [data, mostrarFracas]);
  const fortes = (data ?? []).filter((p) => p.forte).length;

  const naoSao = (a: string, b: string) =>
    ignorar.mutateAsync({ a, b, motivo: 'Pessoas diferentes (conferido pela equipe)' })
      .then(() => toast({ title: 'Par retirado da fila', description: 'Você pode desfazer na aba "Histórico".' }))
      .catch((e: any) => toast({ title: 'Não foi possível', description: e.message, variant: 'destructive' }));

  return (
    <CrmLayout
      titulo="CRM · Fichas repetidas"
      descricao="Pessoas que podem ter duas fichas. Confira e una em uma só, sem perder nada."
    >
      <Tabs defaultValue="fila">
        <TabsList className="mb-4">
          <TabsTrigger value="fila"><CopyCheck className="mr-1 h-4 w-4" /> Para conferir ({data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="historico"><History className="mr-1 h-4 w-4" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fila">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm" data-tour="crm-repetidas-legenda">
            <span><Badge className="mr-1 text-[10px]">Sinal forte</Badge> mesmo e-mail ou telefone: quase sempre é a mesma pessoa.</span>
            <span><Badge variant="outline" className="mr-1 text-[10px]">Confira</Badge> só o nome é igual: pode ser outra pessoa.</span>
            <label className="ml-auto flex items-center gap-2">
              <input type="checkbox" checked={mostrarFracas} onChange={(e) => setMostrarFracas(e.target.checked)} />
              Mostrar também "só nome igual"
            </label>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : !lista.length ? (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {fortes || data?.length ? 'Nada com sinal forte. 🎉' : 'Nenhuma ficha repetida encontrada. 🎉'}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
              {lista.map((p) => (
                <li key={`${p.pessoa_a}-${p.pessoa_b}`} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      <Link to={rotaCrm.ficha(p.pessoa_a)} className="hover:underline">{p.nome_a}</Link>
                      <span className="mx-2 text-muted-foreground">e</span>
                      <Link to={rotaCrm.ficha(p.pessoa_b)} className="hover:underline">{p.nome_b}</Link>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.motivos.map((m) => (
                        <Badge key={m} variant={m.startsWith('Nome') ? 'outline' : 'default'} className="text-[10px]">{m}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={ignorar.isPending} onClick={() => naoSao(p.pessoa_a, p.pessoa_b)}>
                      <UserCheck className="mr-1 h-4 w-4" /> Não são a mesma pessoa
                    </Button>
                    <Button size="sm" onClick={() => setPar({ a: p.pessoa_a, b: p.pessoa_b })}>
                      <GitMerge className="mr-1 h-4 w-4" /> Conferir e unir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <section className="rounded-[var(--radius)] border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Fichas unidas</h2>
            {!hist?.fusoes.length ? <p className="text-sm text-muted-foreground">Nenhuma união feita ainda.</p> : (
              <ul className="divide-y divide-border text-sm">
                {hist.fusoes.map((f) => (
                  <li key={f.id} className="py-2">
                    <p>
                      <span className="text-muted-foreground">"{f.nome_removido}" foi unida a </span>
                      {f.pessoa_mantida_id ? <Link to={rotaCrm.ficha(f.pessoa_mantida_id)} className="font-medium hover:underline">{f.nome_mantido}</Link> : f.nome_mantido}
                      <span className="text-muted-foreground"> · {dataHora(f.realizado_em)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(f.movimentos ?? {})
                        .filter(([k, v]) => ROTULO_MOV[k] && Number(v) > 0)
                        .map(([k, v]) => `${v} ${ROTULO_MOV[k]}`).join(' · ') || 'sem registros para mover'}
                      {f.motivo ? ` · Motivo: ${f.motivo}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-[var(--radius)] border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Marcadas como pessoas diferentes</h2>
            {!hist?.ignoradas.length ? <p className="text-sm text-muted-foreground">Nenhum par marcado.</p> : (
              <ul className="divide-y divide-border text-sm">
                {hist.ignoradas.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>{g.a?.nome} <span className="text-muted-foreground">e</span> {g.b?.nome}
                      <span className="text-xs text-muted-foreground"> · {dataHora(g.registrado_em)}</span></span>
                    <Button size="sm" variant="ghost" onClick={() => desfazer.mutate(g.id)}>
                      <Undo2 className="mr-1 h-4 w-4" /> Voltar para a fila
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>

      <FusaoDialog aberto={!!par} a={par?.a ?? null} b={par?.b ?? null} onFechar={() => setPar(null)} />
    </CrmLayout>
  );
}
