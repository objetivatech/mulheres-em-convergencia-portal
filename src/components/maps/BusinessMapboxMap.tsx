import React from 'react';
import Map from '@/components/ui/map';

interface BusinessMapboxMapProps {
  businessId: string;
  businessName: string;
  businessCity?: string;
  businessState?: string;
  latitude?: number;
  longitude?: number;
  height?: string;
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
  const businesses = [
    {
      id: businessId,
      name: businessName,
      latitude,
      longitude,
      category: 'Negócio',
      city: businessCity || '',
      state: businessState || ''
    }
  ];

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const center = hasCoords ? ([longitude as number, latitude as number] as [number, number]) : undefined;

  return (
    <Map
      businesses={businesses}
      center={center}
      zoom={hasCoords ? 13 : 10}
      height={height}
      showSearch={false}
    />
  );
};
