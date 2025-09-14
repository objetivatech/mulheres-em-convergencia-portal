import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export interface UserContact {
  id: string;
  contact_type: 'email' | 'phone' | 'whatsapp';
  contact_value: string;
  is_primary: boolean;
  verified: boolean;
  created_at: string;
}

export interface UserAddress {
  id: string;
  address_type: 'residential' | 'commercial' | 'billing' | 'shipping';
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  created_at: string;
}

export interface CpfUserData {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  created_at: string;
}

// Utilitários para validação e formatação de CPF
export const cpfUtils = {
  // Remove formatação do CPF
  clean: (cpf: string): string => {
    return cpf.replace(/[^\d]/g, '');
  },
  
  // Formata CPF para exibição
  format: (cpf: string): string => {
    const cleaned = cpfUtils.clean(cpf);
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  // Valida CPF (apenas formato básico - validação completa no backend)
  isValidFormat: (cpf: string): boolean => {
    const cleaned = cpfUtils.clean(cpf);
    return cleaned.length === 11 && /^\d{11}$/.test(cleaned);
  },
  
  // Máscara de entrada para CPF
  applyMask: (value: string): string => {
    const cleaned = cpfUtils.clean(value);
    let masked = cleaned;
    
    if (cleaned.length > 3) {
      masked = cleaned.slice(0, 3) + '.' + cleaned.slice(3);
    }
    if (cleaned.length > 6) {
      masked = masked.slice(0, 7) + '.' + masked.slice(7);
    }
    if (cleaned.length > 9) {
      masked = masked.slice(0, 11) + '-' + masked.slice(11);
    }
    
    return masked.slice(0, 14); // Limita ao tamanho máximo
  }
};

export const useCpfSystem = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Buscar usuário por CPF
  const useUserByCpf = (cpf?: string) => {
    return useQuery({
      queryKey: ['user-by-cpf', cpf],
      queryFn: async () => {
        if (!cpf || !cpfUtils.isValidFormat(cpf)) return null;
        
        const { data, error } = await supabase.rpc('get_user_by_cpf', {
          cpf_input: cpf
        });
        
        if (error) throw error;
        return data?.[0] as CpfUserData || null;
      },
      enabled: !!cpf && cpfUtils.isValidFormat(cpf),
    });
  };

  // Buscar contatos do usuário
  const useUserContacts = (userId?: string) => {
    return useQuery({
      queryKey: ['user-contacts', userId],
      queryFn: async () => {
        if (!userId) return [];
        
        const { data, error } = await supabase
          .from('user_contacts')
          .select('*')
          .eq('user_id', userId)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data as UserContact[];
      },
      enabled: !!userId,
    });
  };

  // Buscar endereços do usuário
  const useUserAddresses = (userId?: string) => {
    return useQuery({
      queryKey: ['user-addresses', userId],
      queryFn: async () => {
        if (!userId) return [];
        
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data as UserAddress[];
      },
      enabled: !!userId,
    });
  };

  // Criar ou atualizar usuário por CPF
  const useUpsertUserByCpf = () => {
    return useMutation({
      mutationFn: async ({
        cpf,
        email,
        fullName,
        phone
      }: {
        cpf: string;
        email?: string;
        fullName?: string;
        phone?: string;
      }) => {
        const { data, error } = await supabase.rpc('upsert_user_by_cpf', {
          cpf_input: cpf,
          user_email: email,
          user_full_name: fullName,
          user_phone: phone
        });
        
        if (error) throw error;
        return data as string; // Retorna o user_id
      },
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['user-by-cpf'] });
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Adicionar contato
  const useAddContact = () => {
    return useMutation({
      mutationFn: async ({
        userId,
        contactType,
        contactValue,
        isPrimary = false
      }: {
        userId: string;
        contactType: 'email' | 'phone' | 'whatsapp';
        contactValue: string;
        isPrimary?: boolean;
      }) => {
        const { data, error } = await supabase
          .from('user_contacts')
          .upsert({
            user_id: userId,
            contact_type: contactType,
            contact_value: contactValue,
            is_primary: isPrimary
          }, {
            onConflict: 'user_id,contact_type,contact_value'
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['user-contacts', variables.userId] });
      },
    });
  };

  // Atualizar contato
  const useUpdateContact = () => {
    return useMutation({
      mutationFn: async ({
        contactId,
        contactValue,
        isPrimary
      }: {
        contactId: string;
        contactValue?: string;
        isPrimary?: boolean;
      }) => {
        const updateData: any = {};
        if (contactValue !== undefined) updateData.contact_value = contactValue;
        if (isPrimary !== undefined) updateData.is_primary = isPrimary;
        
        const { data, error } = await supabase
          .from('user_contacts')
          .update(updateData)
          .eq('id', contactId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['user-contacts', data.user_id] });
      },
    });
  };

  // Remover contato
  const useRemoveContact = () => {
    return useMutation({
      mutationFn: async (contactId: string) => {
        const { error } = await supabase
          .from('user_contacts')
          .delete()
          .eq('id', contactId);
        
        if (error) throw error;
      },
      onSuccess: (_, contactId) => {
        queryClient.invalidateQueries({ queryKey: ['user-contacts'] });
      },
    });
  };

  // Adicionar endereço
  const useAddAddress = () => {
    return useMutation({
      mutationFn: async ({
        userId,
        addressType,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        postalCode,
        country = 'Brasil',
        isPrimary = false
      }: {
        userId: string;
        addressType: 'residential' | 'commercial' | 'billing' | 'shipping';
        street: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city: string;
        state: string;
        postalCode?: string;
        country?: string;
        isPrimary?: boolean;
      }) => {
        const { data, error } = await supabase
          .from('user_addresses')
          .insert({
            user_id: userId,
            address_type: addressType,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            postal_code: postalCode,
            country,
            is_primary: isPrimary
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['user-addresses', variables.userId] });
      },
    });
  };

  // Atualizar endereço
  const useUpdateAddress = () => {
    return useMutation({
      mutationFn: async ({
        addressId,
        ...updateData
      }: {
        addressId: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        isPrimary?: boolean;
      }) => {
        const { data, error } = await supabase
          .from('user_addresses')
          .update(updateData)
          .eq('id', addressId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['user-addresses', data.user_id] });
      },
    });
  };

  // Remover endereço
  const useRemoveAddress = () => {
    return useMutation({
      mutationFn: async (addressId: string) => {
        const { error } = await supabase
          .from('user_addresses')
          .delete()
          .eq('id', addressId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      },
    });
  };

  return {
    // Utilitários
    cpfUtils,
    
    // Queries
    useUserByCpf,
    useUserContacts,
    useUserAddresses,
    
    // Mutations
    useUpsertUserByCpf,
    useAddContact,
    useUpdateContact,
    useRemoveContact,
    useAddAddress,
    useUpdateAddress,
    useRemoveAddress,
  };
};