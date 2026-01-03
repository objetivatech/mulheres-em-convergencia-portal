import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { crmIntegration } from '@/hooks/useCRMIntegration';
import slugify from 'slugify';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  format: 'online' | 'presencial' | 'hibrido';
  date_start: string;
  date_end: string | null;
  location: string | null;
  location_url: string | null;
  image_url: string | null;
  price: number | null;
  free: boolean;
  max_participants: number | null;
  current_participants: number;
  registration_deadline: string | null;
  requires_approval: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  instructor_name: string | null;
  instructor_id: string | null;
  cost_center_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  lead_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  paid: boolean;
  payment_amount: number | null;
  payment_id: string | null;
  checked_in_at: string | null;
  cost_center_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export const useEvents = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ==================== EVENTS ====================
  const useEventsList = (filters?: {
    status?: string;
    type?: string;
    format?: string;
    upcoming?: boolean;
  }) => {
    return useQuery({
      queryKey: ['events', filters],
      queryFn: async () => {
        let query = supabase
          .from('events')
          .select('*')
          .order('date_start', { ascending: true });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.format) {
          query = query.eq('format', filters.format);
        }
        if (filters?.upcoming) {
          query = query.gte('date_start', new Date().toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Event[];
      },
    });
  };

  const useEventById = (eventId: string | null) => {
    return useQuery({
      queryKey: ['event', eventId],
      queryFn: async () => {
        if (!eventId) return null;
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        if (error) throw error;
        return data as Event;
      },
      enabled: !!eventId,
    });
  };

  const useCreateEvent = () => {
    return useMutation({
      mutationFn: async (event: Partial<Event>) => {
        // Generate slug using slugify for proper handling of accents and special chars
        const baseSlug = event.slug || slugify(event.title || 'evento', { 
          lower: true, 
          strict: true,
          locale: 'pt'
        });
        const slug = `${baseSlug}-${Date.now()}`;
        
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: event.title || 'Novo Evento',
            slug,
            type: event.type || 'workshop',
            format: event.format || 'online',
            date_start: event.date_start || new Date().toISOString(),
            status: event.status || 'draft',
            ...event,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as Event;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
    });
  };

  const useUpdateEvent = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<Event> & { id: string }) => {
        const { data, error } = await supabase
          .from('events')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Event;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      },
    });
  };

  const useDeleteEvent = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
    });
  };

  // ==================== REGISTRATIONS ====================
  const useEventRegistrations = (eventId?: string) => {
    return useQuery({
      queryKey: ['event-registrations', eventId],
      queryFn: async () => {
        let query = supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .order('created_at', { ascending: false });

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as EventRegistration[];
      },
      enabled: isAdmin,
    });
  };

  const useCreateRegistration = () => {
    return useMutation({
      mutationFn: async (registration: Partial<EventRegistration> & { 
        eventTitle?: string;
        eventPrice?: number;
        isFree?: boolean;
      }) => {
        // 1. Criar registro no banco
        const { data, error } = await supabase
          .from('event_registrations')
          .insert({
            event_id: registration.event_id,
            full_name: registration.full_name || '',
            email: registration.email || '',
            status: registration.status || 'pending',
            phone: registration.phone,
            cpf: registration.cpf,
            cost_center_id: registration.cost_center_id,
            metadata: registration.metadata as any,
          })
          .select()
          .single();
        if (error) throw error;

        const registrationData = data as EventRegistration;

        // 2. Integrar com CRM (criar lead, interação e deal)
        try {
          const crmResult = await crmIntegration.processEventRegistration({
            fullName: registration.full_name || '',
            email: registration.email || '',
            phone: registration.phone,
            cpf: registration.cpf,
            eventTitle: registration.eventTitle || 'Evento',
            eventId: registration.event_id || '',
            eventPrice: registration.eventPrice || 0,
            isFree: registration.isFree ?? true,
            costCenterId: registration.cost_center_id,
          });

          // Atualizar registro com lead_id
          if (crmResult.leadId) {
            await supabase
              .from('event_registrations')
              .update({ lead_id: crmResult.leadId })
              .eq('id', registrationData.id);
          }
        } catch (crmError) {
          console.error('[useCreateRegistration] CRM integration failed:', crmError);
          // Não bloquear inscrição se CRM falhar
        }

        // 3. Enviar email de confirmação (não bloqueia se falhar)
        try {
          await crmIntegration.sendEventConfirmationEmail(registrationData.id);
        } catch (emailError) {
          console.error('[useCreateRegistration] Email sending failed:', emailError);
        }

        return registrationData;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      },
    });
  };

  const useUpdateRegistration = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<EventRegistration> & { id: string }) => {
        const { data, error } = await supabase
          .from('event_registrations')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as EventRegistration;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      },
    });
  };

  const useCheckIn = () => {
    return useMutation({
      mutationFn: async (registrationId: string) => {
        const { data, error } = await supabase
          .from('event_registrations')
          .update({ 
            checked_in_at: new Date().toISOString(),
            status: 'attended' 
          })
          .eq('id', registrationId)
          .select()
          .single();
        if (error) throw error;
        return data as EventRegistration;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      },
    });
  };

  // ==================== STATS ====================
  const useEventStats = () => {
    return useQuery({
      queryKey: ['event-stats'],
      queryFn: async () => {
        const { count: totalEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        const { count: upcomingEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('date_start', new Date().toISOString());

        const { count: totalRegistrations } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true });

        const { count: attendedRegistrations } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'attended');

        return {
          total_events: totalEvents || 0,
          upcoming_events: upcomingEvents || 0,
          total_registrations: totalRegistrations || 0,
          attended_registrations: attendedRegistrations || 0,
          attendance_rate: totalRegistrations && totalRegistrations > 0 
            ? ((attendedRegistrations || 0) / totalRegistrations) * 100 
            : 0,
        };
      },
      enabled: isAdmin,
    });
  };

  return {
    useEventsList,
    useEventById,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useEventRegistrations,
    useCreateRegistration,
    useUpdateRegistration,
    useCheckIn,
    useEventStats,
  };
};
