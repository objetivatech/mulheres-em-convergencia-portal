import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MeetingGuest {
  id: string;
  name: string | null;
  email: string | null;
  code: string;
  status: string;
  accepted_by: string | null;
  created_at: string;
  inviter?: { full_name: string; avatar_url: string | null };
  guest_profile?: { full_name: string; avatar_url: string | null } | null;
}

export function useMeetingGuests(meetingId: string | null) {
  return useQuery({
    queryKey: ['conecta-meeting-guests', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      const { data, error } = await supabase
        .from('conecta_invitations')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch inviter profiles
      const inviterIds = [...new Set(data.map(i => i.invited_by))];
      const acceptedIds = data.map(i => i.accepted_by).filter(Boolean) as string[];
      const allIds = [...new Set([...inviterIds, ...acceptedIds])];

      const profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', allIds);
        profiles?.forEach(p => { profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      }

      return data.map(inv => ({
        ...inv,
        inviter: profilesMap[inv.invited_by],
        guest_profile: inv.accepted_by ? profilesMap[inv.accepted_by] || null : null,
      })) as MeetingGuest[];
    },
    enabled: !!meetingId,
  });
}
