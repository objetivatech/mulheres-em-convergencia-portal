import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SeletorPessoa from '@/components/painel/SeletorPessoa';
import { useToast } from '@/hooks/use-toast';
import { useSalvarAtividade } from '@/hooks/useCrmMec';
import { TIPOS_ATIVIDADE } from '@/lib/crm';
import { paraInputDataHora, deInputDataHora, amanhaAs } from './datas';

/** Cria ou edita uma tarefa/retorno. */
export default function TarefaDialog({
  aberto, onFechar, tarefa, pessoaId, oportunidadeId,
}: {
  aberto: boolean; onFechar: () => void; tarefa?: any | null;
  pessoaId?: string | null; oportunidadeId?: string | null;
}) {
  const { toast } = useToast();
  const salvar = useSalvarAtividade();
  const [f, setF] = useState<any>({});

  useEffect(() => {
    if (!aberto) return;
    setF(tarefa ? {
      titulo: tarefa.titulo, tipo: tarefa.tipo, prioridade: tarefa.prioridade, notas: tarefa.notas ?? '',
      vence: paraInputDataHora(tarefa.vence_em), pessoa_id: tarefa.pessoa_id,
    } : {
      titulo: '', tipo: 'conversao', prioridade: 'normal', notas: '', vence: paraInputDataHora(amanhaAs(9)),
      pessoa_id: pessoaId ?? null,
    });
  }, [aberto, tarefa, pessoaId]);

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        id: tarefa?.id,
        valores: {
          titulo: f.titulo.trim(), tipo: f.tipo, prioridade: f.prioridade, notas: f.notas.trim() || null,
          vence_em: deInputDataHora(f.vence), pessoa_id: f.pessoa_id || null,
          ...(tarefa ? {} : { oportunidade_id: oportunidadeId || null }),
        },
      });
      toast({ title: tarefa ? 'Tarefa atualizada' : 'Tarefa criada' });
      onFechar();
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{tarefa ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tf-titulo">O que fazer</Label>
            <Input id="tf-titulo" value={f.titulo ?? ''} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Ex.: Ligar para saber como foi o encontro" />
          </div>
          {!pessoaId && (
            <div className="space-y-1.5">
              <Label>Com quem (opcional)</Label>
              <SeletorPessoa value={f.pessoa_id ?? null} onChange={(id) => setF({ ...f, pessoa_id: id })} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label>Tipo</Label>
              <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ATIVIDADE.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={f.prioridade} onValueChange={(v) => setF({ ...f, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf-vence">Para quando</Label>
              <Input id="tf-vence" type="datetime-local" value={f.vence ?? ''} onChange={(e) => setF({ ...f, vence: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tf-notas">Anotações (opcional)</Label>
            <Textarea id="tf-notas" rows={3} value={f.notas ?? ''} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </div>
          <Button className="w-full" onClick={enviar} disabled={!f.titulo?.trim() || salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar tarefa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
