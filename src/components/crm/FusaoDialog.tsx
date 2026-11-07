import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Ban, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFundirPessoas, usePreviaFusao, type ResumoFusao } from '@/hooks/useCrmMec';
import { dataCurta } from '@/components/crm/datas';
import { cn } from '@/lib/utils';

function Lado({ r, mantida, onEscolher }: { r?: ResumoFusao; mantida: boolean; onEscolher: () => void }) {
  if (!r) return <Skeleton className="h-56 rounded-xl" />;
  const linha = (rotulo: string, valor: any) => (
    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{rotulo}</dt><dd className="text-right">{valor}</dd></div>
  );
  return (
    <div className={cn('rounded-xl border p-3 text-sm', mantida ? 'border-primary bg-primary/5' : 'border-border bg-muted/40')}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{r.nome}</p>
          {r.nome_social && <p className="text-xs text-muted-foreground">prefere {r.nome_social}</p>}
        </div>
        <Badge variant={mantida ? 'default' : 'outline'} className="shrink-0 text-[10px]">{mantida ? 'Fica' : 'Será unida'}</Badge>
      </div>
      <dl className="space-y-1 text-xs">
        {linha('CPF', r.cpf ?? '—')}
        {linha('Conta no site', r.conta_site ? 'sim' : 'não')}
        {linha('No sistema desde', dataCurta(r.criado_em))}
        {linha('Encontros', r.inscricoes)}
        {linha('Pagamentos', r.pagamentos)}
        {linha('Conversas registradas', r.conversas)}
        {linha('Negócios', r.negocios)}
        {linha('Conversa aberta no funil', r.oportunidade_aberta ? 'sim' : 'não')}
      </dl>
      <p className="mt-2 break-all text-xs text-muted-foreground">{r.contatos.join(' · ') || 'sem contatos'}</p>
      {(r.associada || r.papeis.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.associada && <Badge className="text-[10px]">Associada</Badge>}
          {r.papeis.map((p) => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
        </div>
      )}
      {!mantida && <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onEscolher}>Manter esta ficha</Button>}
    </div>
  );
}

/** Une duas fichas da mesma pessoa. A prévia mostra tudo antes; o banco recusa casos perigosos e guarda auditoria. */
export default function FusaoDialog({
  aberto, onFechar, a, b, onUnida,
}: { aberto: boolean; onFechar: () => void; a: string | null; b: string | null; onUnida?: (mantida: string) => void }) {
  const { toast } = useToast();
  const [manter, setManter] = useState<string | null>(a);
  const [motivo, setMotivo] = useState('');
  const [ciente, setCiente] = useState(false);
  const sugerido = useRef(false);
  const remover = manter === a ? b : a;
  const { data, isLoading, error } = usePreviaFusao(aberto ? manter : null, aberto ? remover : null);
  const fundir = useFundirPessoas();

  useEffect(() => {
    if (!aberto) return;
    setManter(a); setMotivo(''); setCiente(false); sugerido.current = false;
  }, [aberto, a, b]);

  // Sugestão inicial: manter a ficha com login no site, depois a com CPF, depois a mais antiga.
  useEffect(() => {
    if (!data || sugerido.current) return;
    sugerido.current = true;
    const pontos = (r: ResumoFusao) => (r.conta_site ? 4 : 0) + (r.cpf ? 2 : 0);
    const m = data.manter, r = data.remover;
    if (pontos(r) > pontos(m) || (pontos(r) === pontos(m) && r.criado_em < m.criado_em)) setManter(r.id);
  }, [data]);

  const bloqueado = !!data?.bloqueios.length;

  const confirmar = async () => {
    if (!manter || !remover) return;
    try {
      await fundir.mutateAsync({ manter, remover, motivo });
      toast({ title: 'Fichas unidas', description: 'Todo o histórico agora está em uma ficha só.' });
      onUnida?.(manter);
      onFechar();
    } catch (e: any) {
      toast({ title: 'Não foi possível unir', description: e.message, variant: 'destructive' });
    }
  };

  const lados = data ? (manter === data.manter.id ? [data.manter, data.remover] : [data.remover, data.manter]) : [];

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Unir fichas da mesma pessoa</DialogTitle>
          <DialogDescription>
            Escolha qual ficha fica. Contatos, encontros, pagamentos, conversas e tarefas da outra passam para ela.
            Nada é sobrescrito: só completamos o que estiver vazio.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{(error as any).message}</p>
        ) : isLoading || !data ? (
          <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <Lado r={lados[0]} mantida onEscolher={() => undefined} />
              <ArrowLeftRight className="mx-auto mt-20 hidden h-5 w-5 text-muted-foreground sm:block" />
              <Lado r={lados[1]} mantida={false} onEscolher={() => setManter(lados[1].id)} />
            </div>

            {data.bloqueios.map((t) => (
              <p key={t} className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <Ban className="mt-0.5 h-4 w-4 shrink-0" /> {t}
              </p>
            ))}
            {data.avisos.map((t) => (
              <p key={t} className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {t}
              </p>
            ))}

            {!bloqueado && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fusao-motivo">Por que são a mesma pessoa? (fica registrado)</Label>
                  <Textarea id="fusao-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex.: mesmo WhatsApp; ela se cadastrou de novo com outro e-mail" />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={ciente} onCheckedChange={(v) => setCiente(v === true)} className="mt-0.5" />
                  Conferi os dados. A ficha "{lados[1]?.nome}" deixa de existir e tudo passa para "{lados[0]?.nome}".
                </label>
                <Button className="w-full" disabled={!ciente || fundir.isPending} onClick={confirmar}>
                  <Check className="mr-2 h-4 w-4" /> {fundir.isPending ? 'Unindo…' : 'Unir fichas'}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
