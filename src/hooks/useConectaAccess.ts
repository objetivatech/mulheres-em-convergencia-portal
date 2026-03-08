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

  // Use centralized role check for membro level (business_owner role)
  const { data: hasBusinessOwnerRole, isLoading: roleLoading } = useQuery({
    queryKey: ['conecta-role-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'business_owner',
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  // Determine access level based on roles
  const getAccessLevel = (): ConectaAccessLevel => {
    if (!user) return null;
    if (isAdmin) return 'admin';
    if (hasBusinessOwnerRole) return 'membro';
    return 'convidado';
  };

  const accessLevel = getAccessLevel();
  const loading = profileLoading || roleLoading;
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
    const role = isAdmin ? 'admin' : hasBusinessOwnerRole ? 'membro' : 'convidado';
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
