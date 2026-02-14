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
