import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Resumo de nota: ★ 4,8 (12). Não mostra nada se não houver avaliações. */
export default function Estrelas({ media, total, className, compacto }: { media?: number; total?: number; className?: string; compacto?: boolean }) {
  if (!total) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)} aria-label={`Nota ${media?.toFixed(1)} de 5, ${total} avaliações`}>
      <Star className="h-4 w-4 fill-primary text-primary" />
      <span className="font-medium">{media!.toFixed(1).replace('.', ',')}</span>
      <span className="text-muted-foreground">({total}{compacto ? '' : total === 1 ? ' avaliação' : ' avaliações'})</span>
    </span>
  );
}
