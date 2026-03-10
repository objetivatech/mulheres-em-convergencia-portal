import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';
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
  return (
    <ImageCropUploader
      value={value}
      onChange={onChange}
      className={className}
      label={label}
      folder={bucket}
      dimensions={IMAGE_PRESETS.blogFeatured}
    />
  );
};
