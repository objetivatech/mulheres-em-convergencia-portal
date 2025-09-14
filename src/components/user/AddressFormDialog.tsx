import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddressFormData {
  id?: string;
  address_type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code?: string;
  is_primary: boolean;
}

interface AddressFormDialogProps {
  open: boolean;
  loading?: boolean;
  address?: AddressFormData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddressFormDialog: React.FC<AddressFormDialogProps> = ({
  open,
  loading = false,
  address,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<AddressFormData>({
    address_type: 'home',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    is_primary: false
  });
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData(address);
    } else {
      setFormData({
        address_type: 'home',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        postal_code: '',
        is_primary: false
      });
    }
  }, [address, open]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData({ ...formData, postal_code: cleanCep });

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.street.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (logradouro, cidade, estado)',
        variant: 'destructive'
      });
      return;
    }

    try {
      const addressData = {
        user_id: user.id,
        address_type: formData.address_type,
        street: formData.street.trim(),
        number: formData.number?.trim() || null,
        complement: formData.complement?.trim() || null,
        neighborhood: formData.neighborhood?.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        postal_code: formData.postal_code?.replace(/\D/g, '') || null,
        is_primary: formData.is_primary,
        country: 'Brasil'
      };

      if (address?.id) {
        // Update existing address
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', address.id);

        if (error) throw error;

        // Log activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'address_updated',
          p_description: `Endereço ${formData.address_type} atualizado`,
          p_metadata: { address_id: address.id, address_type: formData.address_type }
        });

        toast({
          title: 'Endereço atualizado',
          description: 'Endereço atualizado com sucesso!'
        });
      } else {
        // Create new address
        const { error } = await supabase
          .from('user_addresses')
          .insert(addressData);

        if (error) throw error;

        // Log activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'address_added',
          p_description: `Novo endereço ${formData.address_type} adicionado`,
          p_metadata: { address_type: formData.address_type }
        });

        toast({
          title: 'Endereço adicionado',
          description: 'Endereço adicionado com sucesso!'
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Address save error:', error);
      
      let errorMessage = 'Erro ao salvar endereço';
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Você já possui um endereço cadastrado com esses dados';
      } else if (error.message?.includes('violates check constraint')) {
        errorMessage = 'Dados do endereço são inválidos';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? 'Editar Endereço' : 'Adicionar Endereço'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do seu endereço
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address_type">Tipo de Endereço</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value) => setFormData({ ...formData, address_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Residencial</SelectItem>
                <SelectItem value="work">Comercial</SelectItem>
                <SelectItem value="billing">Cobrança</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="postal_code">CEP</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {cepLoading && (
              <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="street">Logradouro *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Rua, Avenida..."
                required
              />
            </div>
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="123"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={formData.complement}
              onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              placeholder="Apto, Bloco..."
            />
          </div>

          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Nome do bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData({ ...formData, is_primary: !!checked })}
            />
            <Label htmlFor="is_primary">Definir como endereço principal</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};