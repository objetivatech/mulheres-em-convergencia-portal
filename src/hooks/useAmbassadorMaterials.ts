import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useR2Storage } from '@/hooks/useR2Storage';
import { extractR2KeyFromUrl } from '@/lib/storage';

export type MaterialType = 'banner' | 'pdf' | 'whatsapp_template' | 'instagram_template';

export type AmbassadorMaterial = {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  category: string | null;
  file_url: string | null;
  content: string | null;
  dimensions: string | null;
  display_order: number;
  active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
};

export const useAmbassadorMaterials = () => {
  const queryClient = useQueryClient();

  // Fetch all materials (admin)
  const useAllMaterials = () => {
    return useQuery({
      queryKey: ['ambassador-materials-all'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ambassador_materials')
          .select('*')
          .order('type')
          .order('display_order');
        
        if (error) throw error;
        return data as AmbassadorMaterial[];
      },
    });
  };

  // Fetch active materials by type (ambassador view)
  const useMaterialsByType = (type: MaterialType) => {
    return useQuery({
      queryKey: ['ambassador-materials', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ambassador_materials')
          .select('*')
          .eq('type', type)
          .eq('active', true)
          .order('display_order');
        
        if (error) throw error;
        return data as AmbassadorMaterial[];
      },
    });
  };

  // Create material
  const useCreateMaterial = () => {
    return useMutation({
      mutationFn: async (material: Omit<AmbassadorMaterial, 'id' | 'created_at' | 'updated_at' | 'download_count'>) => {
        const { data, error } = await supabase
          .from('ambassador_materials')
          .insert([material])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-materials'] });
        toast.success('Material criado com sucesso!');
      },
      onError: (error) => {
        console.error('Error creating material:', error);
        toast.error('Erro ao criar material');
      },
    });
  };

  // Update material
  const useUpdateMaterial = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<AmbassadorMaterial> & { id: string }) => {
        const { data, error } = await supabase
          .from('ambassador_materials')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-materials'] });
        toast.success('Material atualizado com sucesso!');
      },
      onError: (error) => {
        console.error('Error updating material:', error);
        toast.error('Erro ao atualizar material');
      },
    });
  };

  // Delete material
  const useDeleteMaterial = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        // First, get the material to check if it has a file
        const { data: material } = await supabase
          .from('ambassador_materials')
          .select('file_url')
          .eq('id', id)
          .single();

        // If has file, delete from R2
        if (material?.file_url) {
          try {
            const key = extractR2KeyFromUrl(material.file_url);
            if (key) {
              await supabase.functions.invoke('r2-storage', {
                body: JSON.stringify({ action: 'delete', key }),
              });
            }
          } catch (e) {
            console.warn('Failed to delete file from R2:', e);
          }
        }

        // Delete the record
        const { error } = await supabase
          .from('ambassador_materials')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-materials'] });
        toast.success('Material excluído com sucesso!');
      },
      onError: (error) => {
        console.error('Error deleting material:', error);
        toast.error('Erro ao excluir material');
      },
    });
  };

  // Upload file to R2 storage
  const uploadFile = async (file: File, folder: string = 'banners'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `ambassador-materials/${folder}`);

    const { data, error } = await supabase.functions.invoke('r2-storage', {
      body: formData,
    });

    if (error) throw error;
    if (!data?.success || !data?.url) {
      throw new Error(data?.error || 'Upload failed');
    }

    return data.url;
  };

  // Delete file from R2 storage
  const deleteFile = async (fileUrl: string): Promise<void> => {
    const key = extractR2KeyFromUrl(fileUrl);
    if (key) {
      await supabase.functions.invoke('r2-storage', {
        body: JSON.stringify({ action: 'delete', key }),
      });
    }
  };

  // Increment download count
  const incrementDownloadCount = async (id: string) => {
    try {
      const { data: material } = await supabase
        .from('ambassador_materials')
        .select('download_count')
        .eq('id', id)
        .single();
      
      if (material) {
        await supabase
          .from('ambassador_materials')
          .update({ download_count: (material.download_count || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  };

  return {
    useAllMaterials,
    useMaterialsByType,
    useCreateMaterial,
    useUpdateMaterial,
    useDeleteMaterial,
    uploadFile,
    deleteFile,
    incrementDownloadCount,
  };
};
