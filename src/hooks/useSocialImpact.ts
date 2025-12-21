import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SocialImpactMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string | null;
  period_start: string;
  period_end: string;
  cost_center_id: string | null;
  project: string | null;
  region: string | null;
  demographic: Record<string, unknown>;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  source: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyByPerson {
  cpf: string | null;
  email: string | null;
  full_name: string;
  user_id: string | null;
  first_contact_date: string;
  total_interactions: number;
  total_events_attended: number;
  total_donations: number;
  total_value_paid: number;
  is_converted: boolean;
  conversion_date: string | null;
  days_to_conversion: number | null;
  activities: {
    type: string;
    name: string;
    date: string;
    paid: boolean;
    online: boolean;
    value: number | null;
  }[];
}

export interface ImpactStats {
  total_beneficiaries: number;
  total_events: number;
  total_donations_value: number;
  total_sponsors: number;
  active_leads: number;
  converted_leads: number;
  conversion_rate: number;
  avg_days_to_conversion: number;
}

export const useSocialImpact = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ==================== METRICS ====================
  const useMetricsList = (filters?: {
    metric_type?: string;
    cost_center_id?: string;
    verified?: boolean;
    period_start?: string;
    period_end?: string;
  }) => {
    return useQuery({
      queryKey: ['social-impact-metrics', filters],
      queryFn: async () => {
        let query = supabase
          .from('social_impact_metrics')
          .select('*')
          .order('period_end', { ascending: false });

        if (filters?.metric_type) {
          query = query.eq('metric_type', filters.metric_type);
        }
        if (filters?.cost_center_id) {
          query = query.eq('cost_center_id', filters.cost_center_id);
        }
        if (filters?.verified !== undefined) {
          query = query.eq('verified', filters.verified);
        }
        if (filters?.period_start) {
          query = query.gte('period_start', filters.period_start);
        }
        if (filters?.period_end) {
          query = query.lte('period_end', filters.period_end);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as SocialImpactMetric[];
      },
    });
  };

  const useCreateMetric = () => {
    return useMutation({
      mutationFn: async (metric: Partial<SocialImpactMetric>) => {
        const { data, error } = await supabase
          .from('social_impact_metrics')
          .insert(metric as any)
          .select()
          .single();
        if (error) throw error;
        return data as SocialImpactMetric;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['social-impact-metrics'] });
      },
    });
  };

  const useUpdateMetric = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<SocialImpactMetric> & { id: string }) => {
        const { data, error } = await supabase
          .from('social_impact_metrics')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as SocialImpactMetric;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['social-impact-metrics'] });
      },
    });
  };

  const useVerifyMetric = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('social_impact_metrics')
          .update({
            verified: true,
            verified_by: user?.id,
            verified_at: new Date().toISOString(),
          } as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as SocialImpactMetric;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['social-impact-metrics'] });
      },
    });
  };

  // ==================== JOURNEY BY CPF ====================
  const useJourneyByCPF = (cpf: string | null) => {
    return useQuery({
      queryKey: ['journey-cpf', cpf],
      queryFn: async () => {
        if (!cpf) return null;

        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .eq('cpf', cpf)
          .maybeSingle();

        // Get lead info
        const { data: lead } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('cpf', cpf)
          .maybeSingle();

        // Get all interactions
        const { data: interactions } = await supabase
          .from('crm_interactions')
          .select('*')
          .eq('cpf', cpf)
          .order('created_at', { ascending: true });

        // Get event registrations
        const { data: eventRegs } = await supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .eq('cpf', cpf);

        // Get donations
        const { data: donations } = await supabase
          .from('donations')
          .select('*')
          .eq('cpf', cpf);

        // Get milestones
        const { data: milestones } = await supabase
          .from('crm_conversion_milestones')
          .select('*')
          .eq('cpf', cpf)
          .order('milestone_date', { ascending: true });

        // Build activities timeline
        const activities: JourneyByPerson['activities'] = [];

        interactions?.forEach(i => {
          activities.push({
            type: 'interaction',
            name: i.activity_name || i.interaction_type,
            date: i.created_at,
            paid: i.activity_paid || false,
            online: i.activity_online || false,
            value: null,
          });
        });

        eventRegs?.forEach(r => {
          activities.push({
            type: 'event',
            name: (r.event as any)?.title || 'Evento',
            date: r.created_at,
            paid: r.paid || false,
            online: (r.event as any)?.format === 'online',
            value: r.payment_amount,
          });
        });

        donations?.forEach(d => {
          activities.push({
            type: 'donation',
            name: d.project || 'Doação',
            date: d.created_at,
            paid: true,
            online: true,
            value: d.amount,
          });
        });

        // Sort by date
        activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const firstContactDate = activities[0]?.date || lead?.created_at || profile?.created_at;
        const isConverted = !!profile || lead?.status === 'converted';
        const conversionMilestone = milestones?.find(m => m.milestone_type === 'conversion');

        const journey: JourneyByPerson = {
          cpf,
          email: profile?.email || lead?.email || null,
          full_name: profile?.full_name || lead?.full_name || 'Desconhecido',
          user_id: profile?.id || null,
          first_contact_date: firstContactDate || new Date().toISOString(),
          total_interactions: interactions?.length || 0,
          total_events_attended: eventRegs?.filter(r => r.status === 'attended').length || 0,
          total_donations: donations?.length || 0,
          total_value_paid: 
            (eventRegs?.reduce((sum, r) => sum + (r.payment_amount || 0), 0) || 0) +
            (donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0),
          is_converted: isConverted,
          conversion_date: conversionMilestone?.milestone_date || null,
          days_to_conversion: conversionMilestone?.days_from_first_contact || null,
          activities,
        };

        return journey;
      },
      enabled: !!cpf && isAdmin,
    });
  };

  // ==================== IMPACT STATS ====================
  const useImpactStats = () => {
    return useQuery({
      queryKey: ['impact-stats'],
      queryFn: async () => {
        // Get total beneficiaries (unique CPFs across all tables)
        const { count: leadsCount } = await supabase
          .from('crm_leads')
          .select('*', { count: 'exact', head: true });

        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get events stats
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        // Get donations total
        const { data: donations } = await supabase
          .from('donations')
          .select('amount')
          .eq('status', 'completed');
        const totalDonations = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

        // Get sponsors
        const { count: sponsorsCount } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get conversion stats
        const { data: leads } = await supabase
          .from('crm_leads')
          .select('status, created_at, converted_at');

        const activeLeads = leads?.filter(l => l.status !== 'converted' && l.status !== 'lost').length || 0;
        const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
        const conversionRate = leads?.length ? (convertedLeads / leads.length) * 100 : 0;

        // Calculate average days to conversion
        const conversions = leads?.filter(l => l.converted_at);
        const avgDays = conversions?.length
          ? conversions.reduce((sum, l) => {
              const start = new Date(l.created_at);
              const end = new Date(l.converted_at!);
              return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / conversions.length
          : 0;

        const stats: ImpactStats = {
          total_beneficiaries: (leadsCount || 0) + (usersCount || 0),
          total_events: eventsCount || 0,
          total_donations_value: totalDonations,
          total_sponsors: sponsorsCount || 0,
          active_leads: activeLeads,
          converted_leads: convertedLeads,
          conversion_rate: conversionRate,
          avg_days_to_conversion: Math.round(avgDays),
        };

        return stats;
      },
      enabled: isAdmin,
    });
  };

  // ==================== EXPORT FUNCTIONS ====================
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const useExportLeads = () => {
    return useMutation({
      mutationFn: async () => {
        const { data, error } = await supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        exportToCSV(data || [], 'leads');
        return data;
      },
    });
  };

  const useExportDonations = () => {
    return useMutation({
      mutationFn: async () => {
        const { data, error } = await supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        exportToCSV(data || [], 'doacoes');
        return data;
      },
    });
  };

  const useExportEvents = () => {
    return useMutation({
      mutationFn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date_start', { ascending: false });
        if (error) throw error;
        exportToCSV(data || [], 'eventos');
        return data;
      },
    });
  };

  const useExportMetrics = () => {
    return useMutation({
      mutationFn: async () => {
        const { data, error } = await supabase
          .from('social_impact_metrics')
          .select('*')
          .order('period_end', { ascending: false });
        if (error) throw error;
        exportToCSV(data || [], 'metricas_impacto');
        return data;
      },
    });
  };

  return {
    // Metrics
    useMetricsList,
    useCreateMetric,
    useUpdateMetric,
    useVerifyMetric,
    // Journey
    useJourneyByCPF,
    // Stats
    useImpactStats,
    // Export
    exportToCSV,
    useExportLeads,
    useExportDonations,
    useExportEvents,
    useExportMetrics,
  };
};
