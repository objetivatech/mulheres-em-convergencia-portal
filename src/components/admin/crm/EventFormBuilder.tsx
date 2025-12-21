import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEventFormFields, EventFormField } from '@/hooks/useEventFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, GripVertical, Trash2, Edit2, Copy, 
  Type, Mail, Phone, CreditCard, List, CheckSquare, AlignLeft, Hash 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/useEvents';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'cpf', label: 'CPF', icon: CreditCard },
  { value: 'select', label: 'Seleção', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'textarea', label: 'Texto longo', icon: AlignLeft },
  { value: 'number', label: 'Número', icon: Hash },
];

interface SortableFieldProps {
  field: EventFormField;
  onEdit: (field: EventFormField) => void;
  onDelete: (id: string) => void;
}

const SortableField: React.FC<SortableFieldProps> = ({ field, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeConfig = FIELD_TYPES.find(t => t.value === field.field_type);
  const Icon = fieldTypeConfig?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted p-1 rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-2 flex-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{field.field_label}</span>
        <span className="text-xs text-muted-foreground">({field.field_name})</span>
        {field.required && (
          <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => onEdit(field)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(field.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

interface FieldFormProps {
  field?: EventFormField | null;
  eventId: string;
  onClose: () => void;
}

const FieldForm: React.FC<FieldFormProps> = ({ field, eventId, onClose }) => {
  const { toast } = useToast();
  const formFields = useEventFormFields();
  const createField = formFields.useCreateFormField();
  const updateField = formFields.useUpdateFormField();

  const [formData, setFormData] = useState({
    field_label: field?.field_label || '',
    field_name: field?.field_name || '',
    field_type: field?.field_type || 'text',
    required: field?.required ?? false,
    options: field?.options?.join('\n') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fieldName = formData.field_name || formData.field_label.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    const options = formData.field_type === 'select' && formData.options
      ? formData.options.split('\n').filter(o => o.trim())
      : null;

    try {
      if (field) {
        await updateField.mutateAsync({
          id: field.id,
          field_label: formData.field_label,
          field_name: fieldName,
          field_type: formData.field_type as EventFormField['field_type'],
          required: formData.required,
          options,
        });
        toast({ title: 'Campo atualizado!' });
      } else {
        await createField.mutateAsync({
          event_id: eventId,
          field_label: formData.field_label,
          field_name: fieldName,
          field_type: formData.field_type as EventFormField['field_type'],
          required: formData.required,
          options,
        });
        toast({ title: 'Campo criado!' });
      }
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar campo', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Rótulo do campo</Label>
        <Input
          value={formData.field_label}
          onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
          placeholder="Ex: Empresa onde trabalha"
          required
        />
      </div>
      
      <div>
        <Label>Nome do campo (para integração)</Label>
        <Input
          value={formData.field_name}
          onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
          placeholder="Ex: company_name"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Gerado automaticamente se deixar em branco
        </p>
      </div>
      
      <div>
        <Label>Tipo do campo</Label>
        <Select 
          value={formData.field_type} 
          onValueChange={(v) => setFormData({ ...formData, field_type: v as EventFormField['field_type'] })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.field_type === 'select' && (
        <div>
          <Label>Opções (uma por linha)</Label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md bg-background"
            value={formData.options}
            onChange={(e) => setFormData({ ...formData, options: e.target.value })}
            placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
          />
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.required}
          onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
        />
        <Label>Campo obrigatório</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={createField.isPending || updateField.isPending}>
          {field ? 'Atualizar' : 'Adicionar'} Campo
        </Button>
      </div>
    </form>
  );
};

interface EventFormBuilderProps {
  eventId: string;
}

export const EventFormBuilder: React.FC<EventFormBuilderProps> = ({ eventId }) => {
  const { toast } = useToast();
  const formFields = useEventFormFields();
  const { data: fields, isLoading } = formFields.useFormFields(eventId);
  const deleteField = formFields.useDeleteFormField();
  const reorderFields = formFields.useReorderFormFields();
  const duplicateForm = formFields.useDuplicateFormFromEvent();
  
  const events = useEvents();
  const { data: allEvents } = events.useEventsList();

  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<EventFormField | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedSourceEvent, setSelectedSourceEvent] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && fields) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      const newOrder = arrayMove(fields, oldIndex, newIndex);
      
      try {
        await reorderFields.mutateAsync({
          eventId,
          fieldIds: newOrder.map(f => f.id),
        });
      } catch (error) {
        toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      }
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Remover este campo?')) return;
    try {
      await deleteField.mutateAsync({ id: fieldId, eventId });
      toast({ title: 'Campo removido' });
    } catch (error) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const handleCopyFromEvent = async () => {
    if (!selectedSourceEvent) return;
    try {
      const result = await duplicateForm.mutateAsync({
        sourceEventId: selectedSourceEvent,
        targetEventId: eventId,
      });
      toast({ title: `${result.count} campos copiados!` });
      setShowCopyDialog(false);
      setSelectedSourceEvent('');
    } catch (error: any) {
      toast({ title: 'Erro ao copiar', description: error.message, variant: 'destructive' });
    }
  };

  const otherEvents = allEvents?.filter(e => e.id !== eventId) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Campos do Formulário</CardTitle>
          <div className="flex gap-2">
            <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar de outro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copiar formulário de outro evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Selecione o evento fonte</Label>
                    <Select value={selectedSourceEvent} onValueChange={setSelectedSourceEvent}>
                      <SelectTrigger><SelectValue placeholder="Escolher evento..." /></SelectTrigger>
                      <SelectContent>
                        {otherEvents.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCopyDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCopyFromEvent} disabled={!selectedSourceEvent || duplicateForm.isPending}>
                      Copiar Campos
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showFieldForm} onOpenChange={(open) => { setShowFieldForm(open); if (!open) setEditingField(null); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
                </DialogHeader>
                <FieldForm 
                  field={editingField} 
                  eventId={eventId} 
                  onClose={() => { setShowFieldForm(false); setEditingField(null); }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Campos padrão (Nome, Email, Telefone, CPF) são incluídos automaticamente. 
          Adicione campos personalizados abaixo:
        </p>

        {isLoading ? (
          <p>Carregando...</p>
        ) : fields?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum campo personalizado ainda.</p>
            <p className="text-sm">Clique em "Adicionar Campo" para criar.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields?.map(f => f.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields?.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    onEdit={(f) => { setEditingField(f); setShowFieldForm(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};
