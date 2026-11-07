import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRegistrarInteracao, useSalvarAtividade } from '@/hooks/useCrmMec';
import { CANAIS, TIPOS_INTERACAO, TIPOS_ATIVIDADE } from '@/lib/crm';
import { paraInputDataHora, deInputDataHora, amanhaAs } from './datas';

/** Registra uma conversa e, se quiser, já agenda o próximo passo. */
export default function RegistrarContatoDialog({
  pessoaId, oportunidadeId, aberto, onFechar,
}: { pessoaId: string | null; oportunidadeId?: string | null; aberto: boolean; onFechar: () => void }) {
  const { toast } = useToast();
  const registrar = useRegistrarInteracao();
  const salvarTarefa = useSalvarAtividade();
  const [f, setF] = useState({ canal: 'whatsapp', tipo: 'conversa', resumo: '', objecao: '', quando: '' });
  const [proximo, setProximo] = useState({ titulo: '', vence: '', tipo: 'conversao' });

  useEffect(() => {
    if (aberto) {
      setF({ canal: 'whatsapp', tipo: 'conversa', resumo: '', objecao: '', quando: paraInputDataHora(new Date().toISOString()) });
      setProximo({ titulo: '', vence: paraInputDataHora(amanhaAs(9)), tipo: 'conversao' });
    }
  }, [aberto]);

  const salvar = async () => {
    if (!pessoaId) return;
    try {
      await registrar.mutateAsync({
        pessoa_id: pessoaId, oportunidade_id: oportunidadeId, canal: f.canal, tipo: f.tipo,
        resumo: f.resumo.trim(), objecao: f.objecao.trim() || null, ocorrido_em: deInputDataHora(f.quando),
      });
      if (proximo.titulo.trim()) {
        await salvarTarefa.mutateAsync({ valores: {
          pessoa_id: pessoaId, oportunidade_id: oportunidadeId || null, titulo: proximo.titulo.trim(),
          tipo: proximo.tipo, vence_em: deInputDataHora(proximo.vence),
        } });
      }
      toast({ title: 'Contato registrado' });
      onFechar();
    } catch (e: any) {
      toast({ title: 'Não foi possível registrar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar contato</DialogTitle>
          <DialogDescription>Anote o que conversaram. Fica no histórico da pessoa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Por onde</Label>
              <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CANAIS.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>O que foi</Label>
              <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_INTERACAO.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rc-resumo">Resumo da conversa</Label>
            <Textarea id="rc-resumo" rows={4} value={f.resumo} onChange={(e) => setF({ ...f, resumo: e.target.value })} placeholder="Ex.: Gostou do plano anual, vai conversar com o marido." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rc-obj">Dúvida ou objeção (opcional)</Label>
            <Input id="rc-obj" value={f.objecao} onChange={(e) => setF({ ...f, objecao: e.target.value })} placeholder="Ex.: achou caro, sem tempo agora" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rc-quando">Quando</Label>
            <Input id="rc-quando" type="datetime-local" value={f.quando} onChange={(e) => setF({ ...f, quando: e.target.value })} />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3">
            <p className="text-sm font-semibold">Próximo passo (opcional)</p>
            <Input value={proximo.titulo} onChange={(e) => setProximo({ ...proximo, titulo: e.target.value })} placeholder="Ex.: Retornar sobre a decisão" aria-label="Próximo passo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="datetime-local" value={proximo.vence} onChange={(e) => setProximo({ ...proximo, vence: e.target.value })} aria-label="Data do próximo passo" />
              <Select value={proximo.tipo} onValueChange={(v) => setProximo({ ...proximo, tipo: v })}>
                <SelectTrigger aria-label="Tipo do próximo passo"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ATIVIDADE.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={salvar} disabled={!f.resumo.trim() || registrar.isPending}>
            {registrar.isPending ? 'Salvando…' : 'Salvar no histórico'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
