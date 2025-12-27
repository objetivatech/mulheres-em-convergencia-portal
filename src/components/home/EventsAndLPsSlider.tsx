import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Sparkles, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEventsAndLPs } from '@/hooks/useEventsAndLPs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Autoplay from 'embla-carousel-autoplay';

interface SliderItem {
  id: string;
  type: 'event' | 'landing_page';
  title: string;
  description: string;
  imageUrl?: string;
  href: string;
  date?: Date;
  badge?: string;
  featured?: boolean;
}

const EventsAndLPsSlider: React.FC = () => {
  const { items, loading } = useEventsAndLPs();

  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true }),
    []
  );

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null; // Não exibe se não há itens
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-primary border-primary">
            <Sparkles className="h-3 w-3 mr-1" />
            Próximas Atividades
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Eventos & Oportunidades
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Confira os próximos eventos, workshops e oportunidades exclusivas para 
            impulsionar sua jornada empreendedora.
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[autoplayPlugin]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {items.map((item) => (
              <CarouselItem key={`${item.type}-${item.id}`} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <SliderCard item={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link to="/eventos">
              Ver Todos os Eventos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const SliderCard: React.FC<{ item: SliderItem }> = ({ item }) => {
  const isEvent = item.type === 'event';

  return (
    <Link to={item.href} className="block h-full">
      <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-tertiary/30 overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isEvent ? (
                <Calendar className="h-16 w-16 text-primary/50" />
              ) : (
                <Sparkles className="h-16 w-16 text-primary/50" />
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge 
              variant={isEvent ? 'default' : 'secondary'}
              className="shadow-md"
            >
              {isEvent ? 'Evento' : 'Workshop'}
            </Badge>
            {item.featured && (
              <Badge variant="destructive" className="shadow-md">
                Destaque
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Date for events */}
          {item.date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {format(item.date, "dd 'de' MMMM", { locale: ptBR })}
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>

          {/* CTA */}
          <div className="pt-2">
            <span className="text-sm font-medium text-primary flex items-center group-hover:gap-2 transition-all">
              {isEvent ? 'Saiba mais' : 'Quero participar'}
              <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default EventsAndLPsSlider;