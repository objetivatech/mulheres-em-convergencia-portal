import React, { useEffect, useRef, useState } from 'react';
// mapbox-gl is dynamically imported
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

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
  const map = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token from edge function or use fallback
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        setLoading(true);
        console.log('Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (!error && data?.token && data.token.startsWith('pk.')) {
          console.log('Token fetched successfully');
          setMapboxToken(data.token);
          setMapError(null);
        } else {
          console.warn('No valid token from edge function, using fallback');
          // Fallback token for development
          setMapboxToken('pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw');
          setMapError('Usando token de demonstração. Funcionalidade limitada.');
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setMapError('Falha ao carregar token do mapa. Usando fallback.');
        setMapboxToken('pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw');
      } finally {
        setLoading(false);
      }
    };
    getMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const init = async () => {
      try {
        console.log('Initializing map with token:', mapboxToken.substring(0, 20) + '...');
        const mapboxgl = await import('mapbox-gl');
        mapboxgl.default.accessToken = mapboxToken;
        
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: center as [number, number],
          zoom: zoom,
          touchPitch: false,
          pitchWithRotate: false,
        });

        const navControl = new mapboxgl.default.NavigationControl({
          showCompass: false,
          showZoom: true
        });
        map.current.addControl(navControl, 'top-right');

        // Add markers for businesses
        businesses.forEach(business => {
          if (business.latitude && business.longitude) {
            const marker = new mapboxgl.default.Marker({ color: '#C75A92' })
              .setLngLat([business.longitude, business.latitude])
              .setPopup(
                new mapboxgl.default.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-3">
                      <h3 class="font-semibold text-base mb-1">${business.name}</h3>
                      <p class="text-sm text-gray-600 mb-1">${business.category}</p>
                      <p class="text-xs text-gray-500 mb-2">${business.city}, ${business.state}</p>
                      ${onBusinessClick ? `<button onclick="window.handleBusinessClick('${business.id}')" class="w-full px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90">Ver Perfil</button>` : ''}
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

        // Auto-fit map to show all businesses if available
        const coordinates = businesses
          .filter(b => b.latitude && b.longitude)
          .map(b => [b.longitude!, b.latitude!] as [number, number]);
        
        if (coordinates.length > 1) {
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.default.LngLatBounds(coordinates[0], coordinates[0]));
          
          map.current!.fitBounds(bounds, { padding: 50 });
        }

        // Global function for popup buttons
        (window as any).handleBusinessClick = (businessId: string) => {
          if (onBusinessClick) {
            onBusinessClick(businessId);
          }
        };

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Erro ao carregar o mapa. Verifique sua conexão.');
      }
    };

    init();

    return () => {
      map.current?.remove();
      (window as any).handleBusinessClick = undefined;
    };
  }, [businesses, center, zoom, onBusinessClick, mapboxToken]);

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);

          if (map.current) {
            const mapboxgl = await import('mapbox-gl');
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });

            // Add user location marker
            new mapboxgl.default.Marker({ color: '#3b82f6' })
              .setLngLat([longitude, latitude])
              .setPopup(
                new mapboxgl.default.Popup({ offset: 25 })
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
    if (!searchLocation.trim() || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchLocation)}.json?access_token=${mapboxToken}&country=BR`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        
        if (map.current) {
          const mapboxgl = await import('mapbox-gl');
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 12
          });

          new mapboxgl.default.Marker({ color: '#22c55e' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 25 })
                .setHTML(`<div class="p-2"><p class="font-semibold">${data.features[0].place_name}</p></div>`)
            )
            .addTo(map.current);
        }
      }
    } catch (error) {
      console.error('Erro na busca por localização:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center rounded-lg border bg-muted/50" style={{ height }}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center rounded-lg border bg-muted/50" style={{ height }}>
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      </div>
    );
  }

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={searchByLocation} variant="outline" size="sm" disabled={!mapboxToken} aria-label="Buscar localização">
                  <MapPin className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar localização</TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={getCurrentLocation} variant="outline" size="sm" aria-label="Usar minha localização">
                <Navigation className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Usar minha localização</TooltipContent>
          </Tooltip>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg shadow-lg border"
        style={{ height }}
      />
    </div>
  );
};

export default Map;