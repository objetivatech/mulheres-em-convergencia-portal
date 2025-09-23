import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  height?: string;
}

export const MapErrorBoundary: React.FC<MapErrorBoundaryProps> = ({ 
  children, 
  height = '400px' 
}) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <Card className="border-muted" style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Erro ao carregar mapa. Verifique sua conexão.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    return (
      <Card className="border-muted" style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Mapa indisponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }
};