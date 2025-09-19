import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useBusinessServiceAreas } from '@/hooks/useBusinessServiceAreas';
import { supabase } from '@/integrations/supabase/client';

interface MapboxBusinessMapProps {
  businessId: string;
  businessName: string;
  businessCity?: string;
  businessState?: string;
  latitude?: number;
  longitude?: number;
}

export const MapboxBusinessMap: React.FC<MapboxBusinessMapProps> = ({
  businessId,
  businessName,
  businessCity,
  businessState,
  latitude,
  longitude
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const { serviceAreas, loading } = useBusinessServiceAreas(businessId);

  const initializeMap = async (token: string) => {
    if (!mapContainer.current || map.current) return;

    try {
      // Dynamically import Mapbox GL JS
      const mapboxgl = await import('mapbox-gl');
      
      // Set access token
      mapboxgl.default.accessToken = token;

      // Initialize map - center on Brazil if no coordinates
      const defaultCenter: [number, number] = [-47.8826, -15.7942]; // Center of Brazil
      const centerCoords: [number, number] = (latitude && longitude) ? [longitude, latitude] : defaultCenter;
      
      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: centerCoords,
        zoom: (latitude && longitude) ? 14 : 4,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.default.NavigationControl());

      // Add business location marker if coordinates available
      if (latitude && longitude) {
        new mapboxgl.default.Marker({ color: '#C75A92' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`<h3>${businessName}</h3><p>${businessCity}, ${businessState}</p>`)
          )
          .addTo(map.current);
      }

      // Add service area markers (simplified representation)
      // Note: In a production app, you'd geocode these locations for exact coordinates
      if (serviceAreas.length > 0) {
        serviceAreas.forEach((area) => {
          // Create a simple text marker for service areas without specific coordinates
          const el = document.createElement('div');
          el.className = 'service-area-marker';
          el.style.cssText = `
            background: #9191C0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;
          
          // Position relative to business location or default center
          const baseLat = latitude || -15.7942;
          const baseLng = longitude || -47.8826;
          
          new mapboxgl.default.Marker({ 
            element: el,
            anchor: 'center'
          })
            .setLngLat([baseLng, baseLat])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 15 })
                .setHTML(`
                  <div style="min-width: 150px;">
                    <strong>${area.area_name}</strong>
                    <br>
                    <small>${area.area_type === 'city' ? 'Cidade' : 'Bairro'}</small>
                    ${area.city ? `<br><small>${area.city}, ${area.state}</small>` : `<br><small>${area.state}</small>`}
                  </div>
                `)
            )
            .addTo(map.current);
        });
      }

    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError('Erro ao carregar o mapa. Verifique se o token do Mapbox está correto.');
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const token = formData.get('token') as string;
    
    if (token.trim()) {
      setMapboxToken(token.trim());
      localStorage.setItem('mapbox_token', token.trim());
      setShowTokenInput(false);
      setMapError(null);
    }
  };

  useEffect(() => {
    const resolveToken = async () => {
      try {
        // Try from edge function (Supabase secret)
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        const tokenFromSecret = (data as any)?.token as string | undefined;
        if (!error && tokenFromSecret && tokenFromSecret.startsWith('pk.')) {
          setMapboxToken(tokenFromSecret);
          setShowTokenInput(false);
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
      // Fallback to localStorage or show input
      const storedToken = localStorage.getItem('mapbox_token');
      if (storedToken) {
        setMapboxToken(storedToken);
        setShowTokenInput(false);
      } else {
        setShowTokenInput(true);
      }
    };

    resolveToken();
  }, []);

  useEffect(() => {
    if (mapboxToken && !loading) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken, serviceAreas, loading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Localização e Áreas de Atendimento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showTokenInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Configurar Mapa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Para exibir o mapa interativo, é necessário um token do Mapbox.
            </p>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <input
                type="text"
                name="token"
                placeholder="Token público do Mapbox (pk.xxx...)"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                required
              />
              <div className="flex gap-2 justify-center">
                <Button type="submit" size="sm">Configurar Mapa</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTokenInput(false)}
                >
                  Pular
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Obtenha seu token gratuito em: 
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                mapbox.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mapError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Localização e Áreas de Atendimento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">{mapError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokenInput(true)}
            >
              Configurar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Localização e Áreas de Atendimento</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Localização Principal */}
        {businessCity && businessState && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <h4 className="font-medium text-primary mb-1">Localização Principal</h4>
            <p className="text-sm">{businessName}</p>
            <p className="text-sm text-muted-foreground">{businessCity}, {businessState}</p>
          </div>
        )}

        <div className="h-64 rounded-lg overflow-hidden border relative">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* Áreas de Atendimento */}
        {serviceAreas.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Áreas de Atendimento</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceAreas.map((area) => (
                <div key={area.id} className="p-2 bg-muted rounded text-center">
                  <div className="text-sm font-medium">{area.area_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {area.area_type === 'city' ? 'Cidade' : 'Bairro'} • 
                    {area.area_type === 'neighborhood' && area.city ? ` ${area.city}, ${area.state}` : ` ${area.state}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {serviceAreas.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhuma área de atendimento específica cadastrada.</p>
            <p className="text-xs">O negócio atende na localização principal.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};