import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useR2Storage } from '@/hooks/useR2Storage';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { uploadFile: r2Upload, deleteFile: r2Delete } = useR2Storage();

  const uploadImage = async (file: File, bucket: string = 'blog-images'): Promise<string | null> => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imagem deve ter no máximo 5MB');
      }

      // Try optimization edge function first (which now also uploads to R2)
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('sizes', JSON.stringify(['thumbnail', 'medium', 'large']));

        const { data, error } = await supabase.functions.invoke('optimize-image', {
          body: formData
        });

        if (!error && data?.success && data.urls?.medium) {
          toast({
            title: 'Sucesso',
            description: 'Imagem otimizada e enviada com sucesso!'
          });
          return data.urls.medium;
        }
      } catch (optimizeError) {
        console.warn('Image optimization failed, falling back to direct R2 upload:', optimizeError);
      }

      // Fallback: direct upload to R2 via the r2-storage edge function
      const url = await r2Upload(file, bucket);

      if (url) {
        toast({
          title: 'Sucesso',
          description: 'Imagem enviada com sucesso!'
        });
      }

      return url;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar imagem',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string, _bucket: string = 'blog-images'): Promise<boolean> => {
    try {
      const success = await r2Delete(url);

      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Imagem removida com sucesso!'
        });
      }

      return success;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover imagem',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading
  };
};
