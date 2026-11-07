import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePlanosParaCrm, useSalvarOportunidade } from '@/hooks/useCrmMec';
import { CANAIS, ETAPAS } from '@/lib/crm';

/** Abre ou edita a oportunidade comercial (uma aberta por pessoa). */
export default function OportunidadeDialog({
  aberto, onFechar, pessoaId, oportunidade, etapaInicial,
}: { aberto: boolean; onFechar: () => void; pessoaId: string; oportunidade?: any | null; etapaInicial?: string }) {
  const { toast } = useToast();
  const salvar = useSalvarOportunidade();
  const { data: planos } = usePlanosParaCrm();
  const [f, setF] = useState<any>({});

  useEffect(() => {
    if (!aberto) return;
    const o = oportunidade;
    setF({
      etapa: etapaInicial ?? o?.etapa ?? 'nova',
      plano_id: o?.plano_id ?? '',
      valor: o ? String((o.valor_centavos ?? 0) / 100).replace('.', ',') : '',
      canal: o?.canal ?? 'whatsapp',
      proxima_acao: o?.proxima_acao ?? '',
      motivo: o?.motivo ?? '',
    });
  }, [aberto, oportunidade, etapaInicial]);

  const fechando = ['sem_interesse', 'perdida'].includes(f.etapa);

  const escolherPlano = (id: string) => {
    const p = planos?.find((x) => x.id === id);
    setF({ ...f, plano_id: id, valor: p && !f.valor ? String(p.valor_centavos / 100).replace('.', ',') : f.valor });
  };

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        id: oportunidade?.id,
        valores: {
          ...(oportunidade ? {} : { pessoa_id: pessoaId }),
          etapa: f.etapa,
          plano_id: f.plano_id || null,
          valor_centavos: Math.round(Number(String(f.valor || '0').replace(/\./g, '').replace(',', '.')) * 100) || 0,
          canal: f.canal || null,
          proxima_acao: f.proxima_acao.trim() || null,
          motivo: f.motivo.trim() || null,
        },
      });
      toast({ title: oportunidade ? 'Oportunidade atualizada' : 'Oportunidade aberta' });
      onFechar();
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{oportunidade ? 'Oportunidade' : 'Nova oportunidade'}</DialogTitle>
          <DialogDescription>A etapa mostra em que ponto da conversa sobre associação vocês estão.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={f.etapa} onValueChange={(v) => setF({ ...f, etapa: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ETAPAS.map((e) => <SelectItem key={e.v} value={e.v}>{e.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Canal da conversa</Label>
              <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CANAIS.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plano de interesse</Label>
              <Select value={f.plano_id || 'nenhum'} onValueChange={(v) => escolherPlano(v === 'nenhum' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Ainda não definido</SelectItem>
                  {(planos ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{!p.ativo ? ' (inativo)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="op-valor">Valor esperado (R$)</Label>
              <Input id="op-valor" inputMode="decimal" value={f.valor ?? ''} onChange={(e) => setF({ ...f, valor: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="op-prox">Próxima ação</Label>
            <Input id="op-prox" value={f.proxima_acao ?? ''} onChange={(e) => setF({ ...f, proxima_acao: e.target.value })} placeholder="Ex.: Enviar comparativo dos planos" />
          </div>
          {(fechando || f.motivo) && (
            <div className="space-y-1.5">
              <Label htmlFor="op-motivo">Motivo {fechando ? '(por que não seguiu?)' : ''}</Label>
              <Input id="op-motivo" value={f.motivo ?? ''} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder="Ex.: momento financeiro, sem tempo" />
            </div>
          )}
          {f.etapa === 'associada' && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              A data oficial de associação vem do pagamento confirmado no site. Marcar aqui só organiza o funil
              e cria uma tarefa de boas-vindas.
            </p>
          )}
          <Button className="w-full" onClick={enviar} disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
