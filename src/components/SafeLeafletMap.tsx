import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const DirectoryLeafletMap = React.lazy(() =>
  import('./maps/DirectoryLeafletMap')
    .then(module => ({ default: module.DirectoryLeafletMap }))
    .catch((e) => {
      console.error('Falha ao carregar DirectoryLeafletMap', e);
      throw e;
    })
);

interface SafeLeafletMapProps {
  businesses: Array<{
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

const MapFallback = ({ height }: { height?: string }) => (
  <Card className="border-muted" style={{ height: height || '400px' }}>
    <CardContent className="flex items-center justify-center h-full">
      <div className="text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    </CardContent>
  </Card>
);

export const SafeLeafletMap: React.FC<SafeLeafletMapProps> = (props) => {
  return (
    <ErrorBoundary fallback={<MapFallback height={props.height} />}>
      <Suspense fallback={<MapFallback height={props.height} />}>
        <DirectoryLeafletMap {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};