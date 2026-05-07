import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents, Event } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

interface Props {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddParticipantDialog: React.FC<Props> = ({ event, open, onOpenChange }) => {
  const { useEventBatches, useAddManualParticipant } = useEvents();
  const { data: batches } = useEventBatches(event.id);
  const add = useAddManualParticipant();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    paid: event.free ?? true,
    batch_id: '' as string,
    send_email: true,
  });

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }
    try {
      const batch = batches?.find((b) => b.id === form.batch_id);
      await add.mutateAsync({
        event_id: event.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        cpf: form.cpf?.replace(/\D/g, '') || null,
        paid: event.free ? true : form.paid,
        batch_id: form.batch_id || null,
        send_email: form.send_email,
        eventTitle: event.title,
        eventPrice: batch?.price ?? event.price ?? 0,
        isFree: !!event.free,
        cost_center_id: event.cost_center_id,
      });
      toast({ title: 'Participante adicionado!' });
      onOpenChange(false);
      setForm({
        full_name: '', email: '', phone: '', cpf: '',
        paid: event.free ?? true, batch_id: '', send_email: true,
      });
    } catch (e: any) {
      toast({ title: 'Erro ao adicionar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar participante manualmente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
          </div>
          {batches && batches.length > 0 && (
            <div>
              <Label>Lote</Label>
              <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sem lote" /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — R$ {Number(b.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!event.free && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Marcar como pago</Label>
                <p className="text-xs text-muted-foreground">Use quando o pagamento foi recebido fora do sistema.</p>
              </div>
              <Switch checked={form.paid} onCheckedChange={(v) => setForm({ ...form, paid: v })} />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Enviar email de confirmação</Label>
            <Switch checked={form.send_email} onCheckedChange={(v) => setForm({ ...form, send_email: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={add.isPending}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};