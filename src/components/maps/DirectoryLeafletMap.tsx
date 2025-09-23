import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// Fix para ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Business {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  category: string;
  city: string;
  state: string;
}

interface DirectoryLeafletMapProps {
  businesses: Business[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showSearch?: boolean;
  onBusinessClick?: (businessId: string) => void;
}

// Componente para centralizar o mapa
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

export const DirectoryLeafletMap: React.FC<DirectoryLeafletMapProps> = ({
  businesses,
  center = [-15.7942, -47.8822], // Centro do Brasil
  zoom = 5,
  height = '400px',
  showSearch = false,
  onBusinessClick
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filtrar negócios com coordenadas válidas
  const validBusinesses = businesses.filter(
    business => business.latitude && business.longitude
  );

  // Se houver erro crítico, mostrar mensagem
  if (mapError) {
    return (
      <div className="p-4 text-center bg-muted rounded-lg" style={{ height }}>
        <p className="text-muted-foreground">Erro ao carregar mapa: {mapError}</p>
      </div>
    );
  }

  // Ícone customizado para negócios
  const businessIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Ícone para localização do usuário
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Obter localização do usuário
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada neste navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);
        setMapCenter([lat, lng]);
        setMapZoom(12);
        toast.success('Localização encontrada!');
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.error('Não foi possível obter sua localização');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Buscar localização por nome usando Nominatim (OpenStreetMap)
  const searchByLocation = async () => {
    if (!searchTerm.trim()) {
      toast.error('Digite o nome de uma cidade ou endereço');
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=br&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setMapCenter([lat, lng]);
        setMapZoom(12);
        toast.success(`Localização encontrada: ${result.display_name}`);
      } else {
        toast.error('Localização não encontrada');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar localização');
    }
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar cidade ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchByLocation()}
            />
          </div>
          <Button 
            onClick={searchByLocation}
            variant="outline"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            onClick={getCurrentLocation}
            variant="outline"
            size="icon"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div style={{ height }} className="rounded-lg overflow-hidden border">
        {validBusinesses.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-muted/30">
            <p className="text-muted-foreground">Nenhum negócio com localização encontrado</p>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            whenReady={() => {
              // Log do mapa criado para debug
              console.log('Mapa Leaflet criado com sucesso');
            }}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marker para localização do usuário */}
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>Sua localização</strong>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Markers para negócios */}
            {validBusinesses.map((business) => (
              <Marker
                key={business.id}
                position={[business.latitude!, business.longitude!]}
                icon={businessIcon}
              >
                <Popup>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-sm">{business.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {business.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {business.city}, {business.state}
                      </p>
                    </div>
                    {onBusinessClick && (
                      <Button 
                        size="sm" 
                        onClick={() => onBusinessClick(business.id)}
                        className="text-xs"
                      >
                        Ver Perfil
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Mostrando {validBusinesses.length} negócios no mapa
      </div>
    </div>
  );
};