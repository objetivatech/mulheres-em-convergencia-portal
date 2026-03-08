import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ConectaActivity {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useConectaActivityFeed(limit: number = 10) {
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['conecta-activity-feed', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = [...new Set(data?.map(a => a.user_id) || [])];
      
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

      return (data || []).map(activity => ({
        ...activity,
        metadata: activity.metadata as Record<string, unknown> | null,
        user: usersMap[activity.user_id] || { full_name: 'Usuária', avatar_url: null },
      })) as ConectaActivity[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('conecta-activity-feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conecta_activity_feed' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conecta-activity-feed'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { activities, isLoading };
}
