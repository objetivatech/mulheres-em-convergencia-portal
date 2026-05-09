import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { crmIntegration } from '@/hooks/useCRMIntegration';
import slugify from '@/lib/slugify';

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
  conecta_sync: boolean;
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
  batch_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

export interface EventTicketBatch {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number | null;
  sold_count: number;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
  active: boolean;
}

export const useEvents = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const normalizeEventPayload = (event: Partial<Event>) => {
    const normalizeNullableString = (v: unknown) =>
      typeof v === 'string' && v.trim() === '' ? null : v;

    const normalizeDateTime = (v: unknown) => {
      if (typeof v !== 'string') return v;
      if (v.trim() === '') return null;

      // Handle <input type="datetime-local"> values: 2026-01-03T15:30
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) {
        return new Date(v).toISOString();
      }

      return v;
    };

    return {
      ...event,
      description: normalizeNullableString(event.description),
      location: normalizeNullableString(event.location),
      location_url: normalizeNullableString(event.location_url),
      image_url: normalizeNullableString(event.image_url),
      instructor_name: normalizeNullableString(event.instructor_name),
      instructor_id: normalizeNullableString(event.instructor_id),
      registration_deadline: normalizeDateTime((event as any).registration_deadline),
      date_start: normalizeDateTime(event.date_start),
      date_end: normalizeDateTime(event.date_end),
    } as Partial<Event>;
  };

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
        const normalized = normalizeEventPayload(event);

        // Generate slug using slugify for proper handling of accents and special chars
        const baseSlug =
          normalized.slug ||
          slugify(normalized.title || 'evento', {
            lower: true,
            strict: true,
          });
        const slug = `${baseSlug}-${Date.now()}`;

        const insertPayload = {
          ...normalized,
          title: normalized.title || 'Novo Evento',
          slug,
          type: (normalized.type as any) || 'workshop',
          format: (normalized.format as any) || 'online',
          date_start: (normalized.date_start as any) || new Date().toISOString(),
          status: (normalized.status as any) || 'draft',
        };

        const { data, error } = await supabase
          .from('events')
          .insert(insertPayload as any)
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
        const normalizedUpdates = normalizeEventPayload(updates);

        const { data, error } = await supabase
          .from('events')
          .update(normalizedUpdates as any)
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
        // First get registration details for CRM interaction
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .eq('id', registrationId)
          .single();

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

        // Update deal stage to "participou" in CRM pipeline
        let leadId: string | null = null;
        try {
          const { data: deals } = await supabase
            .from('crm_deals')
            .select('id, lead_id')
            .eq('product_type', 'evento')
            .contains('metadata', { registration_id: registrationId });

          if (deals && deals.length > 0) {
            leadId = deals[0].lead_id;
            await supabase
              .from('crm_deals')
              .update({ stage: 'participou' })
              .eq('id', deals[0].id);
          }
        } catch (crmError) {
          console.error('[useCheckIn] Failed to update deal stage:', crmError);
        }

        // Register CRM interaction for check-in
        const event = regData?.event as any;
        try {
          await supabase
            .from('crm_interactions')
            .insert({
              lead_id: leadId || regData?.lead_id,
              user_id: regData?.user_id,
              cpf: regData?.cpf,
              interaction_type: 'event_check_in',
              channel: 'in_person',
              description: `Check-in realizado no evento: ${event?.title || 'Evento'}`,
              activity_name: event?.title,
              activity_paid: !event?.free,
              activity_online: event?.format === 'online',
              cost_center_id: event?.cost_center_id,
              metadata: {
                registration_id: registrationId,
                event_id: regData?.event_id,
                checked_in_at: new Date().toISOString(),
              },
            } as any);
        } catch (crmError) {
          console.error('[useCheckIn] Failed to create CRM interaction:', crmError);
        }

        return data as EventRegistration;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm-interactions'] });
      },
    });
  };

  const useRemoveRegistration = () => {
    return useMutation({
      mutationFn: async ({ registrationId, eventId }: { registrationId: string; eventId: string }) => {
        // First get registration details for CRM interaction
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .eq('id', registrationId)
          .single();

        const event = regData?.event as any;
        let leadId: string | null = regData?.lead_id || null;

        // 1. Delete associated deal (keep lead)
        try {
          const { data: deals } = await supabase
            .from('crm_deals')
            .select('id, lead_id')
            .eq('product_type', 'evento')
            .contains('metadata', { registration_id: registrationId });

          if (deals && deals.length > 0) {
            leadId = deals[0].lead_id || leadId;
            await supabase
              .from('crm_deals')
              .delete()
              .eq('id', deals[0].id);
          }
        } catch (crmError) {
          console.error('[useRemoveRegistration] Failed to delete deal:', crmError);
        }

        // 2. Register CRM interaction for removal (before deleting registration)
        try {
          await supabase
            .from('crm_interactions')
            .insert({
              lead_id: leadId,
              user_id: regData?.user_id,
              cpf: regData?.cpf,
              interaction_type: 'event_registration_removed',
              channel: 'admin',
              description: `Inscrição removida do evento: ${event?.title || 'Evento'}`,
              activity_name: event?.title,
              cost_center_id: event?.cost_center_id,
              metadata: {
                registration_id: registrationId,
                event_id: eventId,
                removed_at: new Date().toISOString(),
                participant_name: regData?.full_name,
                participant_email: regData?.email,
              },
            } as any);
        } catch (crmError) {
          console.error('[useRemoveRegistration] Failed to create CRM interaction:', crmError);
        }

        // 3. Delete registration
        const { error: regError } = await supabase
          .from('event_registrations')
          .delete()
          .eq('id', registrationId);
        
        if (regError) throw regError;

        // 4. Decrement participant count
        const { data: eventData } = await supabase
          .from('events')
          .select('current_participants')
          .eq('id', eventId)
          .single();

        if (eventData) {
          await supabase
            .from('events')
            .update({ current_participants: Math.max(0, (eventData.current_participants || 0) - 1) })
            .eq('id', eventId);
        }

        return { registrationId, eventId };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm-interactions'] });
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

  // ==================== SPEAKERS ====================
  const useEventSpeakers = (eventId?: string | null) => {
    return useQuery({
      queryKey: ['event-speakers', eventId],
      queryFn: async () => {
        if (!eventId) return [] as EventSpeaker[];
        const { data, error } = await supabase
          .from('event_speakers')
          .select('*')
          .eq('event_id', eventId)
          .order('display_order', { ascending: true });
        if (error) throw error;
        return (data || []) as EventSpeaker[];
      },
      enabled: !!eventId,
    });
  };

  const useUpsertSpeaker = () => {
    return useMutation({
      mutationFn: async (speaker: Partial<EventSpeaker> & { event_id: string; name: string }) => {
        const { data, error } = await supabase
          .from('event_speakers')
          .upsert(speaker as any)
          .select()
          .single();
        if (error) throw error;
        return data as EventSpeaker;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-speakers', data.event_id] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
    });
  };

  const useDeleteSpeaker = () => {
    return useMutation({
      mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
        const { error } = await supabase.from('event_speakers').delete().eq('id', id);
        if (error) throw error;
        return { id, eventId };
      },
      onSuccess: ({ eventId }) => {
        queryClient.invalidateQueries({ queryKey: ['event-speakers', eventId] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
    });
  };

  // ==================== BATCHES ====================
  const useEventBatches = (eventId?: string | null) => {
    return useQuery({
      queryKey: ['event-batches', eventId],
      queryFn: async () => {
        if (!eventId) return [] as EventTicketBatch[];
        const { data, error } = await supabase
          .from('event_ticket_batches')
          .select('*')
          .eq('event_id', eventId)
          .order('display_order', { ascending: true });
        if (error) throw error;
        return (data || []) as EventTicketBatch[];
      },
      enabled: !!eventId,
    });
  };

  const useUpsertBatch = () => {
    return useMutation({
      mutationFn: async (batch: Partial<EventTicketBatch> & { event_id: string; name: string; price: number }) => {
        const { data, error } = await supabase
          .from('event_ticket_batches')
          .upsert(batch as any)
          .select()
          .single();
        if (error) throw error;
        return data as EventTicketBatch;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-batches', data.event_id] });
      },
    });
  };

  const useDeleteBatch = () => {
    return useMutation({
      mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
        const { error } = await supabase.from('event_ticket_batches').delete().eq('id', id);
        if (error) throw error;
        return { id, eventId };
      },
      onSuccess: ({ eventId }) => {
        queryClient.invalidateQueries({ queryKey: ['event-batches', eventId] });
      },
    });
  };

  // ==================== MANUAL PARTICIPANT ====================
  const useAddManualParticipant = () => {
    return useMutation({
      mutationFn: async (params: {
        event_id: string;
        full_name: string;
        email: string;
        phone?: string | null;
        cpf?: string | null;
        paid: boolean;
        batch_id?: string | null;
        send_email?: boolean;
        eventTitle?: string;
        eventPrice?: number;
        isFree?: boolean;
        cost_center_id?: string | null;
        walk_in?: boolean;
      }) => {
        // 1. Create or find lead via CRM
        let leadId: string | null = null;
        try {
          leadId = await crmIntegration.findOrCreateLead({
            full_name: params.full_name,
            email: params.email,
            phone: params.phone,
            cpf: params.cpf,
            source: 'evento_manual',
            source_detail: params.eventTitle,
            cost_center_id: params.cost_center_id,
          });
        } catch (e) {
          console.error('[useAddManualParticipant] lead error', e);
        }

        // 2. Insert registration
        const { data: reg, error } = await supabase
          .from('event_registrations')
          .insert({
            event_id: params.event_id,
            full_name: params.full_name,
            email: params.email,
            phone: params.phone || null,
            cpf: params.cpf || null,
            paid: params.paid,
            status: params.walk_in ? 'attended' : 'confirmed',
            checked_in_at: params.walk_in ? new Date().toISOString() : null,
            batch_id: params.batch_id || null,
            payment_amount: params.eventPrice ?? null,
            cost_center_id: params.cost_center_id || null,
            lead_id: leadId,
            metadata: { added_manually: true, walk_in: !!params.walk_in },
          } as any)
          .select()
          .single();
        if (error) throw error;

        // 3. Log interaction
        if (leadId) {
          try {
            await crmIntegration.createInteraction({
              lead_id: leadId,
              interaction_type: 'event_registration_manual',
              channel: 'admin',
              description: `Inscrição manual no evento: ${params.eventTitle || 'Evento'}`,
              activity_name: params.eventTitle,
              cost_center_id: params.cost_center_id,
              metadata: { registration_id: (reg as any).id, paid: params.paid },
            });
          } catch (e) {
            console.error('[useAddManualParticipant] interaction error', e);
          }
        }

        // 4. Optional confirmation email
        if (params.send_email) {
          try {
            await crmIntegration.sendEventConfirmationEmail((reg as any).id);
          } catch (e) {
            console.error('[useAddManualParticipant] email error', e);
          }
        }

        return reg as EventRegistration;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      },
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
    useRemoveRegistration,
    useEventStats,
    useEventSpeakers,
    useUpsertSpeaker,
    useDeleteSpeaker,
    useEventBatches,
    useUpsertBatch,
    useDeleteBatch,
    useAddManualParticipant,
  };
};
