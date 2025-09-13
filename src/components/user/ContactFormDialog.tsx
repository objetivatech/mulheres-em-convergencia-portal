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

interface ContactFormData {
  id?: string;
  contact_type: string;
  contact_value: string;
  is_primary: boolean;
}

interface ContactFormDialogProps {
  open: boolean;
  loading?: boolean;
  contact?: ContactFormData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContactFormDialog: React.FC<ContactFormDialogProps> = ({
  open,
  loading = false,
  contact,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    contact_type: 'phone',
    contact_value: '',
    is_primary: false
  });

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({
        contact_type: 'phone',
        contact_value: '',
        is_primary: false
      });
    }
  }, [contact, open]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleValueChange = (value: string) => {
    let formattedValue = value;
    
    if (formData.contact_type === 'phone' || formData.contact_type === 'whatsapp') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setFormData({ ...formData, contact_value: formattedValue });
  };

  const validateContact = () => {
    if (!formData.contact_value.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Valor do contato é obrigatório',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.contact_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_value)) {
        toast({
          title: 'Erro de validação',
          description: 'Email inválido',
          variant: 'destructive'
        });
        return false;
      }
    }

    if (formData.contact_type === 'phone' || formData.contact_type === 'whatsapp') {
      const phoneOnly = formData.contact_value.replace(/\D/g, '');
      if (phoneOnly.length < 10) {
        toast({
          title: 'Erro de validação',
          description: 'Telefone deve ter pelo menos 10 dígitos',
          variant: 'destructive'
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateContact()) return;

    try {
      const contactData = {
        user_id: user.id,
        contact_type: formData.contact_type,
        contact_value: formData.contact_value,
        is_primary: formData.is_primary,
        verified: false
      };

      if (contact?.id) {
        // Update existing contact
        const { error } = await supabase
          .from('user_contacts')
          .update(contactData)
          .eq('id', contact.id);

        if (error) throw error;

        // Log activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'contact_updated',
          p_description: `Contato ${formData.contact_type} atualizado`,
          p_metadata: { contact_id: contact.id, contact_type: formData.contact_type }
        });

        toast({
          title: 'Contato atualizado',
          description: 'Contato atualizado com sucesso!'
        });
      } else {
        // Create new contact
        const { error } = await supabase
          .from('user_contacts')
          .insert(contactData);

        if (error) throw error;

        // Log activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'contact_added',
          p_description: `Novo contato ${formData.contact_type} adicionado`,
          p_metadata: { contact_type: formData.contact_type }
        });

        toast({
          title: 'Contato adicionado',
          description: 'Contato adicionado com sucesso!'
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar contato',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contato' : 'Adicionar Contato'}</DialogTitle>
          <DialogDescription>
            Adicione uma forma de contato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact_type">Tipo de Contato</Label>
            <Select
              value={formData.contact_type}
              onValueChange={(value) => setFormData({ ...formData, contact_type: value, contact_value: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contact_value">
              {formData.contact_type === 'email' ? 'Email' :
               formData.contact_type === 'phone' ? 'Telefone' :
               formData.contact_type === 'whatsapp' ? 'WhatsApp' : 'Valor'} *
            </Label>
            <Input
              id="contact_value"
              value={formData.contact_value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={
                formData.contact_type === 'email' ? 'email@exemplo.com' :
                formData.contact_type === 'phone' || formData.contact_type === 'whatsapp' ? '(11) 99999-9999' :
                'Valor do contato'
              }
              type={formData.contact_type === 'email' ? 'email' : 'text'}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData({ ...formData, is_primary: !!checked })}
            />
            <Label htmlFor="is_primary">Definir como contato principal</Label>
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