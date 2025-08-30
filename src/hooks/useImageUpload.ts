import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      toast({
        title: 'Sucesso',
        description: 'Imagem enviada com sucesso!'
      });

      return data.publicUrl;

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

  const deleteImage = async (url: string, bucket: string = 'blog-images'): Promise<boolean> => {
    try {
      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Imagem removida com sucesso!'
      });

      return true;
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