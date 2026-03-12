import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RankingEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  company: string | null;
  total_points: number;
  rank: string;
  position: number;
}

export function useConectaRanking(month?: string, teamId?: string) {
  const { user } = useAuth();

  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const rankingQuery = useQuery({
    queryKey: ['conecta-ranking', currentMonth, teamId],
    queryFn: async (): Promise<RankingEntry[]> => {
      let query = supabase
        .from('conecta_monthly_points')
        .select('user_id, points, rank')
        .eq('year_month', currentMonth)
        .order('points', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      } else {
        query = query.is('team_id', null);
      }

      const { data: points, error } = await query;
      if (error) throw error;
      if (!points || points.length === 0) return [];

      const userIds = points.map((p: any) => p.user_id);

      const { data: authProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((authProfiles || []).map((p: any) => [p.id, p]));

      return points.map((p: any, idx: number) => {
        const profile = profileMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: (profile as any)?.full_name || 'Membro',
          avatar_url: (profile as any)?.avatar_url || null,
          company: null,
          total_points: p.points,
          rank: p.rank || 'iniciante',
          position: idx + 1,
        };
      });
    },
    enabled: !!user,
  });

  return {
    ranking: rankingQuery.data || [],
    isLoading: rankingQuery.isLoading,
  };
}
