import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessAmenity {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export const useBusinessAmenities = (businessId: string | undefined) => {
  const [amenities, setAmenities] = useState<BusinessAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('business_amenities')
          .select('id, name, icon, active')
          .eq('business_id', businessId)
          .eq('active', true);

        if (error) throw error;

        setAmenities(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching amenities:', err);
        setError(err.message);
        setAmenities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAmenities();
  }, [businessId]);

  return { amenities, loading, error };
};
