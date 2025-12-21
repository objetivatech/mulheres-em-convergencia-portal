import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EventFormField {
  id: string;
  event_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'email' | 'phone' | 'cpf' | 'select' | 'checkbox' | 'textarea' | 'number';
  required: boolean;
  options: string[] | null;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEventFormFields = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch form fields for an event
  const useFormFields = (eventId: string | null) => {
    return useQuery({
      queryKey: ['event-form-fields', eventId],
      queryFn: async () => {
        if (!eventId) return [];
        console.log('[useFormFields] Buscando campos para evento:', eventId);
        const { data, error } = await supabase
          .from('event_form_fields')
          .select('*')
          .eq('event_id', eventId)
          .eq('active', true)
          .order('order_index', { ascending: true });
        if (error) {
          console.error('[useFormFields] Erro ao buscar campos:', error);
          throw error;
        }
        console.log('[useFormFields] Campos encontrados:', data?.length || 0);
        return data as EventFormField[];
      },
      enabled: !!eventId,
    });
  };

  // Create a new form field
  const useCreateFormField = () => {
    return useMutation({
      mutationFn: async (field: Partial<EventFormField>) => {
        console.log('[useCreateFormField] Criando campo para evento:', field.event_id);
        
        // Get the max order_index for this event
        const { data: existing, error: orderError } = await supabase
          .from('event_form_fields')
          .select('order_index')
          .eq('event_id', field.event_id)
          .order('order_index', { ascending: false })
          .limit(1);
        
        if (orderError) {
          console.error('[useCreateFormField] Erro ao buscar order_index:', orderError);
        }
        
        const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 0;
        console.log('[useCreateFormField] Próximo order_index:', nextOrder);
        
        const insertData = {
          event_id: field.event_id,
          field_name: field.field_name || `field_${Date.now()}`,
          field_label: field.field_label || 'Novo Campo',
          field_type: field.field_type || 'text',
          required: field.required ?? false,
          options: field.options || null,
          order_index: nextOrder,
          active: true,
        };
        
        console.log('[useCreateFormField] Dados a inserir:', insertData);
        
        const { data, error } = await supabase
          .from('event_form_fields')
          .insert(insertData as any)
          .select()
          .single();
        
        if (error) {
          console.error('[useCreateFormField] Erro RLS/insert:', error);
          throw error;
        }
        
        console.log('[useCreateFormField] Campo criado com sucesso:', data);
        return data as EventFormField;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-form-fields', data.event_id] });
      },
    });
  };

  // Update a form field
  const useUpdateFormField = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<EventFormField> & { id: string }) => {
        const { data, error } = await supabase
          .from('event_form_fields')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as EventFormField;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-form-fields', data.event_id] });
      },
    });
  };

  // Delete a form field (soft delete)
  const useDeleteFormField = () => {
    return useMutation({
      mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
        const { error } = await supabase
          .from('event_form_fields')
          .update({ active: false })
          .eq('id', id);
        if (error) throw error;
        return { id, eventId };
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-form-fields', data.eventId] });
      },
    });
  };

  // Reorder form fields
  const useReorderFormFields = () => {
    return useMutation({
      mutationFn: async ({ eventId, fieldIds }: { eventId: string; fieldIds: string[] }) => {
        // Update each field with its new order
        const updates = fieldIds.map((id, index) => 
          supabase
            .from('event_form_fields')
            .update({ order_index: index })
            .eq('id', id)
        );
        
        await Promise.all(updates);
        return { eventId };
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-form-fields', data.eventId] });
      },
    });
  };

  // Duplicate fields from another event
  const useDuplicateFormFromEvent = () => {
    return useMutation({
      mutationFn: async ({ sourceEventId, targetEventId }: { sourceEventId: string; targetEventId: string }) => {
        // Get source event fields
        const { data: sourceFields, error: sourceError } = await supabase
          .from('event_form_fields')
          .select('*')
          .eq('event_id', sourceEventId)
          .eq('active', true)
          .order('order_index', { ascending: true });
        
        if (sourceError) throw sourceError;
        if (!sourceFields || sourceFields.length === 0) return { count: 0, targetEventId };

        // Create copies for target event
        const newFields = sourceFields.map((field, index) => ({
          event_id: targetEventId,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          required: field.required,
          options: field.options,
          order_index: index,
          active: true,
        }));

        const { error: insertError } = await supabase
          .from('event_form_fields')
          .insert(newFields as any);
        
        if (insertError) throw insertError;
        return { count: sourceFields.length, targetEventId };
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['event-form-fields', data.targetEventId] });
      },
    });
  };

  return {
    useFormFields,
    useCreateFormField,
    useUpdateFormField,
    useDeleteFormField,
    useReorderFormFields,
    useDuplicateFormFromEvent,
  };
};
