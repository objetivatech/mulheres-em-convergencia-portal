import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceArea {
  id: string;
  area_type: 'city' | 'neighborhood';
  area_name: string;
  state: string;
  active: boolean;
}

interface NewServiceArea {
  area_type: 'city' | 'neighborhood';
  area_name: string;
  state: string;
}

export const useBusinessServiceAreas = (businessId: string | null) => {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch service areas
  const fetchServiceAreas = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_business_service_areas', {
        business_uuid: businessId
      });

      if (error) throw error;
      setServiceAreas((data || []).map(area => ({
        ...area,
        area_type: area.area_type as 'city' | 'neighborhood'
      })));
    } catch (error: any) {
      console.error('Error fetching service areas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceAreas();
  }, [businessId]);

  // Add service area
  const addServiceArea = async (newArea: NewServiceArea): Promise<boolean> => {
    if (!businessId) return false;

    try {
      const { error } = await supabase
        .from('business_service_areas')
        .insert({
          business_id: businessId,
          ...newArea,
        });

      if (error) throw error;

      toast({
        title: 'Área de atendimento adicionada',
        description: `${newArea.area_name} foi adicionada com sucesso.`,
      });

      fetchServiceAreas(); // Refresh list
      return true;
    } catch (error: any) {
      console.error('Error adding service area:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a área de atendimento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remove service area
  const removeServiceArea = async (areaId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('business_service_areas')
        .update({ active: false })
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: 'Área removida',
        description: 'Área de atendimento removida com sucesso.',
      });

      fetchServiceAreas(); // Refresh list
      return true;
    } catch (error: any) {
      console.error('Error removing service area:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a área de atendimento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    serviceAreas,
    loading,
    error,
    addServiceArea,
    removeServiceArea,
    refetch: fetchServiceAreas,
  };
};