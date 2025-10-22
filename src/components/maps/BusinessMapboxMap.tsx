import React, { useEffect, useState } from 'react';
import Map from '@/components/ui/map';
import { useBusinessServiceAreas } from '@/hooks/useBusinessServiceAreas';
import { useGeocoding } from '@/hooks/useGeocoding';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';

interface BusinessMapboxMapProps {
  businessId: string;
  businessName: string;
  businessCity?: string;
  businessState?: string;
  latitude?: number;
  longitude?: number;
  height?: string;
}

interface GeocodedArea {
  id: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
}

export const BusinessMapboxMap: React.FC<BusinessMapboxMapProps> = ({
  businessId,
  businessName,
  businessCity,
  businessState,
  latitude,
  longitude,
  height = '300px'
}) => {
  const { serviceAreas, loading: areasLoading } = useBusinessServiceAreas(businessId);
  const { geocodeLocation, loading: geocoding } = useGeocoding();
  const [geocodedAreas, setGeocodedAreas] = useState<GeocodedArea[]>([]);

  // Geocodificar as áreas de atendimento
  useEffect(() => {
    const geocodeAreas = async () => {
      if (serviceAreas.length === 0) return;

      const results: GeocodedArea[] = [];
      
      for (const area of serviceAreas) {
        const cityName = area.area_type === 'city' ? area.area_name : area.city;
        if (cityName && area.state) {
          const coords = await geocodeLocation(cityName, area.state);
          results.push({
            id: area.id,
            name: area.area_name,
            type: area.area_type,
            latitude: coords?.latitude,
            longitude: coords?.longitude
          });
        }
      }
      
      setGeocodedAreas(results);
    };

    geocodeAreas();
  }, [serviceAreas, geocodeLocation]);

  // Negócio principal
  const mainBusiness = latitude && longitude ? [{
    id: businessId,
    name: businessName,
    latitude,
    longitude,
    category: 'Localização principal',
    city: businessCity || '',
    state: businessState || ''
  }] : [];
  
  // Áreas de atendimento como polígonos/círculos
  const serviceAreaCircles = geocodedAreas
    .filter(area => area.latitude && area.longitude)
    .map(area => ({
      id: area.id,
      name: area.name,
      latitude: area.latitude!,
      longitude: area.longitude!,
      radius: 5000, // 5km
      type: area.type
    }));

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const center = hasCoords ? ([longitude as number, latitude as number] as [number, number]) : undefined;

  return (
    <div className="space-y-4">
      {/* Lista de áreas de atendimento */}
      {serviceAreas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Áreas de Atendimento
          </h3>
          <div className="flex flex-wrap gap-2">
            {areasLoading || geocoding ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando áreas...
              </div>
            ) : (
              serviceAreas.map(area => {
                const isGeocoded = geocodedAreas.some(
                  ga => ga.id === area.id && ga.latitude && ga.longitude
                );
                return (
                  <Badge 
                    key={area.id} 
                    variant={isGeocoded ? "default" : "secondary"}
                    className="gap-1"
                  >
                    <MapPin className={`w-3 h-3 ${isGeocoded ? 'opacity-100' : 'opacity-50'}`} />
                    {area.area_name}
                    {area.area_type === 'neighborhood' && area.city && ` - ${area.city}`}
                  </Badge>
                );
              })
            )}
          </div>
          {geocodedAreas.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {geocodedAreas.filter(a => a.latitude && a.longitude).length} de {serviceAreas.length} áreas exibidas no mapa
            </p>
          )}
        </div>
      )}

      {/* Mapa */}
      <Map
        businesses={mainBusiness}
        serviceAreas={serviceAreaCircles}
        center={center}
        zoom={hasCoords ? 12 : 10}
        height={height}
        showSearch={false}
      />
    </div>
  );
};
