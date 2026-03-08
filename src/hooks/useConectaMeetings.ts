import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export interface ConectaMeeting {
  id: string;
  team_id: string | null;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  team?: { name: string; color: string } | null;
  attendees_count?: number;
  is_attending?: boolean;
}

export interface ConectaAttendance {
  id: string;
  meeting_id: string;
  user_id: string;
  registered_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

export function useConectaMeetings() {
  const { user, isAdmin } = useConectaAccess();
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['conecta-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_meetings')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (error) throw error;

      // Teams
      const teamIds = data.filter(m => m.team_id).map(m => m.team_id!);
      const teamsMap: Record<string, { name: string; color: string }> = {};
      if (teamIds.length > 0) {
        const { data: teams } = await supabase.from('conecta_teams').select('id, name, color').in('id', teamIds);
        teams?.forEach(t => { teamsMap[t.id] = { name: t.name, color: t.color || '#22c55e' }; });
      }

      // Attendances
      const { data: attendances } = await supabase.from('conecta_attendances').select('meeting_id, user_id');

      return data.map(m => ({
        ...m,
        team: m.team_id ? teamsMap[m.team_id] : null,
        attendees_count: attendances?.filter(a => a.meeting_id === m.id).length || 0,
        is_attending: attendances?.some(a => a.meeting_id === m.id && a.user_id === user?.id) || false,
      })) as ConectaMeeting[];
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ meetingId, isAttending }: { meetingId: string; isAttending: boolean }) => {
      if (!user?.id) throw new Error('Não autenticada');
      if (isAttending) {
        await supabase.from('conecta_attendances').delete().eq('meeting_id', meetingId).eq('user_id', user.id);
      } else {
        await supabase.from('conecta_attendances').insert({ meeting_id: meetingId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-meeting-attendees'] });
      toast.success('Presença atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar presença'),
  });

  const removeAttendance = useMutation({
    mutationFn: async ({ meetingId, userId }: { meetingId: string; userId: string }) => {
      await supabase.from('conecta_attendances').delete().eq('meeting_id', meetingId).eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-meeting-attendees'] });
      toast.success('Presença removida');
    },
    onError: () => toast.error('Erro ao remover presença'),
  });

  const createMeeting = useMutation({
    mutationFn: async (input: { title: string; description?: string; meeting_date: string; meeting_time?: string; location?: string; team_id?: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_meetings').insert({
        title: input.title,
        description: input.description || null,
        meeting_date: input.meeting_date,
        meeting_time: input.meeting_time || null,
        location: input.location || null,
        team_id: input.team_id || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-meetings'] });
      toast.success('Encontro criado!');
    },
    onError: () => toast.error('Erro ao criar encontro'),
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conecta_meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-meetings'] });
      toast.success('Encontro removido');
    },
  });

  return { meetings, isLoading, toggleAttendance, removeAttendance, createMeeting, deleteMeeting };
}

export function useConectaMeetingAttendees(meetingId: string) {
  return useQuery({
    queryKey: ['conecta-meeting-attendees', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_attendances').select('*').eq('meeting_id', meetingId);
      if (error) throw error;
      const userIds = data.map(a => a.user_id);
      const profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        profiles?.forEach(p => { profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      }
      return data.map(a => ({ ...a, profile: profilesMap[a.user_id] })) as ConectaAttendance[];
    },
    enabled: !!meetingId,
  });
}
