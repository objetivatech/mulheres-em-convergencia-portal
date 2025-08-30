import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  bucket?: string;
}

export const ImageUploader = ({ 
  value, 
  onChange, 
  className,
  label = 'Imagem destacada',
  bucket = 'blog-images'
}: ImageUploaderProps) => {
  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = await uploadImage(file, bucket);
      if (url) {
        onChange(url);
      }
    }
  }, [uploadImage, onChange, bucket]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleRemove = async () => {
    if (value) {
      const success = await deleteImage(value, bucket);
      if (success) {
        onChange(null);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-md border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-primary/5",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          
          {uploading ? (
            <p className="text-sm text-muted-foreground">
              Enviando imagem...
            </p>
          ) : isDragActive ? (
            <p className="text-sm text-primary">
              Solte a imagem aqui...
            </p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG, GIF ou WebP (máx. 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};