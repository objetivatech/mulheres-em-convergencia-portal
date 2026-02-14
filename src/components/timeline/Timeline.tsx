import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Play, Pause } from 'lucide-react';
import { Button as ShadButton } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { useTimeline } from '@/hooks/useTimeline';

interface TimelineProps {
  yearFilter?: number | null;
  onYearChange?: (year: number | null) => void;
}

export const Timeline = ({ yearFilter, onYearChange }: TimelineProps) => {
  const { items: timelineData, years, loading } = useTimeline(yearFilter);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3;
  };

  const [itemsToShow, setItemsToShow] = useState(getItemsPerView);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const maxIndex = Math.max(0, timelineData.length - itemsToShow);

  useEffect(() => {
    setCurrentIndex(0);
  }, [yearFilter]);

  useEffect(() => {
    const handleResize = () => setItemsToShow(getItemsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1 > maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, maxIndex]);

  const nextSlide = () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  const prevSlide = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const allImages = timelineData
    .filter(item => item.image_url)
    .map(item => item.image_url!);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (timelineData.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Nenhum item encontrado para este período.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            Nossa Jornada
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os principais marcos da nossa história e como chegamos até aqui
          </p>
        </header>

        {years.length > 0 && onYearChange && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap mb-8">
            <ShadButton
              variant={yearFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onYearChange(null)}
              className="rounded-full whitespace-nowrap"
            >
              Todos
            </ShadButton>
            {years.map(year => (
              <ShadButton
                key={year}
                variant={yearFilter === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => onYearChange(year)}
                className="rounded-full whitespace-nowrap"
              >
                {year}
              </ShadButton>
            ))}
          </div>
        )}

        <div className="relative max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="h-10 w-10 rounded-full"
                title={isAutoPlaying ? "Pausar apresentação automática" : "Retomar apresentação automática"}
              >
                {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => { setCurrentIndex(index); setIsAutoPlaying(false); }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentIndex === index 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={currentIndex === maxIndex}
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          <div className="overflow-hidden" ref={sliderRef}>
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
            >
              {timelineData.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex-none px-4 ${
                    itemsToShow === 1 ? 'w-full' :
                    itemsToShow === 2 ? 'w-1/2' : 'w-1/3'
                  }`}
                >
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    {item.image_url && (
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                          onClick={() => {
                            const imgIdx = allImages.indexOf(item.image_url!);
                            setSelectedImageIndex(imgIdx >= 0 ? imgIdx : 0);
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium text-primary">{item.date_label}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-card-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%` }}
            />
          </div>
        </div>

        <ImageLightbox
          images={allImages}
          initialIndex={selectedImageIndex ?? 0}
          open={selectedImageIndex !== null}
          onOpenChange={(open) => { if (!open) setSelectedImageIndex(null); }}
          altPrefix="Timeline"
        />
      </div>
    </section>
  );
};
