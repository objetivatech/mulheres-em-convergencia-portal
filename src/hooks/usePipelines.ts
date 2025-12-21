import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: PipelineStage[];
  pipeline_type: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePipelines = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const usePipelinesList = () => {
    return useQuery({
      queryKey: ['crm-pipelines'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('crm_pipelines')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) throw error;
        return (data || []).map(item => ({
          ...item,
          stages: (item.stages as unknown as PipelineStage[]) || [],
        })) as Pipeline[];
      },
      enabled: isAdmin,
    });
  };

  const usePipelineById = (id: string) => {
    return useQuery({
      queryKey: ['crm-pipelines', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('crm_pipelines')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return {
          ...data,
          stages: (data.stages as unknown as PipelineStage[]) || [],
        } as Pipeline;
      },
      enabled: isAdmin && !!id,
    });
  };

  const useCreatePipeline = () => {
    return useMutation({
      mutationFn: async (data: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>) => {
        const { data: result, error } = await supabase
          .from('crm_pipelines')
          .insert({
            name: data.name,
            description: data.description,
            stages: data.stages as unknown as Json,
            pipeline_type: data.pipeline_type,
            active: data.active ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-pipelines'] });
      },
    });
  };

  const useUpdatePipeline = () => {
    return useMutation({
      mutationFn: async ({ id, ...data }: Partial<Pipeline> & { id: string }) => {
        const { data: result, error } = await supabase
          .from('crm_pipelines')
          .update({
            name: data.name,
            description: data.description,
            stages: data.stages as unknown as Json,
            pipeline_type: data.pipeline_type,
            active: data.active,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-pipelines'] });
      },
    });
  };

  const useDeletePipeline = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('crm_pipelines')
          .update({ active: false })
          .eq('id', id);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm-pipelines'] });
      },
    });
  };

  return {
    usePipelinesList,
    usePipelineById,
    useCreatePipeline,
    useUpdatePipeline,
    useDeletePipeline,
  };
};
