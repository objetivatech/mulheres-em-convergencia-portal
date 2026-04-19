import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractR2KeyFromUrl } from '@/lib/storage';

// Files larger than this use the presigned-PUT flow (direct browser → R2),
// avoiding edge function CPU/memory limits.
const PRESIGN_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10 MB

export const useR2Storage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Direct upload via Edge Function (small files, < 10 MB).
   */
  const uploadViaEdge = async (file: File, folder: string): Promise<string | null> => {
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
  };

  /**
   * Presigned-PUT upload: edge function only signs the URL,
   * the browser uploads the file directly to R2.
   * Reports progress via XHR.
   */
  const uploadViaPresign = async (file: File, folder: string): Promise<string | null> => {
    // 1) Ask edge function for a presigned PUT URL
    const { data, error } = await supabase.functions.invoke('r2-storage', {
      body: {
        action: 'presign',
        folder,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      },
    });

    if (error) throw error;
    if (!data?.success || !data?.uploadUrl || !data?.publicUrl) {
      throw new Error(data?.error || 'Falha ao gerar URL de upload');
    }

    // 2) PUT directly to R2 with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', data.uploadUrl, true);
      const headers = data.requiredHeaders || { 'Content-Type': file.type || 'application/octet-stream' };
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, String(v)));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`R2 upload failed: ${xhr.status} ${xhr.statusText} — verifique a configuração de CORS do bucket R2.`));
      };
      xhr.onerror = () => reject(new Error('Erro de rede no upload para R2 (verifique CORS do bucket).'));
      xhr.send(file);
    });

    return data.publicUrl as string;
  };

  const uploadFile = async (
    file: File,
    folder: string = 'uploads'
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setProgress(0);

      const url = file.size > PRESIGN_THRESHOLD_BYTES
        ? await uploadViaPresign(file, folder)
        : await uploadViaEdge(file, folder);

      return url;
    } catch (error: any) {
      console.error('R2 upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Erro ao enviar arquivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
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
        body: { action: 'delete', key },
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

  return { uploadFile, deleteFile, uploading, progress };
};
