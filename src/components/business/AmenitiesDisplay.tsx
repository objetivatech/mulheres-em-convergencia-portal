import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Wifi, 
  Car, 
  Accessibility, 
  Wind, 
  Dog, 
  Truck, 
  Calendar,
  Clock,
  Sparkles,
  QrCode,
  Baby,
  Cigarette,
  UtensilsCrossed,
  Armchair,
  ShieldCheck,
  Bike,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Amenity {
  name: string;
  icon: string;
  active: boolean;
}

interface AmenitiesDisplayProps {
  amenities: Amenity[];
  className?: string;
  columns?: 1 | 2;
}

// Mapeamento de ícones para componentes
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  Wifi,
  Car,
  Accessibility,
  Wind,
  Dog,
  Truck,
  Calendar,
  Clock,
  QrCode,
  Baby,
  Cigarette,
  UtensilsCrossed,
  Armchair,
  ShieldCheck,
  Bike,
  Sparkles,
  CheckCircle2,
};

export const AmenitiesDisplay: React.FC<AmenitiesDisplayProps> = ({
  amenities,
  className,
  columns = 2
}) => {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  const activeAmenities = amenities.filter(a => a.active);

  if (activeAmenities.length === 0) {
    return null;
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconComponents[iconName] || CheckCircle2;
    return <IconComponent className={className} />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Facilidades
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn(
          "grid gap-2",
          columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {activeAmenities.map((amenity, index) => (
            <div 
              key={`${amenity.name}-${index}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              {renderIcon(amenity.icon, "h-4 w-4 text-primary flex-shrink-0")}
              <span className="text-sm truncate">{amenity.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Versão inline (sem card) para uso em outras áreas
export const AmenitiesInline: React.FC<Omit<AmenitiesDisplayProps, 'columns'>> = ({
  amenities,
  className
}) => {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  const activeAmenities = amenities.filter(a => a.active);

  if (activeAmenities.length === 0) {
    return null;
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconComponents[iconName] || CheckCircle2;
    return <IconComponent className={className} />;
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {activeAmenities.map((amenity, index) => (
        <div 
          key={`${amenity.name}-${index}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
        >
          {renderIcon(amenity.icon, "h-3 w-3")}
          <span>{amenity.name}</span>
        </div>
      ))}
    </div>
  );
};

export default AmenitiesDisplay;
