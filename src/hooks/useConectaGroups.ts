import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type GroupType = 'networking' | 'encontro' | 'mentoria' | 'whatsapp';

export interface ConectaGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: GroupType;
  category: string | null;
  image_url: string | null;
  external_link: string | null;
  max_members: number | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface GroupMeeting {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_link: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
}

export function useConectaGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // List all groups with member count and membership status
  const { data: groups, isLoading } = useQuery({
    queryKey: ['conecta-groups', user?.id],
    queryFn: async () => {
      const { data: allGroups, error } = await supabase
        .from('conecta_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get member counts
      const { data: memberCounts } = await supabase
        .from('conecta_group_members')
        .select('group_id');

      // Get user memberships
      const { data: myMemberships } = user ? await supabase
        .from('conecta_group_members')
        .select('group_id')
        .eq('user_id', user.id) : { data: [] };

      const countMap = new Map<string, number>();
      for (const m of memberCounts || []) {
        countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1);
      }
      const myGroupIds = new Set((myMemberships || []).map(m => m.group_id));

      return (allGroups || []).map(g => ({
        ...g,
        member_count: countMap.get(g.id) || 0,
        is_member: myGroupIds.has(g.id),
      })) as ConectaGroup[];
    },
    enabled: !!user,
  });

  // Create group
  const createGroup = useMutation({
    mutationFn: async (data: { name: string; description?: string; group_type: GroupType; category?: string; external_link?: string; max_members?: number; is_private?: boolean }) => {
      const { data: group, error } = await supabase
        .from('conecta_groups')
        .insert({ ...data, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join as admin
      await supabase.from('conecta_group_members').insert({
        group_id: group.id,
        user_id: user!.id,
        role: 'admin',
      });
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-groups'] });
      toast.success('Grupo criado com sucesso!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Join group
  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('conecta_group_members').insert({
        group_id: groupId,
        user_id: user!.id,
        role: 'member',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-groups'] });
      toast.success('Você entrou no grupo!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Leave group
  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('conecta_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-groups'] });
      toast.success('Você saiu do grupo.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete group
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('conecta_groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-groups'] });
      toast.success('Grupo excluído.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { groups, isLoading, createGroup, joinGroup, leaveGroup, deleteGroup };
}

export function useConectaGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['conecta-group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_groups')
        .select('*')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return data as ConectaGroup;
    },
    enabled: !!groupId,
  });

  // Members
  const { data: members } = useQuery({
    queryKey: ['conecta-group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_group_members')
        .select('*')
        .eq('group_id', groupId!);
      if (error) throw error;
      // Enrich with profile data
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return data.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id),
      }));
    },
    enabled: !!groupId,
  });

  // Posts
  const { data: posts } = useQuery({
    queryKey: ['conecta-group-posts', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_group_posts')
        .select('*')
        .eq('group_id', groupId!)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      const authorIds = [...new Set(data.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return data.map(p => ({
        ...p,
        author_name: profileMap.get(p.author_id)?.full_name || 'Membro',
        author_avatar: profileMap.get(p.author_id)?.avatar_url,
      })) as GroupPost[];
    },
    enabled: !!groupId,
  });

  // Meetings
  const { data: meetings } = useQuery({
    queryKey: ['conecta-group-meetings', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_group_meetings')
        .select('*')
        .eq('group_id', groupId!)
        .order('meeting_date', { ascending: true });
      if (error) throw error;
      return data as GroupMeeting[];
    },
    enabled: !!groupId,
  });

  // Create post
  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('conecta_group_posts').insert({
        group_id: groupId!,
        author_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-group-posts', groupId] });
      toast.success('Post publicado!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create meeting
  const createMeeting = useMutation({
    mutationFn: async (data: { title: string; description?: string; meeting_date: string; meeting_link?: string; location?: string }) => {
      const { error } = await supabase.from('conecta_group_meetings').insert({
        ...data,
        group_id: groupId!,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-group-meetings', groupId] });
      toast.success('Reunião agendada!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('conecta_group_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-group-posts', groupId] });
    },
  });

  return { group, groupLoading, members, posts, meetings, createPost, createMeeting, deletePost };
}
