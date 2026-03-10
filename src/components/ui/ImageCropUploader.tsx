import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Crop as CropIcon, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useR2Storage } from '@/hooks/useR2Storage';
import { cn } from '@/lib/utils';

export interface ImageDimensions {
  width: number;
  height: number;
  label?: string;
}

/** Predefined dimension presets for common image contexts */
export const IMAGE_PRESETS = {
  blogFeatured: { width: 1200, height: 630, label: 'Blog - Imagem destacada' },
  ambassadorPhoto: { width: 400, height: 400, label: 'Foto de perfil' },
  conectaBanner: { width: 1200, height: 300, label: 'Banner do perfil' },
  conectaMeeting: { width: 800, height: 600, label: 'Foto da reunião' },
  businessLogo: { width: 400, height: 400, label: 'Logo do negócio' },
  businessCover: { width: 1200, height: 675, label: 'Capa do negócio' },
  groupImage: { width: 800, height: 450, label: 'Imagem do grupo' },
} as const;

interface ImageCropUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  folder?: string;
  dimensions: ImageDimensions;
  /** Height of the preview area in Tailwind classes. Default: h-48 */
  previewHeight?: string;
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageCropUploader = ({
  value,
  onChange,
  className,
  label,
  folder = 'uploads',
  dimensions,
  previewHeight = 'h-48',
}: ImageCropUploaderProps) => {
  const { uploadFile, deleteFile, uploading } = useR2Storage();
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [cropping, setCropping] = useState(false);

  const aspect = dimensions.width / dimensions.height;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: uploading || cropping,
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect],
  );

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setCropping(true);
    try {
      const canvas = getCroppedCanvas(imgRef.current, completedCrop, dimensions.width, dimensions.height);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85),
      );
      const file = new File([blob], `crop-${Date.now()}.webp`, { type: 'image/webp' });
      const url = await uploadFile(file, folder);
      if (url) {
        onChange(url);
      }
      setCropDialogOpen(false);
      setImgSrc('');
    } finally {
      setCropping(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      await deleteFile(value);
      onChange(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      <p className="text-xs text-muted-foreground">
        Tamanho ideal: {dimensions.width} × {dimensions.height}px
      </p>

      {value ? (
        <div className="relative group">
          <img src={value} alt="Preview" className={cn('w-full object-cover rounded-md border', previewHeight)} />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
            <Button type="button" variant="destructive" size="sm" onClick={handleRemove} disabled={uploading}>
              <X className="w-4 h-4 mr-1" />
              Remover
            </Button>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button type="button" variant="secondary" size="sm" disabled={uploading}>
                <CropIcon className="w-4 h-4 mr-1" />
                Trocar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer transition-colors',
            isDragActive && 'border-primary bg-primary/5',
            (uploading || cropping) && 'opacity-50 cursor-not-allowed',
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {uploading || cropping ? (
            <p className="text-sm text-muted-foreground">Processando imagem...</p>
          ) : isDragActive ? (
            <p className="text-sm text-primary">Solte a imagem aqui...</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Arraste uma imagem aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, GIF ou WebP (máx. 10MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(o) => { if (!cropping) setCropDialogOpen(o); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Recortar imagem ({dimensions.width}×{dimensions.height}px)
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[60vh] overflow-auto">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minHeight={50}
              >
                <img ref={imgRef} src={imgSrc} alt="Crop" onLoad={onImageLoad} className="max-h-[55vh]" />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropDialogOpen(false); setImgSrc(''); }} disabled={cropping}>
              Cancelar
            </Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop || cropping}>
              <Check className="w-4 h-4 mr-1" />
              {cropping ? 'Enviando...' : 'Confirmar e enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
