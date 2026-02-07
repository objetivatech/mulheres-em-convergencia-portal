import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ScrollableTabsContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableTabsContainer: React.FC<ScrollableTabsContainerProps> = ({
  children,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Re-check when children change
  useEffect(() => {
    checkScroll();
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 150;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      {/* Left Arrow */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 rounded-full transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('left')}
        aria-label="Rolar para esquerda"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
      >
        {children}
      </div>

      {/* Right Arrow */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 rounded-full transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('right')}
        aria-label="Rolar para direita"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
