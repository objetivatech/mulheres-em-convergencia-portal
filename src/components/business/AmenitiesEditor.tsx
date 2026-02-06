import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Wifi, 
  Car, 
  Accessibility, 
  Wind, 
  Dog, 
  Truck, 
  Calendar,
  Clock,
  Plus,
  X,
  Sparkles,
  QrCode,
  Baby,
  Cigarette,
  UtensilsCrossed,
  Armchair,
  ShieldCheck,
  Bike
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Amenity {
  name: string;
  icon: string;
  active: boolean;
}

interface AmenitiesEditorProps {
  value: Amenity[];
  onChange: (value: Amenity[]) => void;
}

// Lista de facilidades pré-definidas organizadas por categoria
const predefinedAmenities: Record<string, { name: string; icon: string }[]> = {
  'Pagamentos': [
    { name: 'Aceita Cartão de Crédito', icon: 'CreditCard' },
    { name: 'Aceita Cartão de Débito', icon: 'CreditCard' },
    { name: 'Aceita PIX', icon: 'QrCode' },
  ],
  'Conectividade': [
    { name: 'Wi-Fi Gratuito', icon: 'Wifi' },
  ],
  'Estacionamento': [
    { name: 'Estacionamento Próprio', icon: 'Car' },
    { name: 'Estacionamento Gratuito', icon: 'Car' },
    { name: 'Bicicletário', icon: 'Bike' },
  ],
  'Acessibilidade': [
    { name: 'Acessível para Cadeirantes', icon: 'Accessibility' },
    { name: 'Fraldário', icon: 'Baby' },
  ],
  'Conforto': [
    { name: 'Ar Condicionado', icon: 'Wind' },
    { name: 'Área Externa', icon: 'Armchair' },
    { name: 'Área para Fumantes', icon: 'Cigarette' },
  ],
  'Pets': [
    { name: 'Aceita Pets', icon: 'Dog' },
    { name: 'Pet Friendly', icon: 'Dog' },
  ],
  'Serviços': [
    { name: 'Delivery', icon: 'Truck' },
    { name: 'Retirada no Local', icon: 'UtensilsCrossed' },
    { name: 'Reservas Online', icon: 'Calendar' },
    { name: 'Agendamento Online', icon: 'Clock' },
  ],
  'Segurança': [
    { name: 'Ambiente Seguro', icon: 'ShieldCheck' },
  ],
};

// Mapeamento de ícones para componentes
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  Wifi,
  Car,
  Accessibility,
  Wind,
  Dog,
  Truck,
  Calendar,
  Clock,
  QrCode,
  Baby,
  Cigarette,
  UtensilsCrossed,
  Armchair,
  ShieldCheck,
  Bike,
  Sparkles, // Default para custom
};

export const AmenitiesEditor: React.FC<AmenitiesEditorProps> = ({
  value,
  onChange
}) => {
  const [amenities, setAmenities] = useState<Amenity[]>(value || []);
  const [customAmenity, setCustomAmenity] = useState('');

  useEffect(() => {
    if (value) {
      setAmenities(value);
    }
  }, [value]);

  const updateAmenities = (newAmenities: Amenity[]) => {
    setAmenities(newAmenities);
    onChange(newAmenities);
  };

  const toggleAmenity = (name: string, icon: string) => {
    const existing = amenities.find(a => a.name === name);
    
    if (existing) {
      // Remover
      updateAmenities(amenities.filter(a => a.name !== name));
    } else {
      // Adicionar
      updateAmenities([...amenities, { name, icon, active: true }]);
    }
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    
    const exists = amenities.find(a => a.name.toLowerCase() === customAmenity.toLowerCase());
    if (exists) {
      setCustomAmenity('');
      return;
    }

    updateAmenities([...amenities, { name: customAmenity.trim(), icon: 'Sparkles', active: true }]);
    setCustomAmenity('');
  };

  const removeAmenity = (name: string) => {
    updateAmenities(amenities.filter(a => a.name !== name));
  };

  const isSelected = (name: string) => amenities.some(a => a.name === name);

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconComponents[iconName] || Sparkles;
    return <IconComponent className={className} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Facilidades Oferecidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Facilidades Selecionadas */}
        {amenities.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Facilidades selecionadas:</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map(amenity => (
                <div
                  key={amenity.name}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                >
                  {renderIcon(amenity.icon, "h-3 w-3")}
                  <span>{amenity.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity.name)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remover ${amenity.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorias de Facilidades */}
        {Object.entries(predefinedAmenities).map(([category, items]) => (
          <div key={category}>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              {category}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(item => (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected(item.name) 
                      ? "bg-primary/5 border-primary" 
                      : "bg-background border-border hover:bg-muted/50"
                  )}
                  onClick={() => toggleAmenity(item.name, item.icon)}
                >
                  <Checkbox
                    checked={isSelected(item.name)}
                    onCheckedChange={() => toggleAmenity(item.name, item.icon)}
                    aria-label={item.name}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {renderIcon(item.icon, cn(
                      "h-4 w-4 flex-shrink-0",
                      isSelected(item.name) ? "text-primary" : "text-muted-foreground"
                    ))}
                    <span className={cn(
                      "text-sm truncate",
                      isSelected(item.name) ? "font-medium" : ""
                    )}>
                      {item.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Adicionar Facilidade Customizada */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium mb-2 block">
            Adicionar facilidade personalizada
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              placeholder="Ex: Sala de reunião"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomAmenity}
              disabled={!customAmenity.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmenitiesEditor;
