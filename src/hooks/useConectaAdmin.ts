import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useConectaAdmin() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ['conecta-admin-overview'],
    queryFn: async () => {
      const [members, meetings, deals, referrals, testimonials, invitations, oneOnOnes] = await Promise.all([
        supabase.from('conecta_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('conecta_meetings').select('id', { count: 'exact', head: true }),
        supabase.from('conecta_business_deals').select('id, value', { count: 'exact' }),
        supabase.from('conecta_referrals').select('id', { count: 'exact', head: true }),
        supabase.from('conecta_testimonials').select('id', { count: 'exact', head: true }),
        supabase.from('conecta_invitations').select('id, status', { count: 'exact' }),
        supabase.from('conecta_one_on_ones').select('id', { count: 'exact', head: true }),
      ]);

      const totalDealValue = (deals.data as any[])?.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0) || 0;
      const acceptedInvites = (invitations.data as any[])?.filter((i: any) => i.status === 'accepted').length || 0;

      return {
        totalMembers: members.count || 0,
        totalMeetings: meetings.count || 0,
        totalDeals: deals.count || 0,
        totalDealValue,
        totalReferrals: referrals.count || 0,
        totalTestimonials: testimonials.count || 0,
        totalInvitations: invitations.count || 0,
        acceptedInvites,
        totalOneOnOnes: oneOnOnes.count || 0,
      };
    },
    enabled: !!user,
  });

  const recentActivityQuery = useQuery({
    queryKey: ['conecta-admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const teamsQuery = useQuery({
    queryKey: ['conecta-admin-teams'],
    queryFn: async () => {
      const { data: teams, error } = await supabase
        .from('conecta_teams')
        .select('*')
        .order('name');
      if (error) throw error;

      const { data: teamMembers } = await supabase
        .from('conecta_team_members')
        .select('team_id');

      const countMap = new Map<string, number>();
      (teamMembers as any[])?.forEach((tm: any) => {
        countMap.set(tm.team_id, (countMap.get(tm.team_id) || 0) + 1);
      });

      return (teams || []).map((t: any) => ({ ...t, memberCount: countMap.get(t.id) || 0 }));
    },
    enabled: !!user,
  });

  return {
    overview: overviewQuery.data,
    isLoadingOverview: overviewQuery.isLoading,
    recentActivity: recentActivityQuery.data || [],
    teams: teamsQuery.data || [],
    isLoadingTeams: teamsQuery.isLoading,
  };
}
