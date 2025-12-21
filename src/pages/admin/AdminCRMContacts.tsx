import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { ContactsList } from '@/components/admin/crm/ContactsList';
import { ContactProfile } from '@/components/admin/crm/ContactProfile';
import { ContactForm } from '@/components/admin/crm/ContactForm';
import { UnifiedContact } from '@/hooks/useCRM';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMContacts = () => {
  const [selectedContact, setSelectedContact] = useState<UnifiedContact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (selectedContact) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <ContactProfile 
            contact={selectedContact} 
            onBack={() => setSelectedContact(null)} 
          />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Contatos - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/contatos`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Contatos</h1>
            <p className="text-muted-foreground">
              Gestão unificada de leads e clientes
            </p>
          </div>

          <ContactsList 
            onSelectContact={setSelectedContact}
            onAddContact={() => setShowAddForm(true)}
          />
          <ContactForm 
            open={showAddForm} 
            onOpenChange={setShowAddForm} 
          />
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMContacts;
