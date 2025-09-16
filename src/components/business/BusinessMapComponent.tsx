import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { useBusinessServiceAreas } from '@/hooks/useBusinessServiceAreas';

interface BusinessMapComponentProps {
  businessId: string;
  businessName: string;
  businessCity?: string;
  businessState?: string;
  latitude?: number;
  longitude?: number;
}

export const BusinessMapComponent: React.FC<BusinessMapComponentProps> = ({
  businessId,
  businessName,
  businessCity,
  businessState,
  latitude,
  longitude
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const { serviceAreas, loading } = useBusinessServiceAreas(businessId);

  useEffect(() => {
    // Simulated map implementation
    // In a real implementation, you would integrate with Mapbox GL JS here
    if (!mapContainer.current) return;

    try {
      // Mock map initialization
      const mapElement = mapContainer.current;
      mapElement.innerHTML = `
        <div class="w-full h-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
          <div class="text-center">
            <div class="text-6xl mb-4">🗺️</div>
            <p class="text-sm text-muted-foreground">Mapa interativo</p>
            <p class="text-xs text-muted-foreground mt-1">Integração com Mapbox será implementada</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao carregar o mapa');
    }
  }, [latitude, longitude, serviceAreas]);

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
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{mapError}</p>
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

        {/* Mapa */}
        <div className="h-64" ref={mapContainer} />

        {/* Áreas de Atendimento */}
        {serviceAreas.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Áreas de Atendimento</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceAreas.map((area) => (
                <div key={area.id} className="p-2 bg-muted rounded text-center">
                  <div className="text-sm font-medium">{area.area_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {area.area_type === 'city' ? 'Cidade' : 'Bairro'} • {area.state}
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