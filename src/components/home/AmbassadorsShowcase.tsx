import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, Users } from 'lucide-react';
import { usePublicAmbassadors } from '@/hooks/usePublicAmbassadors';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils';

interface AmbassadorsShowcaseProps {
  className?: string;
}

const AmbassadorsShowcase: React.FC<AmbassadorsShowcaseProps> = ({ className }) => {
  const { data: ambassadors, isLoading } = usePublicAmbassadors();

  // Don't render if no ambassadors
  if (isLoading || !ambassadors || ambassadors.length === 0) {
    return null;
  }

  // Limit to 8 ambassadors for carousel
  const displayAmbassadors = ambassadors.slice(0, 8);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getLocation = (city?: string | null, state?: string | null) => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return null;
  };

  return (
    <section className={cn('py-16 bg-muted/30', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-3">
            <Users className="h-4 w-4" />
            <span>Embaixadoras MeC</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-nexa font-bold text-foreground mb-4">
            Quem nos Representa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conheça as mulheres que levam a missão da MeC para suas comunidades,
            conectando empreendedoras e fortalecendo nossa rede.
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {displayAmbassadors.map((ambassador) => {
              const location = getLocation(ambassador.public_city, ambassador.public_state);

              return (
                <CarouselItem
                  key={ambassador.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="flex flex-col items-center p-6 bg-background rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                    <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarImage
                        src={ambassador.public_photo_url || undefined}
                        alt={ambassador.public_name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                        {getInitials(ambassador.public_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-semibold text-foreground text-center mb-1">
                      {ambassador.public_name}
                    </h3>
                    
                    {location && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button asChild size="lg">
            <Link to="/embaixadoras">
              Conheça nossas Embaixadoras
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AmbassadorsShowcase;
