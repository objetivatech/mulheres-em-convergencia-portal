import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MessageCircle, Plus } from 'lucide-react';
import type { ContactOption } from '@/hooks/useSmartFormFiller';

interface ContactSelectorProps {
  contacts: ContactOption[];
  selectedId?: string;
  onSelect: (contactId: string | null) => void;
  onNewContact?: () => void;
  title?: string;
  type?: 'phone' | 'email' | 'whatsapp' | 'all';
  className?: string;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  selectedId,
  onSelect,
  onNewContact,
  title,
  type = 'all',
  className = "",
}) => {
  // Filter contacts by type if specified
  const filteredContacts = type === 'all' 
    ? contacts 
    : contacts.filter(c => c.contact.contact_type === type);

  if (filteredContacts.length === 0) {
    return null;
  }

  // Default title based on type
  const getDefaultTitle = () => {
    switch (type) {
      case 'phone': return 'Selecionar Telefone';
      case 'email': return 'Selecionar Email';
      case 'whatsapp': return 'Selecionar WhatsApp';
      default: return 'Selecionar Contato';
    }
  };

  const getContactIcon = (contactType: string) => {
    switch (contactType) {
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />;
      default: return <Phone className="h-3 w-3" />;
    }
  };

  const finalTitle = title || getDefaultTitle();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getContactIcon(type)}
          {finalTitle}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <RadioGroup 
          value={selectedId || ''} 
          onValueChange={(value) => onSelect(value || null)}
          className="space-y-3"
        >
          {filteredContacts.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option.id} 
                id={`contact-${option.id}`}
              />
              <Label 
                htmlFor={`contact-${option.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {getContactIcon(option.contact.contact_type)}
                  <span className="text-sm">
                    {option.contact.contact_value}
                  </span>
                  {option.contact.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                  {option.contact.verified && (
                    <Badge variant="default" className="text-xs">
                      Verificado
                    </Badge>
                  )}
                </div>
              </Label>
            </div>
          ))}
          
          {/* Option for new contact */}
          <div className="flex items-center space-x-2 border-t pt-3">
            <RadioGroupItem value="" id="new-contact" />
            <Label htmlFor="new-contact" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 text-sm">
                <Plus className="h-3 w-3" />
                Usar novo {type === 'phone' ? 'telefone' : type === 'email' ? 'email' : 'contato'}
              </div>
            </Label>
          </div>
        </RadioGroup>

        {onNewContact && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onNewContact}
            className="w-full mt-3"
          >
            <Plus className="h-3 w-3 mr-1" />
            Cadastrar Novo {type === 'phone' ? 'Telefone' : type === 'email' ? 'Email' : 'Contato'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactSelector;