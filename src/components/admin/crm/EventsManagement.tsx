import React, { useState, useEffect, useCallback } from 'react';
import { useEvents, Event, EventRegistration } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Calendar, Users, MapPin, Clock, 
  CheckCircle2, XCircle, Edit2, Trash2, 
  UserCheck, Search, Eye, FileEdit, ExternalLink, DollarSign, Copy, UserMinus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { EventFormBuilder } from './EventFormBuilder';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

// Storage key for form persistence
const FORM_STORAGE_KEY = 'crm_event_form_draft';

interface EventFormData {
  title: string;
  description: string;
  type: string;
  format: string;
  date_start: string;
  date_end: string;
  location: string;
  location_url: string;
  price: number;
  free: boolean;
  max_participants: number | null;
  instructor_name: string;
  status: string;
}

const getDefaultFormData = (): EventFormData => ({
  title: '',
  description: '',
  type: 'workshop',
  format: 'online',
  date_start: '',
  date_end: '',
  location: '',
  location_url: '',
  price: 0,
  free: true,
  max_participants: null,
  instructor_name: '',
  status: 'draft',
});

const eventToFormData = (event: Event): EventFormData => ({
  title: event.title || '',
  description: event.description || '',
  type: event.type || 'workshop',
  format: event.format || 'online',
  date_start: event.date_start ? format(new Date(event.date_start), "yyyy-MM-dd'T'HH:mm") : '',
  date_end: event.date_end ? format(new Date(event.date_end), "yyyy-MM-dd'T'HH:mm") : '',
  location: event.location || '',
  location_url: event.location_url || '',
  price: event.price || 0,
  free: event.free ?? true,
  max_participants: event.max_participants || null,
  instructor_name: event.instructor_name || '',
  status: event.status || 'draft',
});
const formatStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Rascunho', variant: 'secondary' },
    published: { label: 'Publicado', variant: 'default' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    completed: { label: 'Concluído', variant: 'outline' },
    pending: { label: 'Pendente', variant: 'secondary' },
    confirmed: { label: 'Confirmado', variant: 'default' },
    attended: { label: 'Presente', variant: 'default' },
  };
  const config = variants[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatBadge = (format: string) => {
  const formats: Record<string, string> = {
    online: '🌐 Online',
    presencial: '📍 Presencial',
    hibrido: '🔀 Híbrido',
  };
  return formats[format] || format;
};

export const EventsManagement: React.FC = () => {
  const { toast } = useToast();
  const events = useEvents();
  const { data: eventsList, isLoading: eventsLoading } = events.useEventsList();
  const { data: stats } = events.useEventStats();
  const createEvent = events.useCreateEvent();
  const updateEvent = events.useUpdateEvent();
  const deleteEvent = events.useDeleteEvent();
  const checkIn = events.useCheckIn();
  const removeRegistration = events.useRemoveRegistration();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state persisted - moved outside EventForm component
  const [formData, setFormData] = useState<EventFormData>(() => {
    // Try to load from localStorage on initial mount
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultFormData();
      }
    }
    return getDefaultFormData();
  });

  // Persist form data to localStorage whenever it changes
  useEffect(() => {
    if (!editingEvent && showEventForm) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, editingEvent, showEventForm]);

  // Clear saved form when dialog closes after successful creation
  const clearFormDraft = useCallback(() => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    setFormData(getDefaultFormData());
  }, []);

  // Handle opening form for new event, editing, or duplicating
  const openEventForm = useCallback((event?: Event, duplicate?: boolean) => {
    if (event) {
      const data = eventToFormData(event);
      if (duplicate) {
        // For duplication: reset status to draft and clear dates
        data.title = `${data.title} (cópia)`;
        data.status = 'draft';
        setEditingEvent(null); // It's a new event, not editing
      } else {
        setEditingEvent(event);
      }
      setFormData(data);
    } else {
      // New event - check for saved draft
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        try {
          setFormData(JSON.parse(saved));
        } catch {
          setFormData(getDefaultFormData());
        }
      } else {
        setFormData(getDefaultFormData());
      }
      setEditingEvent(null);
    }
    setShowEventForm(true);
  }, []);

  // Event Form - now uses external state for persistence
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, ...formData } as any);
        toast({ title: 'Evento atualizado com sucesso!' });
      } else {
        await createEvent.mutateAsync(formData as any);
        toast({ title: 'Evento criado com sucesso!' });
      }
      clearFormDraft();
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error) {
      toast({ title: 'Erro ao salvar evento', variant: 'destructive' });
    }
  };

  const eventFormContent = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Título</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="palestra">Palestra</SelectItem>
              <SelectItem value="curso">Curso</SelectItem>
              <SelectItem value="encontro">Encontro</SelectItem>
              <SelectItem value="encontro_networking">Encontro de Networking</SelectItem>
              <SelectItem value="conferencia">Conferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Formato</Label>
          <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data/Hora Início</Label>
          <Input
            type="datetime-local"
            value={formData.date_start}
            onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Data/Hora Fim</Label>
          <Input
            type="datetime-local"
            value={formData.date_end}
            onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
          />
        </div>
        <div>
          <Label>Local</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ex: Zoom, Auditório..."
          />
        </div>
        <div>
          <Label>Link do Local</Label>
          <Input
            value={formData.location_url}
            onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Instrutor/Palestrante</Label>
          <Input
            value={formData.instructor_name}
            onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Máx. Participantes</Label>
          <Input
            type="number"
            value={formData.max_participants || ''}
            onChange={(e) => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Sem limite"
          />
        </div>
        <div>
          <Label>Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price || 0}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value), free: parseFloat(e.target.value) === 0 })}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
          {editingEvent ? 'Atualizar' : 'Criar'} Evento
        </Button>
      </div>
    </form>
  );

  // Event Details with Registrations
  const EventDetails: React.FC<{ event: Event }> = ({ event }) => {
    const { data: registrations, isLoading } = events.useEventRegistrations(event.id);
    const [activeTab, setActiveTab] = useState('details');

    const handleCheckIn = async (registrationId: string) => {
      try {
        await checkIn.mutateAsync(registrationId);
        toast({ title: 'Check-in realizado! Participante movido para "Participou" no pipeline.' });
      } catch (error) {
        toast({ title: 'Erro no check-in', variant: 'destructive' });
      }
    };

    const handleRemoveRegistration = async (registrationId: string) => {
      if (!confirm('Tem certeza que deseja remover esta inscrição? A vaga será liberada para outras pessoas. O contato no CRM será mantido.')) {
        return;
      }
      try {
        await removeRegistration.mutateAsync({ registrationId, eventId: event.id });
        toast({ title: 'Inscrição removida com sucesso! Vaga liberada.' });
      } catch (error) {
        toast({ title: 'Erro ao remover inscrição', variant: 'destructive' });
      }
    };

    const publicUrl = `${PRODUCTION_DOMAIN}/eventos/${event.slug}`;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedEvent(null)}>
            ← Voltar
          </Button>
          <div className="flex gap-2">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />Ver Página
              </Button>
            </a>
            <Button variant="outline" onClick={() => openEventForm(event, false)}>
              <Edit2 className="h-4 w-4 mr-2" />Editar
            </Button>
            <Button variant="outline" onClick={() => openEventForm(event, true)}>
              <Copy className="h-4 w-4 mr-2" />Duplicar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{event.description}</p>
              </div>
              <div className="flex gap-2">
                {formatStatusBadge(event.status)}
                {!event.free && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {event.price?.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(event.date_start), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{formatBadge(event.format)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.current_participants}/{event.max_participants || '∞'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {event.free ? 'Gratuito' : `R$ ${event.price?.toFixed(2)}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Inscritos ({registrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Formulário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <p>Carregando...</p>
                ) : registrations?.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma inscrição ainda.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations?.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.full_name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{formatStatusBadge(reg.status)}</TableCell>
                          <TableCell>
                            {event.free ? (
                              <Badge variant="secondary">Gratuito</Badge>
                            ) : reg.paid ? (
                              <Badge variant="default" className="bg-green-600">Pago</Badge>
                            ) : (
                              <Badge variant="destructive">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {reg.checked_in_at ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                {format(new Date(reg.checked_in_at), 'HH:mm')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!reg.checked_in_at && (reg.paid || event.free) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCheckIn(reg.id)}
                                  disabled={checkIn.isPending}
                                  title="Fazer check-in"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Check-in
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveRegistration(reg.id)}
                                disabled={removeRegistration.isPending}
                                title="Remover inscrição (liberar vaga)"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="mt-4">
            <EventFormBuilder eventId={event.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Filter events by search
  const filteredEvents = eventsList?.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedEvent) {
    return <EventDetails event={selectedEvent} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
            <p className="text-muted-foreground text-sm">Total Eventos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats?.upcoming_events || 0}</div>
            <p className="text-muted-foreground text-sm">Próximos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total_registrations || 0}</div>
            <p className="text-muted-foreground text-sm">Inscrições</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.attendance_rate?.toFixed(0) || 0}%</div>
            <p className="text-muted-foreground text-sm">Taxa Presença</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showEventForm} onOpenChange={(open) => {
          if (!open) {
            setEditingEvent(null);
          }
          setShowEventForm(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => openEventForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Atualize as informações do evento.' : 'Preencha as informações para criar um novo evento. Os dados são salvos automaticamente.'}
              </DialogDescription>
            </DialogHeader>
            {eventFormContent}
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <Card>
        <CardContent className="p-0">
          {eventsLoading ? (
            <p className="p-6">Carregando...</p>
          ) : filteredEvents?.length === 0 ? (
            <p className="p-6 text-muted-foreground">Nenhum evento encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">{event.type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.date_start), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{formatBadge(event.format)}</TableCell>
                    <TableCell>
                      {event.current_participants}/{event.max_participants || '∞'}
                    </TableCell>
                    <TableCell>{formatStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(event)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEventForm(event, false)} title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEventForm(event, true)} title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          title="Excluir"
                          onClick={async () => {
                            if (confirm('Excluir evento?')) {
                              await deleteEvent.mutateAsync(event.id);
                              toast({ title: 'Evento excluído' });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
