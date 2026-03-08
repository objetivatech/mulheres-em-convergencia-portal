import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type AppRole =
  | 'admin'
  | 'blog_editor'
  | 'business_owner'
  | 'customer'
  | 'subscriber'
  | 'ambassador'
  | 'community_member'
  | 'student'
  | 'donor'
  | 'sponsor'
  | 'mentor'
  | 'volunteer'
  | 'staff'
  | 'partner'
  | 'project_client';

/**
 * Central hook that fetches all roles for the current user via the
 * `get_user_roles` SECURITY DEFINER RPC. Every role check in the app
 * should go through this hook (or consume its cache key).
 */
export const useUserRoles = () => {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: user.id,
      });
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      return (data ?? []) as AppRole[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  return {
    roles,
    hasRole,
    isLoading,
    // Convenience booleans
    isAdmin: hasRole('admin'),
    isBlogEditor: hasRole('blog_editor') || hasRole('admin'),
    isBusinessOwner: hasRole('business_owner'),
    isAmbassador: hasRole('ambassador'),
    isStudent: hasRole('student'),
    isCommunityMember: hasRole('community_member'),
    isSubscriber: hasRole('subscriber'),
  };
};
