import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_highlighted: boolean;
  highlight_label: string | null;
}

interface MenuItemDetailModalProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const highlightLabels: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  popular: { label: 'Mais Vendido', color: 'bg-orange-100 text-orange-700' },
  promocao: { label: 'Promoção', color: 'bg-red-100 text-red-700' },
  destaque: { label: 'Destaque', color: 'bg-purple-100 text-purple-700' },
  vegano: { label: 'Vegano', color: 'bg-green-100 text-green-700' },
  vegetariano: { label: 'Vegetariano', color: 'bg-emerald-100 text-emerald-700' },
};

const formatPrice = (price: number | null) => {
  if (price === null) return 'Consultar';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

const ModalContent: React.FC<{ item: MenuItem }> = ({ item }) => {
  const highlight = item.highlight_label ? highlightLabels[item.highlight_label] : null;

  return (
    <div className="space-y-4">
      {/* Image */}
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Header with badges */}
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
        {item.is_highlighted && highlight && (
          <Badge className={cn('text-xs', highlight.color)}>
            {highlight.label}
          </Badge>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-muted-foreground leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Price */}
      <div className="pt-2 border-t">
        <span className="text-2xl font-bold text-primary">
          {formatPrice(item.price)}
        </span>
      </div>
    </div>
  );
};

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();

  if (!item) return null;

  // Use Sheet (bottom drawer) on mobile for better UX
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>{item.name}</SheetTitle>
          </SheetHeader>
          <div className="pt-4">
            <ModalContent item={item} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Use Dialog on desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        <ModalContent item={item} />
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemDetailModal;
