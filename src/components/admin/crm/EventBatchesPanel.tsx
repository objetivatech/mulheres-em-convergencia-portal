import React, { useState } from 'react';
import { useEvents, EventTicketBatch } from '@/hooks/useEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const empty = (eventId: string): Partial<EventTicketBatch> => ({
  event_id: eventId,
  name: '',
  price: 0,
  quantity: null,
  starts_at: null,
  ends_at: null,
  display_order: 0,
  active: true,
});

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toISOString().slice(0, 16) : '';

export const EventBatchesPanel: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { useEventBatches, useUpsertBatch, useDeleteBatch } = useEvents();
  const { data: batches, isLoading } = useEventBatches(eventId);
  const upsert = useUpsertBatch();
  const remove = useDeleteBatch();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<EventTicketBatch> | null>(null);

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast({ title: 'Informe o nome do lote', variant: 'destructive' });
      return;
    }
    try {
      await upsert.mutateAsync({
        ...editing,
        event_id: eventId,
        name: editing.name!,
        price: Number(editing.price) || 0,
        display_order: editing.display_order ?? (batches?.length ?? 0),
        starts_at: editing.starts_at || null,
        ends_at: editing.ends_at || null,
      } as any);
      toast({ title: 'Lote salvo' });
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Configure lotes (1º lote, 2º lote, último lote etc.) com preços e janelas de venda.
            O sistema seleciona automaticamente o lote ativo no momento da inscrição.
          </p>
          <Button size="sm" onClick={() => setEditing(empty(eventId))}>
            <Plus className="h-4 w-4 mr-1" /> Novo lote
          </Button>
        </div>

        {isLoading ? (
          <p>Carregando...</p>
        ) : !batches || batches.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum lote configurado. Sem lotes, o preço base do evento será usado.</p>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const sold = b.sold_count || 0;
              const remaining = b.quantity ? b.quantity - sold : null;
              const sellable = b.active && (remaining === null || remaining > 0);
              return (
                <div key={b.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {b.name}
                      {!sellable && <Badge variant="secondary">Indisponível</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {Number(b.price).toFixed(2)}
                      {b.quantity && ` · ${sold}/${b.quantity} vendidos`}
                      {b.starts_at && ` · de ${new Date(b.starts_at).toLocaleString('pt-BR')}`}
                      {b.ends_at && ` até ${new Date(b.ends_at).toLocaleString('pt-BR')}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(b)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        if (confirm(`Remover lote ${b.name}?`)) {
                          await remove.mutateAsync({ id: b.id, eventId });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Editar lote' : 'Novo lote'}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ex: 1º lote, Early bird, Último lote"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Preço (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editing.price ?? 0}
                      onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={editing.quantity ?? ''}
                      onChange={(e) =>
                        setEditing({ ...editing, quantity: e.target.value ? parseInt(e.target.value) : null })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início das vendas</Label>
                    <Input
                      type="datetime-local"
                      value={fmtDate(editing.starts_at)}
                      onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label>Fim das vendas</Label>
                    <Input
                      type="datetime-local"
                      value={fmtDate(editing.ends_at)}
                      onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Lote ativo</Label>
                  <Switch
                    checked={editing.active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};