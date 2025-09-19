import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

interface UseGeocodingReturn {
  geocodeLocation: (city: string, state: string) => Promise<GeocodingResult | null>;
  loading: boolean;
  error: string | null;
}

// Cache em memória para evitar chamadas repetidas
const geocodeCache = new Map<string, GeocodingResult>();

// Coordenadas padrão para algumas cidades do RS
const defaultCoordinates: Record<string, GeocodingResult> = {
  'porto alegre-rs': { latitude: -30.0346, longitude: -51.2177, city: 'Porto Alegre', state: 'RS' },
  'canoas-rs': { latitude: -29.9175, longitude: -51.1834, city: 'Canoas', state: 'RS' },
  'pelotas-rs': { latitude: -31.7654, longitude: -52.3376, city: 'Pelotas', state: 'RS' },
  'caxias do sul-rs': { latitude: -29.1678, longitude: -51.1794, city: 'Caxias do Sul', state: 'RS' },
  'santa maria-rs': { latitude: -29.6842, longitude: -53.8069, city: 'Santa Maria', state: 'RS' },
  'gravataí-rs': { latitude: -29.9441, longitude: -50.9928, city: 'Gravataí', state: 'RS' },
  'viamão-rs': { latitude: -30.0811, longitude: -51.0233, city: 'Viamão', state: 'RS' },
  'novo hamburgo-rs': { latitude: -29.6783, longitude: -51.1309, city: 'Novo Hamburgo', state: 'RS' },
  'são leopoldo-rs': { latitude: -29.7604, longitude: -51.1472, city: 'São Leopoldo', state: 'RS' },
  'alvorada-rs': { latitude: -29.9897, longitude: -51.0828, city: 'Alvorada', state: 'RS' }
};

export const useGeocoding = (): UseGeocodingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeLocation = async (city: string, state: string): Promise<GeocodingResult | null> => {
    const cacheKey = `${city.toLowerCase()}-${state.toLowerCase()}`;
    
    // Verificar cache em memória primeiro
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    // Verificar coordenadas padrão
    if (defaultCoordinates[cacheKey]) {
      const result = defaultCoordinates[cacheKey];
      geocodeCache.set(cacheKey, result);
      return result;
    }

    setLoading(true);
    setError(null);

    try {
      // Tentar buscar da API do Nominatim (gratuita)
      const query = encodeURIComponent(`${city}, ${state}, Brazil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result: GeocodingResult = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            city,
            state
          };
          
          // Adicionar ao cache
          geocodeCache.set(cacheKey, result);
          return result;
        }
      }

      // Fallback para coordenadas do centro do RS
      const fallbackResult: GeocodingResult = {
        latitude: -30.0346,
        longitude: -51.2177,
        city,
        state
      };
      
      geocodeCache.set(cacheKey, fallbackResult);
      return fallbackResult;

    } catch (err) {
      console.error('Erro na geocodificação:', err);
      setError('Erro ao buscar coordenadas da localização');
      
      // Retornar coordenadas padrão do RS em caso de erro
      const fallbackResult: GeocodingResult = {
        latitude: -30.0346,
        longitude: -51.2177,
        city,
        state
      };
      
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  return {
    geocodeLocation,
    loading,
    error
  };
};