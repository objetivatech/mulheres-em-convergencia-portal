import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Plus } from 'lucide-react';
import type { AddressOption } from '@/hooks/useSmartFormFiller';

interface AddressSelectorProps {
  addresses: AddressOption[];
  selectedId?: string;
  onSelect: (addressId: string | null) => void;
  onNewAddress?: () => void;
  title?: string;
  className?: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedId,
  onSelect,
  onNewAddress,
  title = "Selecionar Endereço",
  className = "",
}) => {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <RadioGroup 
          value={selectedId || ''} 
          onValueChange={(value) => onSelect(value || null)}
          className="space-y-3"
        >
          {addresses.map((option) => (
            <div key={option.id} className="flex items-start space-x-2">
              <RadioGroupItem 
                value={option.id} 
                id={`address-${option.id}`}
                className="mt-1"
              />
              <Label 
                htmlFor={`address-${option.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {option.address.street}, {option.address.number || 'S/N'}
                    </span>
                    {option.address.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.address.complement && `${option.address.complement}, `}
                    {option.address.neighborhood && `${option.address.neighborhood}, `}
                    {option.address.city}/{option.address.state}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.address.postal_code && `CEP: ${option.address.postal_code} • `}
                    Tipo: {option.address.address_type}
                  </div>
                </div>
              </Label>
            </div>
          ))}
          
          {/* Option for new address */}
          <div className="flex items-center space-x-2 border-t pt-3">
            <RadioGroupItem value="" id="new-address" className="mt-0.5" />
            <Label htmlFor="new-address" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 text-sm">
                <Plus className="h-3 w-3" />
                Usar novo endereço
              </div>
            </Label>
          </div>
        </RadioGroup>

        {onNewAddress && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onNewAddress}
            className="w-full mt-3"
          >
            <Plus className="h-3 w-3 mr-1" />
            Cadastrar Novo Endereço
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressSelector;