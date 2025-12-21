import { useState } from 'react';
import { ContactsList } from '@/components/admin/crm/ContactsList';
import { ContactProfile } from '@/components/admin/crm/ContactProfile';
import { ContactForm } from '@/components/admin/crm/ContactForm';
import { UnifiedContact } from '@/hooks/useCRM';

const AdminCRMContacts = () => {
  const [selectedContact, setSelectedContact] = useState<UnifiedContact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (selectedContact) {
    return (
      <div className="container mx-auto py-6 px-4">
        <ContactProfile 
          contact={selectedContact} 
          onBack={() => setSelectedContact(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <ContactsList 
        onSelectContact={setSelectedContact}
        onAddContact={() => setShowAddForm(true)}
      />
      <ContactForm 
        open={showAddForm} 
        onOpenChange={setShowAddForm} 
      />
    </div>
  );
};

export default AdminCRMContacts;
