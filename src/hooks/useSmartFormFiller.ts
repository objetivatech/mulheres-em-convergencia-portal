import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCpfSystem } from '@/hooks/useCpfSystem';
import type { UserContact, UserAddress } from '@/hooks/useCpfSystem';

export interface SmartFormData {
  full_name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  city?: string;
  state?: string;
  // Address fields
  addresses?: UserAddress[];
  selectedAddressId?: string;
  // Contact fields  
  contacts?: UserContact[];
  selectedContactId?: string;
}

export interface FormFieldSuggestion {
  source: 'profile' | 'address' | 'contact';
  value: string;
  label: string;
  isSelected?: boolean;
}

export interface AddressOption {
  id: string;
  label: string;
  address: UserAddress;
  isSelected?: boolean;
}

export interface ContactOption {
  id: string;
  label: string;
  contact: UserContact;
  isSelected?: boolean;
}

export const useSmartFormFiller = () => {
  const { user } = useAuth();
  const { useUserContacts, useUserAddresses } = useCpfSystem();
  
  const [smartData, setSmartData] = useState<SmartFormData>({});
  const [loading, setLoading] = useState(false);
  
  // Fetch user's contacts and addresses
  const { data: contacts } = useUserContacts(user?.id);
  const { data: addresses } = useUserAddresses(user?.id);

  // Initialize smart data when user changes
  useEffect(() => {
    if (user) {
      setSmartData(prev => ({
        ...prev,
        contacts: contacts || [],
        addresses: addresses || [],
      }));
    } else {
      setSmartData({});
    }
  }, [user, contacts, addresses]);

  // Get address suggestions for form fields
  const getAddressSuggestions = (): AddressOption[] => {
    if (!addresses || addresses.length === 0) return [];
    
    return addresses.map(addr => ({
      id: addr.id,
      label: `${addr.street}, ${addr.number || 'S/N'} - ${addr.city}/${addr.state} (${addr.address_type})`,
      address: addr,
      isSelected: smartData.selectedAddressId === addr.id,
    }));
  };

  // Get contact suggestions for phone/email fields
  const getContactSuggestions = (type?: 'email' | 'phone' | 'whatsapp'): ContactOption[] => {
    if (!contacts || contacts.length === 0) return [];
    
    const filtered = type ? contacts.filter(c => c.contact_type === type) : contacts;
    
    return filtered.map(contact => ({
      id: contact.id,
      label: `${contact.contact_value} (${contact.contact_type}${contact.is_primary ? ' - Principal' : ''})`,
      contact,
      isSelected: smartData.selectedContactId === contact.id,
    }));
  };

  // Select an address to auto-fill form
  const selectAddress = (addressId: string | null) => {
    setSmartData(prev => ({
      ...prev,
      selectedAddressId: addressId || undefined,
    }));
  };

  // Select a contact to auto-fill form
  const selectContact = (contactId: string | null) => {
    setSmartData(prev => ({
      ...prev,
      selectedContactId: contactId || undefined,
    }));
  };

  // Get form values based on selections
  const getFormValues = () => {
    const values: any = {};
    
    // Selected address
    if (smartData.selectedAddressId && addresses) {
      const address = addresses.find(a => a.id === smartData.selectedAddressId);
      if (address) {
        values.address = address.street;
        values.addressNumber = address.number || '';
        values.complement = address.complement || '';
        values.province = address.neighborhood || '';
        values.city = address.city;
        values.state = address.state;
        values.postalCode = address.postal_code || '';
      }
    }
    
    // Selected contact
    if (smartData.selectedContactId && contacts) {
      const contact = contacts.find(c => c.id === smartData.selectedContactId);
      if (contact) {
        if (contact.contact_type === 'phone') {
          values.phone = contact.contact_value;
        }
      }
    }
    
    return values;
  };

  // Check if user has any saved data
  const hasAddresses = () => addresses && addresses.length > 0;
  const hasContacts = () => contacts && contacts.length > 0;
  const hasPhoneContacts = () => contacts && contacts.some(c => c.contact_type === 'phone');
  
  // Get primary contact/address
  const getPrimaryAddress = () => addresses?.find(a => a.is_primary);
  const getPrimaryPhone = () => contacts?.find(c => c.contact_type === 'phone' && c.is_primary);
  
  // Auto-fill with primary data
  const autoFillPrimary = () => {
    const values: any = {};
    
    const primaryAddress = getPrimaryAddress();
    if (primaryAddress) {
      values.address = primaryAddress.street;
      values.addressNumber = primaryAddress.number || '';
      values.complement = primaryAddress.complement || '';
      values.province = primaryAddress.neighborhood || '';
      values.city = primaryAddress.city;
      values.state = primaryAddress.state;
      values.postalCode = primaryAddress.postal_code || '';
      selectAddress(primaryAddress.id);
    }
    
    const primaryPhone = getPrimaryPhone();
    if (primaryPhone) {
      values.phone = primaryPhone.contact_value;
      selectContact(primaryPhone.id);
    }
    
    return values;
  };

  return {
    // Data
    smartData,
    loading,
    
    // Address functions
    hasAddresses,
    getAddressSuggestions,
    selectAddress,
    getPrimaryAddress,
    
    // Contact functions
    hasContacts,
    hasPhoneContacts,
    getContactSuggestions,
    selectContact,
    getPrimaryPhone,
    
    // Form helpers
    getFormValues,
    autoFillPrimary,
  };
};