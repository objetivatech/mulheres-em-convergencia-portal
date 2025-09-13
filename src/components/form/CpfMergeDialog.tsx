import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { User, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react';
import type { CpfUserData, UserAddress, UserContact } from '@/hooks/useCpfSystem';

interface CpfMergeDialogProps {
  open: boolean;
  onClose: () => void;
  onMerge: (selectedData: MergeSelections) => Promise<void>;
  existingUser: CpfUserData;
  newUserData: {
    name?: string;
    email?: string;
    phone?: string;
    cpf: string;
  };
  existingAddresses?: UserAddress[];
  existingContacts?: UserContact[];
  loading?: boolean;
}

export interface MergeSelections {
  updateProfile: boolean;
  keepExistingData: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
  };
  addNewData: {
    phone?: boolean;
    address?: boolean;
  };
  selectedAddresses: string[];
  selectedContacts: string[];
}

const CpfMergeDialog: React.FC<CpfMergeDialogProps> = ({
  open,
  onClose,
  onMerge,
  existingUser,
  newUserData,
  existingAddresses = [],
  existingContacts = [],
  loading = false,
}) => {
  const [selections, setSelections] = useState<MergeSelections>({
    updateProfile: false,
    keepExistingData: {},
    addNewData: {},
    selectedAddresses: [],
    selectedContacts: [],
  });

  const handleMerge = async () => {
    await onMerge(selections);
  };

  const toggleSelection = (key: keyof MergeSelections, value: any) => {
    setSelections(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleKeepExisting = (field: string, checked: boolean) => {
    setSelections(prev => ({
      ...prev,
      keepExistingData: {
        ...prev.keepExistingData,
        [field]: checked,
      },
    }));
  };

  const toggleAddNew = (field: string, checked: boolean) => {
    setSelections(prev => ({
      ...prev,
      addNewData: {
        ...prev.addNewData,
        [field]: checked,
      },
    }));
  };

  const hasConflicts = () => {
    return (
      (newUserData.name && existingUser.full_name && newUserData.name !== existingUser.full_name) ||
      (newUserData.email && existingUser.email && newUserData.email !== existingUser.email)
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            CPF já cadastrado - Unificar dados?
          </DialogTitle>
          <DialogDescription>
            Encontramos um cadastro existente com este CPF. Você pode mesclar os dados novos com os existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Dados existentes */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground">Dados Existentes</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {existingUser.full_name || 'Não informado'}</div>
                    <div><strong>Email:</strong> {existingUser.email || 'Não informado'}</div>
                    <div><strong>CPF:</strong> {existingUser.cpf}</div>
                  </div>
                </div>
                
                {/* Dados novos */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground">Dados Novos</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {newUserData.name || 'Não informado'}</div>
                    <div><strong>Email:</strong> {newUserData.email || 'Não informado'}</div>
                    <div><strong>CPF:</strong> {newUserData.cpf}</div>
                  </div>
                </div>
              </div>

              {/* Opções de mesclagem para dados conflitantes */}
              {hasConflicts() && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3">Resolver Conflitos:</h4>
                  <div className="space-y-2">
                    {newUserData.name && existingUser.full_name && newUserData.name !== existingUser.full_name && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keep-name"
                          checked={selections.keepExistingData.name || false}
                          onCheckedChange={(checked) => toggleKeepExisting('name', !!checked)}
                        />
                        <label htmlFor="keep-name" className="text-sm">
                          Manter nome existente: <strong>{existingUser.full_name}</strong>
                        </label>
                      </div>
                    )}

                    {newUserData.email && existingUser.email && newUserData.email !== existingUser.email && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keep-email"
                          checked={selections.keepExistingData.email || false}
                          onCheckedChange={(checked) => toggleKeepExisting('email', !!checked)}
                        />
                        <label htmlFor="keep-email" className="text-sm">
                          Manter email existente: <strong>{existingUser.email}</strong>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Endereços existentes */}
          {existingAddresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereços Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingAddresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`address-${address.id}`}
                        checked={selections.selectedAddresses.includes(address.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelections(prev => ({
                              ...prev,
                              selectedAddresses: [...prev.selectedAddresses, address.id]
                            }));
                          } else {
                            setSelections(prev => ({
                              ...prev,
                              selectedAddresses: prev.selectedAddresses.filter(id => id !== address.id)
                            }));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {address.street}, {address.number || 'S/N'}
                          </span>
                          {address.is_primary && (
                            <Badge variant="secondary" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {address.city}/{address.state} - {address.address_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contatos existentes */}
          {existingContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contatos Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={selections.selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelections(prev => ({
                              ...prev,
                              selectedContacts: [...prev.selectedContacts, contact.id]
                            }));
                          } else {
                            setSelections(prev => ({
                              ...prev,
                              selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                            }));
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        {contact.contact_type === 'phone' && <Phone className="h-3 w-3" />}
                        {contact.contact_type === 'email' && <Mail className="h-3 w-3" />}
                        <span className="text-sm">{contact.contact_value}</span>
                        {contact.is_primary && (
                          <Badge variant="secondary" className="text-xs">Principal</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Novos dados para adicionar */}
          {(newUserData.phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Novos Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {newUserData.phone && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="add-phone"
                        checked={selections.addNewData.phone || false}
                        onCheckedChange={(checked) => toggleAddNew('phone', !!checked)}
                      />
                      <label htmlFor="add-phone" className="text-sm">
                        Adicionar telefone: <strong>{newUserData.phone}</strong>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={loading}>
            {loading ? 'Mesclando...' : 'Mesclar Dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CpfMergeDialog;