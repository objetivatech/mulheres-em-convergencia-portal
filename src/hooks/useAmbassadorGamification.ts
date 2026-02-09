import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AmbassadorTier {
  id: string;
  name: string;
  min_sales: number;
  commission_rate: number;
  recurring_rate: number;
  recurring_months: number;
  color: string;
  icon: string;
  benefits: string[];
  display_order: number;
}

export interface AmbassadorAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  badge_color: string;
  display_order: number;
}

export interface UserAchievement {
  id: string;
  ambassador_id: string;
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
  achievement?: AmbassadorAchievement;
}

export interface AmbassadorPoints {
  id: string;
  ambassador_id: string;
  points_type: string;
  points: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export const useAmbassadorGamification = () => {
  const queryClient = useQueryClient();

  // Buscar todos os níveis disponíveis
  const useTiers = () => {
    return useQuery({
      queryKey: ['ambassador-tiers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ambassador_tiers')
          .select('*')
          .eq('active', true)
          .order('display_order');
        
        if (error) throw error;
        return data as AmbassadorTier[];
      },
    });
  };

  // Buscar todas as conquistas disponíveis
  const useAchievements = () => {
    return useQuery({
      queryKey: ['ambassador-achievements'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ambassador_achievements')
          .select('*')
          .eq('active', true)
          .order('display_order');
        
        if (error) throw error;
        return data as AmbassadorAchievement[];
      },
    });
  };

  // Buscar conquistas desbloqueadas da embaixadora
  const useUserAchievements = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-user-achievements', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_user_achievements')
          .select(`
            *,
            achievement:ambassador_achievements(*)
          `)
          .eq('ambassador_id', ambassadorId)
          .order('unlocked_at', { ascending: false });
        
        if (error) throw error;
        return data as UserAchievement[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Buscar histórico de pontos
  const usePointsHistory = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-points-history', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_points')
          .select('*')
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        return data as AmbassadorPoints[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Buscar ranking de embaixadoras (top 10)
  const useRanking = () => {
    return useQuery({
      queryKey: ['ambassador-ranking'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ambassadors')
          .select(`
            id,
            referral_code,
            tier,
            total_points,
            total_sales,
            total_earnings,
            profile:profiles!ambassadors_user_id_fkey(full_name, avatar_url)
          `)
          .eq('active', true)
          .order('total_points', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        return data;
      },
    });
  };

  // Calcular progresso para o próximo nível
  const calculateTierProgress = (
    currentTier: string,
    lifetimeSales: number,
    tiers: AmbassadorTier[]
  ) => {
    const sortedTiers = [...tiers].sort((a, b) => a.min_sales - b.min_sales);
    const currentTierData = sortedTiers.find(t => t.id === currentTier);
    const currentIndex = sortedTiers.findIndex(t => t.id === currentTier);
    const nextTier = sortedTiers[currentIndex + 1];

    if (!nextTier) {
      // Já está no nível máximo
      return {
        currentTier: currentTierData,
        nextTier: null,
        salesForNext: 0,
        progress: 100,
        isMaxTier: true,
      };
    }

    const salesForNext = nextTier.min_sales - lifetimeSales;
    const progressRange = nextTier.min_sales - (currentTierData?.min_sales || 0);
    const currentProgress = lifetimeSales - (currentTierData?.min_sales || 0);
    const progress = Math.min(100, (currentProgress / progressRange) * 100);

    return {
      currentTier: currentTierData,
      nextTier,
      salesForNext,
      progress,
      isMaxTier: false,
    };
  };

  // Verificar conquistas não notificadas
  const useUnnotifiedAchievements = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-unnotified-achievements', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_user_achievements')
          .select(`
            *,
            achievement:ambassador_achievements(*)
          `)
          .eq('ambassador_id', ambassadorId)
          .eq('notified', false);
        
        if (error) throw error;
        return data as UserAchievement[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Marcar conquista como notificada
  const useMarkAchievementNotified = () => {
    return useMutation({
      mutationFn: async (achievementId: string) => {
        const { error } = await supabase
          .from('ambassador_user_achievements')
          .update({ notified: true })
          .eq('id', achievementId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-unnotified-achievements'] });
        queryClient.invalidateQueries({ queryKey: ['ambassador-user-achievements'] });
      },
    });
  };

  return {
    useTiers,
    useAchievements,
    useUserAchievements,
    usePointsHistory,
    useRanking,
    calculateTierProgress,
    useUnnotifiedAchievements,
    useMarkAchievementNotified,
  };
};
