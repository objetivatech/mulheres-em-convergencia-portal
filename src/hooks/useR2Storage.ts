import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractR2KeyFromUrl } from '@/lib/storage';

export const useR2Storage = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    folder: string = 'uploads'
  ): Promise<string | null> => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('action', 'upload');

      const { data, error } = await supabase.functions.invoke('r2-storage', {
        body: formData,
      });

      if (error) throw error;
      if (!data?.success || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }

      return data.url;
    } catch (error: any) {
      console.error('R2 upload error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar arquivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      const key = extractR2KeyFromUrl(fileUrl);
      if (!key) {
        console.warn('Could not extract R2 key from URL:', fileUrl);
        return false;
      }

      const { data, error } = await supabase.functions.invoke('r2-storage', {
        body: JSON.stringify({ action: 'delete', key }),
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error: any) {
      console.error('R2 delete error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover arquivo',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { uploadFile, deleteFile, uploading };
};
