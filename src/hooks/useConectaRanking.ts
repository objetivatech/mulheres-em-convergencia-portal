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
      // Get monthly points
      let query = supabase
        .from('conecta_monthly_points')
        .select('user_id, total_points')
        .eq('month', currentMonth)
        .order('total_points', { ascending: false });

      if (teamId) {
        // Filter by team members
        const { data: teamMembers } = await supabase
          .from('conecta_team_members')
          .select('user_id')
          .eq('team_id', teamId);
        
        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map(m => m.user_id);
          query = query.in('user_id', memberIds);
        }
      }

      const { data: points, error } = await query;
      if (error) throw error;
      if (!points || points.length === 0) return [];

      // Get profiles for these users
      const userIds = points.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('conecta_profiles')
        .select('user_id, rank')
        .in('user_id', userIds);

      const { data: authProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(authProfiles?.map(p => [p.id, p]) || []);
      const conectaMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return points.map((p, idx) => {
        const profile = profileMap.get(p.user_id);
        const conectaProfile = conectaMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: profile?.full_name || 'Membro',
          avatar_url: profile?.avatar_url || null,
          company: null,
          total_points: p.total_points,
          rank: conectaProfile?.rank || 'iniciante',
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
