import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConectaMember {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  company: string | null;
  position: string | null;
  bio: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  conecta_role: string;
  rank: string;
  points: number;
  slug: string | null;
  team_id: string | null;
  team_name: string | null;
  team_color: string | null;
  business?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    category: string;
  } | null;
}

export interface ConectaMembersByTeam {
  team_id: string | null;
  team_name: string;
  team_color: string;
  members: ConectaMember[];
}

export function useConectaMembers() {
  const query = useQuery({
    queryKey: ['conecta-members-directory'],
    queryFn: async () => {
      // 1. Get all active conecta profiles joined with main profiles
      const { data: conectaProfiles, error: cpError } = await supabase
        .from('conecta_profiles')
        .select('id, conecta_role, rank, points, company, position, bio, phone, linkedin_url, instagram_url, website_url, slug, is_active')
        .eq('is_active', true);

      if (cpError) throw cpError;

      const userIds = (conectaProfiles || []).map(p => p.id);
      if (userIds.length === 0) return [];

      // 2. Get main profiles for names/avatars
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (pError) throw pError;

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, typeof profiles[0]>);

      // 3. Get team memberships
      const { data: teamMembers } = await supabase
        .from('conecta_team_members')
        .select('user_id, team_id')
        .in('user_id', userIds);

      const teamMembershipMap: Record<string, string[]> = {};
      (teamMembers || []).forEach(tm => {
        if (!teamMembershipMap[tm.user_id]) teamMembershipMap[tm.user_id] = [];
        teamMembershipMap[tm.user_id].push(tm.team_id);
      });

      // 4. Get all teams
      const { data: teams } = await supabase
        .from('conecta_teams')
        .select('id, name, color')
        .order('name');

      const teamsMap: Record<string, { name: string; color: string }> = {};
      (teams || []).forEach(t => {
        teamsMap[t.id] = { name: t.name, color: t.color || '#22c55e' };
      });

      // 5. Get published online businesses owned by members
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, slug, logo_url, category, owner_id')
        .in('owner_id', userIds)
        .not('owner_id', 'is', null);

      const businessMap: Record<string, { id: string; name: string; slug: string; logo_url: string | null; category: string }> = {};
      (businesses || []).forEach(b => {
        if (b.owner_id) {
          businessMap[b.owner_id] = { id: b.id, name: b.name, slug: b.slug, logo_url: b.logo_url, category: b.category };
        }
      });

      // 5. Build member entries - exclude convidados from directory
      const membersWithTeam: ConectaMember[] = [];

      (conectaProfiles || []).forEach(cp => {
        if (cp.conecta_role === 'convidado') return;
        const mainProfile = profilesMap[cp.id];
        if (!mainProfile) return;

        const base = {
          id: cp.id,
          full_name: mainProfile.full_name,
          email: mainProfile.email,
          avatar_url: mainProfile.avatar_url,
          company: cp.company,
          position: cp.position,
          bio: cp.bio,
          phone: cp.phone,
          linkedin_url: cp.linkedin_url,
          instagram_url: cp.instagram_url,
          website_url: cp.website_url,
          conecta_role: cp.conecta_role,
          rank: cp.rank,
          points: cp.points,
          slug: cp.slug,
          business: businessMap[cp.id] || null,
        };

        const userTeamIds = teamMembershipMap[cp.id] || [];
        if (userTeamIds.length === 0) {
          membersWithTeam.push({ ...base, team_id: null, team_name: null, team_color: null });
        } else {
          userTeamIds.forEach(teamId => {
            const teamInfo = teamsMap[teamId];
            if (teamInfo) {
              membersWithTeam.push({
                ...base,
                team_id: teamId,
                team_name: teamInfo.name,
                team_color: teamInfo.color,
              });
            }
          });
        }
      });

      return membersWithTeam;
    },
  });

  // Group members by team
  const membersByTeam: ConectaMembersByTeam[] = [];
  if (query.data) {
    const teamsFound: Record<string, ConectaMembersByTeam> = {};
    const membersWithoutTeam: ConectaMember[] = [];

    query.data.forEach(member => {
      if (member.team_id && member.team_name) {
        if (!teamsFound[member.team_id]) {
          teamsFound[member.team_id] = {
            team_id: member.team_id,
            team_name: member.team_name,
            team_color: member.team_color || '#22c55e',
            members: [],
          };
        }
        teamsFound[member.team_id].members.push(member);
      } else {
        membersWithoutTeam.push(member);
      }
    });

    Object.values(teamsFound)
      .sort((a, b) => a.team_name.localeCompare(b.team_name))
      .forEach(team => membersByTeam.push(team));

    if (membersWithoutTeam.length > 0) {
      membersByTeam.push({
        team_id: null,
        team_name: 'Sem Grupo',
        team_color: '#6b7280',
        members: membersWithoutTeam,
      });
    }
  }

  const uniqueMembers = query.data
    ? Array.from(new Map(query.data.map(m => [m.id, m])).values())
    : undefined;

  return {
    members: uniqueMembers,
    allMemberEntries: query.data,
    membersByTeam,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
