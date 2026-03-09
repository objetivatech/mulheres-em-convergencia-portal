import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaMeetings, useConectaMeetingAttendees } from '@/hooks/useConectaMeetings';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import MeetingGuestsList from '@/components/conecta/MeetingGuestsList';
import { Loader2, Plus, Calendar, MapPin, Clock, Users, Check, X, Trash2, Globe, Ticket, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function AttendeesList({ meetingId, canRemove, onRemove }: { meetingId: string; canRemove?: boolean; onRemove?: (userId: string) => void }) {
  const { data: attendees, isLoading } = useConectaMeetingAttendees(meetingId);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (isLoading) return <div className="mt-4 pt-4 border-t"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!attendees?.length) return <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">Nenhuma confirmação ainda</div>;

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm font-medium mb-2">Confirmadas ({attendees.length})</p>
      <div className="flex flex-wrap gap-2">
        {attendees.map(a => (
          <div key={a.id} className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-sm group">
            <Avatar className="h-5 w-5">
              <AvatarImage src={a.profile?.avatar_url || ''} />
              <AvatarFallback className="text-[10px]">{getInitials(a.profile?.full_name || 'U')}</AvatarFallback>
            </Avatar>
            <span>{a.profile?.full_name}</span>
            {canRemove && onRemove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="ml-1 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover presença?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover a presença de <strong>{a.profile?.full_name}</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(a.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PortalEvent {
  id: string;
  title: string;
  date_start: string;
  date_end: string | null;
  location: string | null;
  location_url: string | null;
  format: string;
  type: string;
  status: string;
  image_url: string | null;
  description: string | null;
  max_participants: number | null;
  current_participants: number | null;
  slug: string;
  is_registered?: boolean;
  registration_id?: string;
  checked_in_at?: string | null;
}

function useConectaEvents(userId?: string) {
  return useQuery({
    queryKey: ['conecta-synced-events', userId],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('conecta_sync', true)
        .eq('status', 'published')
        .order('date_start', { ascending: true });
      if (error) throw error;

      // Check user registrations with check-in status
      let registrations: Record<string, { id: string; checked_in_at: string | null }> = {};
      if (userId) {
        const { data: regs } = await supabase
          .from('event_registrations')
          .select('id, event_id, checked_in_at')
          .eq('user_id', userId)
          .in('event_id', events.map(e => e.id));
        regs?.forEach(r => { 
          registrations[r.event_id] = { id: r.id, checked_in_at: r.checked_in_at }; 
        });
      }

      return events.map(e => ({
        ...e,
        is_registered: !!registrations[e.id],
        registration_id: registrations[e.id]?.id || undefined,
        checked_in_at: registrations[e.id]?.checked_in_at || null,
      })) as PortalEvent[];
    },
    enabled: true,
  });
}

export default function ConectaEncontros() {
  const { meetings, isLoading, toggleAttendance, removeAttendance, createMeeting, deleteMeeting } = useConectaMeetings();
  const { user, isAdmin, isMemberOrAbove } = useConectaAccess();
  const { data: portalEvents = [], isLoading: eventsLoading } = useConectaEvents(user?.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [selectedGuestsMeeting, setSelectedGuestsMeeting] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', meeting_date: '', meeting_time: '', location: '' });

  const parseDate = (dateStr: string) => new Date(dateStr + 'T12:00:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMeeting.mutateAsync(formData);
    setOpen(false);
    setFormData({ title: '', description: '', meeting_date: '', meeting_time: '', location: '' });
  };

  // Register/unregister for portal events
  const toggleEventRegistration = useMutation({
    mutationFn: async ({ event, isRegistered, registrationId }: { event: PortalEvent; isRegistered: boolean; registrationId?: string }) => {
      if (!user?.id) throw new Error('Não autenticada');

      if (isRegistered && registrationId) {
        const { error } = await supabase.from('event_registrations').delete().eq('id', registrationId);
        if (error) throw error;
      } else {
        // Get user profile for pre-filling
        const { data: profile } = await supabase.from('profiles').select('full_name, email, phone, cpf').eq('id', user.id).single();
        if (!profile) throw new Error('Perfil não encontrado');

        const { error } = await supabase.from('event_registrations').insert({
          event_id: event.id,
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email || '',
          phone: profile.phone || null,
          cpf: profile.cpf || null,
          status: 'confirmed',
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conecta-synced-events'] });
      toast.success(vars.isRegistered ? 'Inscrição cancelada' : 'Inscrição confirmada!');
    },
    onError: () => toast.error('Erro ao atualizar inscrição'),
  });

  const upcomingMeetings = meetings.filter(m => isFuture(parseDate(m.meeting_date)) || isToday(parseDate(m.meeting_date)));
  const pastMeetings = meetings.filter(m => isPast(parseDate(m.meeting_date)) && !isToday(parseDate(m.meeting_date)));

  const upcomingEvents = portalEvents.filter(e => isFuture(parseISO(e.date_start)) || isToday(parseISO(e.date_start)));
  const pastEvents = portalEvents.filter(e => isPast(parseISO(e.date_start)) && !isToday(parseISO(e.date_start)));

  const MeetingCard = ({ meeting }: { meeting: typeof meetings[0] }) => {
    const isPastMeeting = isPast(parseDate(meeting.meeting_date)) && !isToday(parseDate(meeting.meeting_date));

    return (
      <Card className={`transition-all ${isPastMeeting ? 'opacity-70' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold">{meeting.title}</h3>
                {meeting.team && (
                  <Badge variant="outline" style={{ borderColor: meeting.team.color, color: meeting.team.color }}>
                    {meeting.team.name}
                  </Badge>
                )}
                {isToday(parseDate(meeting.meeting_date)) && <Badge>Hoje</Badge>}
              </div>
              {meeting.description && <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseDate(meeting.meeting_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </div>
                {meeting.meeting_time && (
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{meeting.meeting_time.slice(0, 5)}</div>
                )}
                {meeting.location && (
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{meeting.location}</div>
                )}
                <div className="flex items-center gap-1"><Users className="w-4 h-4" />{meeting.attendees_count} confirmadas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPastMeeting && (
                <Button
                  variant={meeting.is_attending ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAttendance.mutate({ meetingId: meeting.id, isAttending: meeting.is_attending || false })}
                  disabled={toggleAttendance.isPending}
                >
                  {meeting.is_attending ? <><Check className="w-4 h-4 mr-1" /> Confirmada</> : 'Confirmar'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedMeeting(selectedMeeting === meeting.id ? null : meeting.id)}>
                <Users className="w-4 h-4" />
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMeeting.mutate(meeting.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {selectedMeeting === meeting.id && (
            <AttendeesList meetingId={meeting.id} canRemove={isAdmin} onRemove={(userId) => removeAttendance.mutate({ meetingId: meeting.id, userId })} />
          )}
          {/* Guests list - visible only to members+ */}
          {isMemberOrAbove && (
            <MeetingGuestsList meetingId={meeting.id} meetingTitle={meeting.title} />
          )}
        </CardContent>
      </Card>
    );
  };

  const EventCard = ({ event }: { event: PortalEvent }) => {
    const isPastEvent = isPast(parseISO(event.date_start)) && !isToday(parseISO(event.date_start));
    const hasCheckedIn = !!event.checked_in_at;

    return (
      <Card className={`transition-all ${isPastEvent ? 'opacity-70' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold">{event.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />Portal
                </Badge>
                <Badge variant="outline" className="text-xs">{event.type}</Badge>
                {isToday(parseISO(event.date_start)) && <Badge>Hoje</Badge>}
                {/* Status badges */}
                {hasCheckedIn && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Presença Confirmada
                  </Badge>
                )}
                {event.is_registered && !hasCheckedIn && (
                  <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />Inscrita
                  </Badge>
                )}
              </div>
              {event.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(event.date_start), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</div>
                )}
                <div className="flex items-center gap-1"><Ticket className="w-4 h-4" />{event.format}</div>
                {event.max_participants && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.current_participants || 0}/{event.max_participants}
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-2">
              {!isPastEvent && isMemberOrAbove && !hasCheckedIn && (
                <Button
                  variant={event.is_registered ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleEventRegistration.mutate({
                    event,
                    isRegistered: event.is_registered || false,
                    registrationId: event.registration_id,
                  })}
                  disabled={toggleEventRegistration.isPending}
                >
                  {event.is_registered ? (
                    <><X className="w-4 h-4 mr-1" />Cancelar</>
                  ) : (
                    'Inscrever-se'
                  )}
                </Button>
              )}
              {hasCheckedIn && (
                <span className="text-xs text-muted-foreground text-center">
                  Check-in em<br/>
                  {format(parseISO(event.checked_in_at!), "dd/MM 'às' HH:mm")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ConectaLayout>
      <Helmet><title>Encontros | CONECTA+</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />Encontros
            </h1>
            <p className="text-muted-foreground">Agenda e presenças da comunidade</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Encontro</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Encontro</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting_date">Data</Label>
                      <Input id="meeting_date" type="date" value={formData.meeting_date} onChange={e => setFormData({ ...formData, meeting_date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting_time">Horário</Label>
                      <Input id="meeting_time" type="time" value={formData.meeting_time} onChange={e => setFormData({ ...formData, meeting_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Local</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Endereço ou link" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMeeting.isPending}>
                    {createMeeting.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : 'Criar Encontro'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading || eventsLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Upcoming section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />Próximos ({upcomingMeetings.length + upcomingEvents.length})
              </h2>
              {upcomingMeetings.length === 0 && upcomingEvents.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum encontro agendado</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map(e => <EventCard key={`event-${e.id}`} event={e} />)}
                  {upcomingMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
                </div>
              )}
            </div>

            {/* Past section */}
            {(pastMeetings.length > 0 || pastEvents.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                  Anteriores ({pastMeetings.length + pastEvents.length})
                </h2>
                <div className="space-y-4">
                  {pastMeetings.slice(0, 5).map(m => <MeetingCard key={m.id} meeting={m} />)}
                  {pastEvents.slice(0, 5).map(e => <EventCard key={`event-${e.id}`} event={e} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ConectaLayout>
  );
}
