import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type ConectaAccessLevel = 'admin' | 'membro' | 'convidado' | null;

export interface ConectaProfile {
  id: string;
  conecta_role: string;
  rank: string;
  points: number;
  company: string | null;
  position: string | null;
  bio: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  birthday: string | null;
  slug: string | null;
  is_active: boolean;
  banner_url: string | null;
}

export const useConectaAccess = () => {
  const { user, isAdmin } = useAuth();

  // Fetch conecta profile
  const { data: conectaProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['conecta-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('conecta_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ConectaProfile | null;
    },
    enabled: !!user,
  });

  // Check if user has active subscription (membro level)
  const { data: hasActiveSubscription, isLoading: subLoading } = useQuery({
    queryKey: ['conecta-subscription-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  // Determine access level
  const getAccessLevel = (): ConectaAccessLevel => {
    if (!user) return null;
    if (isAdmin) return 'admin';
    if (hasActiveSubscription) return 'membro';
    if (user) return 'convidado'; // Any logged-in user is at least convidado
    return null;
  };

  const accessLevel = getAccessLevel();
  const loading = profileLoading || subLoading;
  const hasAccess = !!user; // Any logged-in user has some access

  // Permission helpers
  const canAccessFeature = (requiredLevel: ConectaAccessLevel): boolean => {
    if (!accessLevel) return false;
    const levels: ConectaAccessLevel[] = ['convidado', 'membro', 'admin'];
    const userIdx = levels.indexOf(accessLevel);
    const requiredIdx = levels.indexOf(requiredLevel);
    return userIdx >= requiredIdx;
  };

  const isMemberOrAbove = accessLevel === 'admin' || accessLevel === 'membro';

  // Ensure conecta profile exists (upsert on first access)
  const ensureProfile = async () => {
    if (!user || conectaProfile) return;
    const role = isAdmin ? 'admin' : hasActiveSubscription ? 'membro' : 'convidado';
    await supabase
      .from('conecta_profiles')
      .upsert({
        id: user.id,
        conecta_role: role,
      }, { onConflict: 'id' });
  };

  return {
    user,
    accessLevel,
    conectaProfile,
    loading,
    hasAccess,
    isMemberOrAbove,
    canAccessFeature,
    ensureProfile,
    isAdmin: accessLevel === 'admin',
  };
};
