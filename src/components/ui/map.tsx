import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';

interface MapProps {
  businesses?: Array<{
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    category: string;
    city: string;
    state: string;
  }>;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showSearch?: boolean;
  onBusinessClick?: (businessId: string) => void;
}

const Map: React.FC<MapProps> = ({
  businesses = [],
  center = [-51.2177, -30.0346], // Porto Alegre, RS
  zoom = 10,
  height = '400px',
  showSearch = false,
  onBusinessClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get Mapbox token from environment or use fallback
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for businesses
    businesses.forEach(business => {
      if (business.latitude && business.longitude) {
        const marker = new mapboxgl.Marker({
          color: 'hsl(337, 49%, 57%)'
        })
        .setLngLat([business.longitude, business.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${business.name}</h3>
                <p class="text-sm text-gray-600">${business.category}</p>
                <p class="text-xs text-gray-500">${business.city}, ${business.state}</p>
                ${onBusinessClick ? `<button onclick="window.handleBusinessClick('${business.id}')" class="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-sm">Ver Perfil</button>` : ''}
              </div>
            `)
        )
        .addTo(map.current!);

        // Handle marker click
        marker.getElement().addEventListener('click', () => {
          if (onBusinessClick) {
            onBusinessClick(business.id);
          }
        });
      }
    });

    // Global function for popup buttons
    (window as any).handleBusinessClick = (businessId: string) => {
      if (onBusinessClick) {
        onBusinessClick(businessId);
      }
    };

    return () => {
      map.current?.remove();
    };
  }, [businesses, center, zoom, onBusinessClick]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });

            // Add user location marker
            new mapboxgl.Marker({ color: 'hsl(217, 91%, 60%)' })
              .setLngLat([longitude, latitude])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML('<div class="p-2"><p class="font-semibold">Sua localização</p></div>')
              )
              .addTo(map.current);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  };

  const searchByLocation = async () => {
    if (!searchLocation.trim()) return;

    try {
      // Simple geocoding simulation - in real app, use Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchLocation)}.json?access_token=${mapboxgl.accessToken}&country=BR`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 12
          });

          new mapboxgl.Marker({ color: 'hsl(159, 75%, 40%)' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div class="p-2"><p class="font-semibold">${data.features[0].place_name}</p></div>`)
            )
            .addTo(map.current);
        }
      }
    } catch (error) {
      console.error('Erro na busca por localização:', error);
    }
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar localização..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchByLocation()}
            />
            <Button onClick={searchByLocation} variant="outline" size="sm">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={getCurrentLocation} variant="outline" size="sm">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg shadow-lg"
        style={{ height }}
      />
    </div>
  );
};

export default Map;