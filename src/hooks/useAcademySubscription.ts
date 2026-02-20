import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AcademySubscription {
  id: string;
  user_id: string;
  status: string;
  asaas_subscription_id: string | null;
  asaas_customer_id: string | null;
  billing_cycle: string;
  price: number;
  started_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademySubscriptionWithProfile extends AcademySubscription {
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export const useMyAcademySubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academy-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as AcademySubscription | null;
    },
    enabled: !!user,
  });
};

export const useAllAcademySubscriptions = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['admin-academy-subscriptions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('academy_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: subs, error } = await query;
      if (error) throw error;

      if (!subs?.length) return [];

      // Fetch profiles for all user_ids
      const userIds = [...new Set(subs.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return subs.map(sub => ({
        ...sub,
        profiles: profileMap.get(sub.user_id) || null,
      })) as AcademySubscriptionWithProfile[];
    },
  });
};

export const useAcademyStudents = () => {
  return useQuery({
    queryKey: ['admin-academy-students'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student' as any);
      if (error) throw error;
      if (!roles?.length) return [];

      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      return (profiles || []).map(p => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
      }));
    },
  });
};

export const createAcademySubscription = async (customer: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province?: string;
  city: string;
  state: string;
}) => {
  const { data, error } = await supabase.functions.invoke('create-academy-subscription', {
    body: { customer },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Erro ao criar assinatura');
  return data;
};
