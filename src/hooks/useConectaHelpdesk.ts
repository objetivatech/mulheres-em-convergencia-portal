import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface HelpdeskPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  reply_count: number;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { full_name: string; avatar_url: string | null };
}

export interface HelpdeskReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  user?: { full_name: string; avatar_url: string | null };
}

export const HELPDESK_CATEGORIES = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'rh', label: 'RH' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'geral', label: 'Geral' },
];

export function useConectaHelpdesk() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['conecta-helpdesk-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_helpdesk_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(p => p.user_id))];
      let usersMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        usersMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string; avatar_url: string | null }>);
      }

      return (data || []).map(post => ({
        ...post,
        user: usersMap[post.user_id] || { full_name: 'Membro', avatar_url: null },
      })) as HelpdeskPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (input: { title: string; description: string; category: string; priority: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase
        .from('conecta_helpdesk_posts')
        .insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-posts'] });
      toast.success('Desafio publicado!');
    },
    onError: () => toast.error('Erro ao publicar desafio'),
  });

  const updatePostStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === 'resolvido') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase
        .from('conecta_helpdesk_posts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-posts'] });
      toast.success('Status atualizado');
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conecta_helpdesk_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-posts'] });
      toast.success('Desafio removido');
    },
  });

  return { posts, isLoading, createPost, updatePostStatus, deletePost };
}

export function useConectaHelpdeskReplies(postId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: replies, isLoading } = useQuery({
    queryKey: ['conecta-helpdesk-replies', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from('conecta_helpdesk_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      let usersMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        usersMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string; avatar_url: string | null }>);
      }

      return (data || []).map(reply => ({
        ...reply,
        user: usersMap[reply.user_id] || { full_name: 'Membro', avatar_url: null },
      })) as HelpdeskReply[];
    },
    enabled: !!postId,
  });

  const createReply = useMutation({
    mutationFn: async (input: { post_id: string; content: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase
        .from('conecta_helpdesk_replies')
        .insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-posts'] });
      toast.success('Resposta enviada!');
    },
    onError: () => toast.error('Erro ao enviar resposta'),
  });

  const markAsSolution = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase
        .from('conecta_helpdesk_replies')
        .update({ is_solution: true })
        .eq('id', replyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-helpdesk-replies', postId] });
      toast.success('Marcada como solução!');
    },
  });

  return { replies, isLoading, createReply, markAsSolution };
}
