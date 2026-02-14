import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  altPrefix?: string;
}

export const ImageLightbox = ({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  altPrefix = 'Imagem'
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, goNext, goPrev, onOpenChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 bg-black/95 border-0 overflow-hidden [&>button]:hidden">
        <div
          className="relative flex items-center justify-center min-h-[50vh] max-h-[90vh]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-50 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
              {currentIndex + 1} de {images.length}
            </div>
          )}

          {/* Prev */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              className="absolute left-2 z-50 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Image */}
          <img
            src={images[currentIndex]}
            alt={`${altPrefix} ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain select-none"
            draggable={false}
          />

          {/* Next */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              className="absolute right-2 z-50 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
