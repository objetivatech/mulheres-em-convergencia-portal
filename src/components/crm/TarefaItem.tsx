import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle, CalendarClock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSalvarAtividade } from '@/hooks/useCrmMec';
import { rotuloTipoAtividade, situacaoTarefa } from '@/lib/crm';
import { cn } from '@/lib/utils';
import { rotaCrm } from './CrmLayout';
import { dataHora, amanhaAs } from './datas';

const COR: Record<string, string> = {
  atrasada: 'border-destructive/40 bg-destructive/5',
  hoje: 'border-primary/40 bg-primary/5',
  futura: 'border-border',
  concluida: 'border-border opacity-70',
  cancelada: 'border-border opacity-60',
};

/** Uma tarefa com as ações de 1 clique: WhatsApp, concluir, reagendar. */
export default function TarefaItem({
  t, mostrarPessoa = true, onWhatsApp, onEditar,
}: { t: any; mostrarPessoa?: boolean; onWhatsApp?: (pessoaId: string, oportunidadeId?: string | null) => void; onEditar?: (t: any) => void }) {
  const { toast } = useToast();
  const salvar = useSalvarAtividade();
  const [concluindo, setConcluindo] = useState(false);
  const [resultado, setResultado] = useState('');
  const sit = situacaoTarefa(t);
  const nome = t.pessoa?.nome_social || t.pessoa?.nome;
  const aberta = sit !== 'concluida' && sit !== 'cancelada';

  const reagendar = (dias: number) =>
    salvar.mutateAsync({ id: t.id, valores: { vence_em: amanhaAs(9, dias) } })
      .then(() => toast({ title: `Reagendada para daqui a ${dias} dia(s)` }))
      .catch((e) => toast({ title: 'Não foi possível reagendar', description: e.message, variant: 'destructive' }));

  const concluir = async () => {
    try {
      await salvar.mutateAsync({ id: t.id, valores: { concluida_em: new Date().toISOString(), resultado: resultado.trim() || null } });
      toast({ title: 'Tarefa concluída', description: t.pessoa_id ? 'Ficou registrada no histórico.' : undefined });
      setConcluindo(false); setResultado('');
    } catch (e: any) {
      toast({ title: 'Não foi possível concluir', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <li className={cn('rounded-xl border p-3', COR[sit])}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{t.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {mostrarPessoa && t.pessoa_id && (
              <><Link to={rotaCrm.ficha(t.pessoa_id)} className="underline underline-offset-2 hover:text-foreground">{nome}</Link> · </>
            )}
            {dataHora(t.vence_em)}
            {sit === 'atrasada' && <span className="text-destructive font-semibold"> · atrasada</span>}
          </p>
          {t.notas && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.notas}</p>}
          {t.resultado && <p className="mt-1 text-xs">Resultado: {t.resultado}</p>}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">{rotuloTipoAtividade(t.tipo)}</Badge>
          {t.prioridade === 'alta' && <Badge className="text-[10px]">Alta</Badge>}
        </div>
      </div>
      {aberta && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.pessoa_id && onWhatsApp && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => onWhatsApp(t.pessoa_id, t.oportunidade_id)}>
              <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
            </Button>
          )}
          <Button size="sm" className="h-8" onClick={() => setConcluindo(true)}>
            <Check className="mr-1 h-3.5 w-3.5" /> Concluir
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8"><CalendarClock className="mr-1 h-3.5 w-3.5" /> Reagendar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => reagendar(1)}>Amanhã</DropdownMenuItem>
              <DropdownMenuItem onClick={() => reagendar(3)}>Em 3 dias</DropdownMenuItem>
              <DropdownMenuItem onClick={() => reagendar(7)}>Em 1 semana</DropdownMenuItem>
              <DropdownMenuItem onClick={() => reagendar(30)}>Em 1 mês</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onEditar && (
            <Button size="sm" variant="ghost" className="h-8" onClick={() => onEditar(t)} aria-label="Editar tarefa">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      <Dialog open={concluindo} onOpenChange={setConcluindo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir tarefa</DialogTitle>
            <DialogDescription>{t.titulo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor={`res-${t.id}`}>Como foi? (opcional)</Label>
            <Textarea id={`res-${t.id}`} rows={3} value={resultado} onChange={(e) => setResultado(e.target.value)} placeholder="Ex.: Respondeu que vai decidir no fim do mês." />
            <Button className="w-full" onClick={concluir} disabled={salvar.isPending}>Concluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
