import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface CRMLead {
  id: string;
  cpf: string | null;
  email: string | null;
  full_name: string;
  phone: string | null;
  source: string;
  source_detail: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  first_activity_date: string | null;
  first_activity_type: string | null;
  first_activity_paid: boolean;
  first_activity_online: boolean;
  cost_center_id: string | null;
  assigned_to: string | null;
  converted_user_id: string | null;
  converted_at: string | null;
  score: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CRMInteraction {
  id: string;
  lead_id: string | null;
  user_id: string | null;
  cpf: string | null;
  interaction_type: string;
  channel: string | null;
  description: string | null;
  activity_name: string | null;
  activity_paid: boolean;
  activity_online: boolean;
  cost_center_id: string | null;
  form_source: string | null;
  performed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CRMDeal {
  id: string;
  lead_id: string | null;
  user_id: string | null;
  cpf: string | null;
  title: string;
  description: string | null;
  value: number;
  stage: string; // Dinâmico baseado no pipeline
  pipeline_id: string | null;
  cost_center_id: string | null;
  product_type: string | null;
  product_id: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  won: boolean | null;
  lost_reason: string | null;
  assigned_to: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CRMTag {
  id: string;
  name: string;
  color: string;
  category: string | null;
  description: string | null;
  created_at: string;
}

export interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  type: 'empresa' | 'associacao' | 'projeto';
  cnpj: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UnifiedContact {
  type: 'lead' | 'user';
  id: string;
  cpf: string | null;
  email: string | null;
  full_name: string;
  phone: string | null;
  source: string | null;
  status: string;
  created_at: string;
  interactions_count: number;
  deals_count: number;
  total_value: number;
  last_interaction_at: string | null;
  tags: string[];
}

export interface ContactProfile {
  contact: UnifiedContact;
  interactions: CRMInteraction[];
  deals: CRMDeal[];
  milestones: CRMConversionMilestone[];
}

export interface CRMConversionMilestone {
  id: string;
  cpf: string | null;
  user_id: string | null;
  email: string | null;
  milestone_type: string;
  milestone_name: string;
  milestone_date: string;
  activities_count: number;
  total_value: number;
  days_from_first_contact: number | null;
  cost_center_id: string | null;
  triggered_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CRMStats {
  total_leads: number;
  new_leads: number;
  converted_leads: number;
  total_deals: number;
  won_deals: number;
  total_value: number;
  conversion_rate: number;
}

// Hook principal
export const useCRM = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ==================== COST CENTERS ====================
  const useCostCenters = () => {
    return useQuery({
      queryKey: ['cost-centers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cost_centers')
          .select('*')
          .eq('active', true)
          .order('name');
        if (error) throw error;
        return data as CostCenter[];
      },
    });
  };

  // ==================== LEADS ====================
  const useLeads = (filters?: { 
    status?: string; 
    source?: string; 
    costCenterId?: string;
    search?: string;
  }) => {
    return useQuery({
      queryKey: ['crm-leads', filters],
      queryFn: async () => {
        let query = supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.source) {
          query = query.eq('source', filters.source);
        }
        if (filters?.costCenterId) {
          query = query.eq('cost_center_id', filters.costCenterId);
        }
        if (filters?.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CRMLead[];
      },
      enabled: isAdmin,
    });
  };

  const useLeadById = (leadId: string | null) => {
    return useQuery({
      queryKey: ['crm-lead', leadId],
      queryFn: async () => {
        if (!leadId) return null;
        const { data, error } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('id', leadId)
          .single();
        if (error) throw error;
        return data as CRMLead;
      },
      enabled: !!leadId && isAdmin,
    });
  };

  const useLeadByCpf = (cpf: string | null) => {
    return useQuery({
      queryKey: ['crm-lead-cpf', cpf],
      queryFn: async () => {
        if (!cpf) return null;
        const { data, error } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('cpf', cpf)
          .maybeSingle();
        if (error) throw error;
        return data as CRMLead | null;
      },
      enabled: !!cpf && isAdmin,
    });
  };

  const useCreateLead = () => {
    return useMutation({
      mutationFn: async (lead: Omit<Partial<CRMLead>, 'metadata'> & { metadata?: Record<string, unknown> }) => {
        const insertData = {
          full_name: lead.full_name || '',
          source: lead.source || 'website',
          ...lead,
        };
        const { data, error } = await supabase
          .from('crm_leads')
          .insert(insertData as any)
          .select()
          .single();
        if (error) throw error;
        return data as CRMLead;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  const useUpdateLead = () => {
    return useMutation({
      mutationFn: async ({ id, metadata, ...updates }: Partial<CRMLead> & { id: string }) => {
        const { data, error } = await supabase
          .from('crm_leads')
          .update({
            ...updates,
            metadata: metadata as any,
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as CRMLead;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        queryClient.invalidateQueries({ queryKey: ['crm-lead', data.id] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  const useDeleteLead = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('crm_leads')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  // ==================== INTERACTIONS ====================
  const useInteractions = (filters?: {
    leadId?: string;
    userId?: string;
    cpf?: string;
    type?: string;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ['crm-interactions', filters],
      queryFn: async () => {
        let query = supabase
          .from('crm_interactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.leadId) {
          query = query.eq('lead_id', filters.leadId);
        }
        if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
        }
        if (filters?.cpf) {
          query = query.eq('cpf', filters.cpf);
        }
        if (filters?.type) {
          query = query.eq('interaction_type', filters.type);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CRMInteraction[];
      },
      enabled: isAdmin,
    });
  };

  const useCreateInteraction = () => {
    return useMutation({
      mutationFn: async (interaction: Omit<Partial<CRMInteraction>, 'metadata'> & { metadata?: Record<string, unknown> }) => {
        const insertData = {
          interaction_type: interaction.interaction_type || 'other',
          ...interaction,
        };
        const { data, error } = await supabase
          .from('crm_interactions')
          .insert(insertData as any)
          .select()
          .single();
        if (error) throw error;
        return data as CRMInteraction;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-interactions'] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  // ==================== DEALS ====================
  const useDeals = (filters?: {
    stage?: string;
    costCenterId?: string;
    assignedTo?: string;
  }) => {
    return useQuery({
      queryKey: ['crm-deals', filters],
      queryFn: async () => {
        let query = supabase
          .from('crm_deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.stage) {
          query = query.eq('stage', filters.stage);
        }
        if (filters?.costCenterId) {
          query = query.eq('cost_center_id', filters.costCenterId);
        }
        if (filters?.assignedTo) {
          query = query.eq('assigned_to', filters.assignedTo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CRMDeal[];
      },
      enabled: isAdmin,
    });
  };

  const useDealById = (dealId: string | null) => {
    return useQuery({
      queryKey: ['crm-deal', dealId],
      queryFn: async () => {
        if (!dealId) return null;
        const { data, error } = await supabase
          .from('crm_deals')
          .select('*')
          .eq('id', dealId)
          .single();
        if (error) throw error;
        return data as CRMDeal;
      },
      enabled: !!dealId && isAdmin,
    });
  };

  const useCreateDeal = () => {
    return useMutation({
      mutationFn: async (deal: Omit<Partial<CRMDeal>, 'metadata'> & { metadata?: Record<string, unknown> }) => {
        const insertData = {
          title: deal.title || 'Novo negócio',
          ...deal,
        };
        const { data, error } = await supabase
          .from('crm_deals')
          .insert(insertData as any)
          .select()
          .single();
        if (error) throw error;
        return data as CRMDeal;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  const useUpdateDeal = () => {
    return useMutation({
      mutationFn: async ({ id, metadata, ...updates }: Partial<CRMDeal> & { id: string }) => {
        const { data, error } = await supabase
          .from('crm_deals')
          .update({
            ...updates,
            metadata: metadata as any,
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as CRMDeal;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm-deal', data.id] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  const useDeleteDeal = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('crm_deals')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      },
    });
  };

  // ==================== TAGS ====================
  const useTags = (category?: string) => {
    return useQuery({
      queryKey: ['crm-tags', category],
      queryFn: async () => {
        let query = supabase
          .from('crm_tags')
          .select('*')
          .order('name');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CRMTag[];
      },
    });
  };

  const useCreateTag = () => {
    return useMutation({
      mutationFn: async (tag: { name: string; color?: string; category?: string; description?: string }) => {
        const { data, error } = await supabase
          .from('crm_tags')
          .insert(tag)
          .select()
          .single();
        if (error) throw error;
        return data as CRMTag;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-tags'] });
      },
    });
  };

  // ==================== UNIFIED CONTACTS ====================
  const useUnifiedContacts = (search?: string) => {
    return useQuery({
      queryKey: ['crm-unified-contacts', search],
      queryFn: async () => {
        // Buscar leads
        let leadsQuery = supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (search) {
          leadsQuery = leadsQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        const { data: leads, error: leadsError } = await leadsQuery;
        if (leadsError) throw leadsError;

        // Buscar usuários (profiles) - TODOS os perfis
        let profilesQuery = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (search) {
          profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        const { data: profiles, error: profilesError } = await profilesQuery;
        if (profilesError) throw profilesError;

        // Buscar contagens de interações e deals em batch
        const { data: interactionCounts } = await supabase
          .from('crm_interactions')
          .select('lead_id, user_id');
        
        const { data: dealCounts } = await supabase
          .from('crm_deals')
          .select('lead_id, user_id, value');

        // Mapear contagens
        const leadInteractions = new Map<string, number>();
        const userInteractions = new Map<string, number>();
        const leadDeals = new Map<string, { count: number; value: number }>();
        const userDeals = new Map<string, { count: number; value: number }>();

        interactionCounts?.forEach(i => {
          if (i.lead_id) leadInteractions.set(i.lead_id, (leadInteractions.get(i.lead_id) || 0) + 1);
          if (i.user_id) userInteractions.set(i.user_id, (userInteractions.get(i.user_id) || 0) + 1);
        });

        dealCounts?.forEach(d => {
          if (d.lead_id) {
            const current = leadDeals.get(d.lead_id) || { count: 0, value: 0 };
            leadDeals.set(d.lead_id, { count: current.count + 1, value: current.value + (d.value || 0) });
          }
          if (d.user_id) {
            const current = userDeals.get(d.user_id) || { count: 0, value: 0 };
            userDeals.set(d.user_id, { count: current.count + 1, value: current.value + (d.value || 0) });
          }
        });

        // Combinar em contatos unificados
        const contacts: UnifiedContact[] = [];
        
        // Map para rastrear usuários convertidos de leads (por user_id)
        const convertedUserIds = new Set((leads || []).filter(l => l.converted_user_id).map(l => l.converted_user_id));

        // Adicionar leads
        for (const lead of leads || []) {
          const dealData = leadDeals.get(lead.id) || { count: 0, value: 0 };
          contacts.push({
            type: 'lead',
            id: lead.id,
            cpf: lead.cpf,
            email: lead.email,
            full_name: lead.full_name,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            created_at: lead.created_at,
            interactions_count: leadInteractions.get(lead.id) || 0,
            deals_count: dealData.count,
            total_value: dealData.value,
            last_interaction_at: null,
            tags: lead.tags || [],
          });
        }

        // Adicionar TODOS os usuários (excluindo apenas os que já foram convertidos de leads pelo user_id)
        for (const profile of profiles || []) {
          // Só exclui se o perfil for de um lead convertido
          if (!convertedUserIds.has(profile.id)) {
            const dealData = userDeals.get(profile.id) || { count: 0, value: 0 };
            contacts.push({
              type: 'user',
              id: profile.id,
              cpf: profile.cpf,
              email: profile.email,
              full_name: profile.full_name || 'Sem nome',
              phone: profile.phone,
              source: 'cadastro',
              status: 'active',
              created_at: profile.created_at,
              interactions_count: userInteractions.get(profile.id) || 0,
              deals_count: dealData.count,
              total_value: dealData.value,
              last_interaction_at: null,
              tags: [],
            });
          }
        }

        return contacts;
      },
      enabled: isAdmin,
    });
  };

  // ==================== CONTACT PROFILE ====================
  const useContactProfile = (contactId: string | null, contactType: 'lead' | 'user' | null) => {
    return useQuery({
      queryKey: ['crm-contact-profile', contactId, contactType],
      queryFn: async () => {
        if (!contactId || !contactType) return null;

        let contact: UnifiedContact | null = null;
        let cpf: string | null = null;

        if (contactType === 'lead') {
          const { data: lead, error } = await supabase
            .from('crm_leads')
            .select('*')
            .eq('id', contactId)
            .single();
          if (error) throw error;
          
          cpf = lead.cpf;
          contact = {
            type: 'lead',
            id: lead.id,
            cpf: lead.cpf,
            email: lead.email,
            full_name: lead.full_name,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            created_at: lead.created_at,
            interactions_count: 0,
            deals_count: 0,
            total_value: 0,
            last_interaction_at: null,
            tags: lead.tags || [],
          };
        } else {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', contactId)
            .single();
          if (error) throw error;
          
          cpf = profile.cpf;
          contact = {
            type: 'user',
            id: profile.id,
            cpf: profile.cpf,
            email: profile.email,
            full_name: profile.full_name || 'Sem nome',
            phone: profile.phone,
            source: 'cadastro',
            status: 'active',
            created_at: profile.created_at,
            interactions_count: 0,
            deals_count: 0,
            total_value: 0,
            last_interaction_at: null,
            tags: [],
          };
        }

        // Buscar interações
        let interactionsQuery = supabase
          .from('crm_interactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactType === 'lead') {
          interactionsQuery = interactionsQuery.eq('lead_id', contactId);
        } else {
          interactionsQuery = interactionsQuery.eq('user_id', contactId);
        }

        const { data: interactions, error: intError } = await interactionsQuery;
        if (intError) throw intError;

        // Buscar deals
        let dealsQuery = supabase
          .from('crm_deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactType === 'lead') {
          dealsQuery = dealsQuery.eq('lead_id', contactId);
        } else {
          dealsQuery = dealsQuery.eq('user_id', contactId);
        }

        const { data: deals, error: dealsError } = await dealsQuery;
        if (dealsError) throw dealsError;

        // Buscar milestones
        let milestonesQuery = supabase
          .from('crm_conversion_milestones')
          .select('*')
          .order('milestone_date', { ascending: false });

        if (cpf) {
          milestonesQuery = milestonesQuery.eq('cpf', cpf);
        } else if (contactType === 'user') {
          milestonesQuery = milestonesQuery.eq('user_id', contactId);
        }

        const { data: milestones, error: milestonesError } = await milestonesQuery;
        if (milestonesError) throw milestonesError;

        // Atualizar contadores
        contact.interactions_count = interactions?.length || 0;
        contact.deals_count = deals?.length || 0;
        contact.total_value = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
        contact.last_interaction_at = interactions?.[0]?.created_at || null;

        return {
          contact,
          interactions: interactions || [],
          deals: deals || [],
          milestones: milestones || [],
        } as ContactProfile;
      },
      enabled: !!contactId && !!contactType && isAdmin,
    });
  };

  // ==================== STATS ====================
  const useCRMStats = () => {
    return useQuery({
      queryKey: ['crm-stats'],
      queryFn: async () => {
        // Contar leads
        const { count: totalLeads } = await supabase
          .from('crm_leads')
          .select('*', { count: 'exact', head: true });

        const { count: newLeads } = await supabase
          .from('crm_leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');

        const { count: convertedLeads } = await supabase
          .from('crm_leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'converted');

        // Contar deals
        const { count: totalDeals } = await supabase
          .from('crm_deals')
          .select('*', { count: 'exact', head: true });

        const { data: wonDealsData } = await supabase
          .from('crm_deals')
          .select('value')
          .eq('stage', 'won');

        const wonDeals = wonDealsData?.length || 0;
        const totalValue = wonDealsData?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

        const conversionRate = totalLeads && totalLeads > 0 
          ? ((convertedLeads || 0) / totalLeads) * 100 
          : 0;

        return {
          total_leads: totalLeads || 0,
          new_leads: newLeads || 0,
          converted_leads: convertedLeads || 0,
          total_deals: totalDeals || 0,
          won_deals: wonDeals,
          total_value: totalValue,
          conversion_rate: conversionRate,
        } as CRMStats;
      },
      enabled: isAdmin,
    });
  };

  // ==================== CHART DATA ====================
  const useLeadsBySource = () => {
    return useQuery({
      queryKey: ['crm-leads-by-source'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('crm_leads')
          .select('source');
        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach((lead) => {
          const source = lead.source || 'outros';
          counts[source] = (counts[source] || 0) + 1;
        });

        const sourceLabels: Record<string, string> = {
          website: 'Website',
          evento: 'Eventos',
          landing_page: 'Landing Page',
          indicacao: 'Indicação',
          social: 'Redes Sociais',
          outros: 'Outros',
        };

        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];
        
        return Object.entries(counts).map(([source, count], idx) => ({
          name: sourceLabels[source] || source,
          value: count,
          fill: colors[idx % colors.length],
        }));
      },
      enabled: isAdmin,
    });
  };

  const useDealsByStage = () => {
    return useQuery({
      queryKey: ['crm-deals-by-stage'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('crm_deals')
          .select('stage, value');
        if (error) throw error;

        const stageData: Record<string, { count: number; value: number }> = {};
        data?.forEach((deal) => {
          const stage = deal.stage || 'novo';
          if (!stageData[stage]) stageData[stage] = { count: 0, value: 0 };
          stageData[stage].count += 1;
          stageData[stage].value += deal.value || 0;
        });

        const stageLabels: Record<string, string> = {
          inscrito: 'Inscritos',
          novo: 'Novos',
          contacted: 'Contatados',
          qualified: 'Qualificados',
          proposal: 'Propostas',
          negotiation: 'Negociação',
          won: 'Ganhos',
          lost: 'Perdidos',
        };

        const stageOrder = ['inscrito', 'novo', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        
        return stageOrder
          .filter(stage => stageData[stage])
          .map((stage, idx) => ({
            stage: stageLabels[stage] || stage,
            value: stageData[stage].count,
            totalValue: stageData[stage].value,
            fill: `hsl(var(--chart-${(idx % 5) + 1}))`,
          }));
      },
      enabled: isAdmin,
    });
  };

  const useMonthlyLeads = () => {
    return useQuery({
      queryKey: ['crm-monthly-leads'],
      queryFn: async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data, error } = await supabase
          .from('crm_leads')
          .select('created_at, status')
          .gte('created_at', sixMonthsAgo.toISOString());
        if (error) throw error;

        const monthlyData: Record<string, { leads: number; converted: number }> = {};
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Inicializar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[key] = { leads: 0, converted: 0 };
        }

        data?.forEach((lead) => {
          const date = new Date(lead.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyData[key]) {
            monthlyData[key].leads += 1;
            if (lead.status === 'converted') {
              monthlyData[key].converted += 1;
            }
          }
        });

        return Object.entries(monthlyData).map(([key, data]) => {
          const [year, month] = key.split('-');
          return {
            month: monthNames[parseInt(month) - 1],
            leads: data.leads,
            converted: data.converted,
          };
        });
      },
      enabled: isAdmin,
    });
  };

  const useEventRegistrationStats = () => {
    return useQuery({
      queryKey: ['crm-event-stats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('event_registrations')
          .select('status, payment_amount');
        if (error) throw error;

        const total = data?.length || 0;
        const confirmed = data?.filter(r => r.status === 'confirmed').length || 0;
        const totalRevenue = data?.reduce((sum, r) => sum + (r.payment_amount || 0), 0) || 0;

        return { total, confirmed, totalRevenue };
      },
      enabled: isAdmin,
    });
  };

  const useDonationStats = () => {
    return useQuery({
      queryKey: ['crm-donation-stats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('donations')
          .select('amount, status');
        if (error) throw error;

        const completed = data?.filter(d => d.status === 'completed') || [];
        const totalAmount = completed.reduce((sum, d) => sum + (d.amount || 0), 0);

        return { total: completed.length, totalAmount };
      },
      enabled: isAdmin,
    });
  };

  return {
    // Cost Centers
    useCostCenters,
    // Leads
    useLeads,
    useLeadById,
    useLeadByCpf,
    useCreateLead,
    useUpdateLead,
    useDeleteLead,
    // Interactions
    useInteractions,
    useCreateInteraction,
    // Deals
    useDeals,
    useDealById,
    useCreateDeal,
    useUpdateDeal,
    useDeleteDeal,
    // Tags
    useTags,
    useCreateTag,
    // Unified
    useUnifiedContacts,
    useContactProfile,
    // Stats
    useCRMStats,
    // Chart Data
    useLeadsBySource,
    useDealsByStage,
    useMonthlyLeads,
    useEventRegistrationStats,
    useDonationStats,
  };
};
