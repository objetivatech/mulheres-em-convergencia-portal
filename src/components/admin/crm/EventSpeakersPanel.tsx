import React, { useState } from 'react';
import { useEvents, EventSpeaker } from '@/hooks/useEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ROLES = [
  { value: 'palestrante', label: 'Palestrante' },
  { value: 'instrutor', label: 'Instrutor(a)' },
  { value: 'facilitador', label: 'Facilitador(a)' },
  { value: 'convidado', label: 'Convidado(a)' },
  { value: 'mediador', label: 'Mediador(a)' },
];

const empty = (eventId: string): Partial<EventSpeaker> => ({
  event_id: eventId,
  name: '',
  role: 'palestrante',
  bio: '',
  photo_url: '',
  linkedin_url: '',
  display_order: 0,
});

export const EventSpeakersPanel: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { useEventSpeakers, useUpsertSpeaker, useDeleteSpeaker } = useEvents();
  const { data: speakers, isLoading } = useEventSpeakers(eventId);
  const upsert = useUpsertSpeaker();
  const remove = useDeleteSpeaker();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<EventSpeaker> | null>(null);

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast({ title: 'Informe o nome', variant: 'destructive' });
      return;
    }
    try {
      await upsert.mutateAsync({
        ...editing,
        event_id: eventId,
        name: editing.name!,
        display_order: editing.display_order ?? (speakers?.length ?? 0),
      } as any);
      toast({ title: 'Palestrante salvo' });
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  };

  const move = async (sp: EventSpeaker, dir: -1 | 1) => {
    const list = [...(speakers || [])].sort((a, b) => a.display_order - b.display_order);
    const idx = list.findIndex((s) => s.id === sp.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await upsert.mutateAsync({ id: sp.id, event_id: eventId, name: sp.name, display_order: swap.display_order } as any);
    await upsert.mutateAsync({ id: swap.id, event_id: eventId, name: swap.name, display_order: sp.display_order } as any);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Adicione todos os palestrantes, instrutores e convidados deste evento. O primeiro da lista aparece como instrutor principal.
          </p>
          <Button size="sm" onClick={() => setEditing(empty(eventId))}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {isLoading ? (
          <p>Carregando...</p>
        ) : !speakers || speakers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum palestrante cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {speakers.map((sp, idx) => (
              <div key={sp.id} className="flex items-start gap-3 border rounded-lg p-3">
                {sp.photo_url ? (
                  <img src={sp.photo_url} alt={sp.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{sp.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{sp.role}</div>
                  {sp.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sp.bio}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(sp, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === speakers.length - 1} onClick={() => move(sp, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(sp)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      if (confirm(`Remover ${sp.name}?`)) {
                        await remove.mutateAsync({ id: sp.id, eventId });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Editar palestrante' : 'Novo palestrante'}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Papel</Label>
                  <Select
                    value={editing.role || 'palestrante'}
                    onValueChange={(v) => setEditing({ ...editing, role: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mini-bio</Label>
                  <Textarea
                    rows={3}
                    value={editing.bio || ''}
                    onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                    placeholder="Breve descrição (1-3 linhas)"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={editing.linkedin_url || ''}
                    onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label>Foto</Label>
                  <ImageCropUploader
                    value={editing.photo_url || undefined}
                    onChange={(url) => setEditing({ ...editing, photo_url: url || '' })}
                    folder="event-speakers"
                    dimensions={IMAGE_PRESETS.ambassadorPhoto}
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