import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, [user]);

  const checkProfileCompletion = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('cpf, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        setLoading(false);
        return;
      }

      // Check if profile needs completion
      const needsUpdate = !profile || 
                         !profile.cpf || 
                         profile.cpf.trim() === '' ||
                         !profile.full_name ||
                         profile.full_name.trim() === '';

      setNeedsCompletion(needsUpdate);
    } catch (error) {
      console.error('Error checking profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = () => {
    setNeedsCompletion(false);
  };

  return {
    needsCompletion,
    loading,
    markAsComplete,
    recheckProfile: checkProfileCompletion,
  };
};