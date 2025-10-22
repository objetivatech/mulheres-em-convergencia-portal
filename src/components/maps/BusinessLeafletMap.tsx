import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useBusinessServiceAreas } from '@/hooks/useBusinessServiceAreas';
import { useGeocoding } from '@/hooks/useGeocoding';
import 'leaflet/dist/leaflet.css';

interface BusinessLeafletMapProps {
  businessId: string;
  businessName: string;
  businessCity?: string;
  businessState?: string;
  latitude?: number;
  longitude?: number;
}

export const BusinessLeafletMap: React.FC<BusinessLeafletMapProps> = ({
  businessId,
  businessName,
  businessCity,
  businessState,
  latitude,
  longitude
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    latitude || -15.7942,
    longitude || -47.8822
  ]);
  const [mapZoom, setMapZoom] = useState(latitude && longitude ? 12 : 5);

  // Buscar áreas de atendimento
  const { serviceAreas = [], loading: areasLoading } = useBusinessServiceAreas(businessId);
  const { geocodeLocation } = useGeocoding();
  const [geocodedAreas, setGeocodedAreas] = useState<Array<{
    name: string;
    coordinates: [number, number];
  }>>([]);

  // Geocodificar áreas de atendimento
  useEffect(() => {
    const geocodeAreas = async () => {
      if (!serviceAreas.length) return;

      const geocoded = [];
      for (const area of serviceAreas) {
        try {
          let locationQuery = area.area_name;
          
          // Se for bairro e tiver cidade, melhorar precisão
          if (area.area_type === 'neighborhood' && area.city) {
            locationQuery = `${area.area_name} - ${area.city}`;
          }
          
          const coords = await geocodeLocation(locationQuery, area.state);
          if (coords && coords.latitude && coords.longitude) {
            geocoded.push({
              name: area.area_name,
              coordinates: [coords.latitude, coords.longitude] as [number, number]
            });
          }
        } catch (error) {
          console.error(`Erro ao geocodificar ${area.area_name}:`, error);
        }
      }
      setGeocodedAreas(geocoded);
    };

    geocodeAreas();
  }, [serviceAreas, geocodeLocation]);

  // Definir centro e zoom baseado na localização do negócio
  useEffect(() => {
    if (latitude && longitude) {
      // Centralizar no endereço do negócio
      setMapCenter([latitude, longitude]);
      setMapZoom(12);
    } else if (businessCity && businessState) {
      // Geocodificar a cidade do negócio se não tiver coordenadas exatas
      geocodeLocation(businessCity, businessState)
        .then(coords => {
          if (coords && coords.latitude && coords.longitude) {
            setMapCenter([coords.latitude, coords.longitude]);
            setMapZoom(11);
          }
        })
        .catch(console.error);
    }
  }, [latitude, longitude, businessCity, businessState, geocodeLocation]);

  // Ícones customizados
  const businessIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const serviceAreaIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [1, -28],
    shadowSize: [33, 33]
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada neste navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        setMapZoom(12);
        toast.success('Localização encontrada!');
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.error('Não foi possível obter sua localização');
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Localização e Áreas de Atendimento</h3>
          <p className="text-sm text-muted-foreground">
            {businessCity && businessState ? `${businessCity}, ${businessState}` : 'Localização não informada'}
          </p>
        </div>
        <Button 
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Minha Localização
        </Button>
      </div>

      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marker principal do negócio */}
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={businessIcon}>
              <Popup>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{businessName}</h4>
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    Localização Principal
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Círculos das áreas de atendimento */}
          {geocodedAreas.map((area, index) => (
            <Circle
              key={index}
              center={area.coordinates}
              radius={5000} // 5km de raio
              pathOptions={{
                color: '#10b981', // verde
                fillColor: '#10b981',
                fillOpacity: 0.2,
                weight: 2
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{area.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Área de Atendimento (raio de 5km)
                  </p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Lista de áreas de atendimento */}
      {serviceAreas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Áreas de Atendimento:</h4>
          <div className="grid grid-cols-2 gap-2">
            {serviceAreas.map((area) => (
              <div 
                key={area.id} 
                className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{area.area_name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {geocodedAreas.length} de {serviceAreas.length} áreas localizadas no mapa
          </p>
        </div>
      )}

      {areasLoading && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Carregando áreas de atendimento...
        </div>
      )}
    </div>
  );
};