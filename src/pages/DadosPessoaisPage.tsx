import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, History, Mail, Linkedin, Instagram, Globe } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import UserActivityHistory from '@/components/user/UserActivityHistory';
import { AddressFormDialog } from '@/components/user/AddressFormDialog';
import { ContactFormDialog } from '@/components/user/ContactFormDialog';
import { ChangeEmailDialog } from '@/components/user/ChangeEmailDialog';
import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  bio: z.string().optional(),
  public_bio: z.string().optional(),
  linkedin_url: z.string().optional(),
  instagram_url: z.string().optional(),
  website_url: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const DadosPessoaisPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
      fetchContacts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        reset({
          full_name: data.full_name || '',
          cpf: data.cpf || '',
          phone: data.phone || '',
          city: data.city || '',
          state: data.state || '',
          bio: data.bio || '',
          public_bio: data.public_bio || '',
          linkedin_url: data.linkedin_url || '',
          instagram_url: data.instagram_url || '',
          website_url: data.website_url || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar profile:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          cpf: data.cpf,
          phone: data.phone,
          city: data.city,
          state: data.state,
          bio: data.bio,
          public_bio: data.public_bio || null,
          linkedin_url: data.linkedin_url || null,
          instagram_url: data.instagram_url || null,
          website_url: data.website_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Log profile update activity
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'profile_updated',
        p_description: 'Dados pessoais atualizados',
        p_metadata: { updated_fields: Object.keys(data) }
      });

      toast({
        title: 'Sucesso',
        description: 'Dados pessoais atualizados com sucesso!'
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleAvatarChange = async (url: string | null) => {
    if (!user) return;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    fetchProfile();
    toast({ title: 'Sucesso', description: 'Foto atualizada!' });
  };

  return (
    <Layout>
      <Helmet>
        <title>Dados Pessoais - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie suas informações pessoais, endereços e contatos" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dados Pessoais</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais, endereços e contatos
          </p>
        </div>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfil">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="enderecos">
              <MapPin className="h-4 w-4 mr-2" />
              Endereços
            </TabsTrigger>
            <TabsTrigger value="contatos">
              <Phone className="h-4 w-4 mr-2" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            {/* Foto */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>Sua foto é reutilizada no CONECTA+, Embaixadora e demais módulos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageCropUploader
                  value={profile?.avatar_url || undefined}
                  onChange={handleAvatarChange}
                  dimensions={IMAGE_PRESETS.ambassadorPhoto}
                  folder={`avatars/${user?.id || 'unknown'}`}
                  label="Foto de perfil"
                  previewHeight="h-24"
                />
              </CardContent>
            </Card>

            {/* Email Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Principal</CardTitle>
                <CardDescription>Email usado para login, newsletter, certificados e notificações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <Label>Email atual</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(true)}>
                    Alterar email
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A troca exige confirmação por link enviado para o novo endereço (verificação obrigatória).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações básicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        {...register('full_name')}
                        placeholder="Seu nome completo"
                      />
                      {errors.full_name && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.full_name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        {...register('cpf')}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      {errors.cpf && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.cpf.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        {...register('city')}
                        placeholder="Sua cidade"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        {...register('state')}
                        placeholder="Seu estado"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      placeholder="Bio privada (uso interno)..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="public_bio">Bio Pública</Label>
                    <Textarea
                      id="public_bio"
                      {...register('public_bio')}
                      placeholder="Exibida no CONECTA+ e na página de Embaixadora..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="linkedin_url" className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</Label>
                      <Input id="linkedin_url" {...register('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                      <Label htmlFor="instagram_url" className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
                      <Input id="instagram_url" {...register('instagram_url')} placeholder="@usuario" />
                    </div>
                    <div>
                      <Label htmlFor="website_url" className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Website</Label>
                      <Input id="website_url" {...register('website_url')} placeholder="https://..." />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereços Cadastrados</CardTitle>
                <CardDescription>
                  Gerencie seus endereços salvos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {address.address_type === 'home' ? 'Residencial' : 
                               address.address_type === 'work' ? 'Comercial' : 'Outro'}
                              {address.is_primary && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  Principal
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.street}, {address.number}
                              {address.complement && `, ${address.complement}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.neighborhood}, {address.city} - {address.state}
                            </p>
                            {address.postal_code && (
                              <p className="text-sm text-muted-foreground">
                                CEP: {address.postal_code}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingAddress(address);
                              setAddressDialogOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum endereço cadastrado</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressDialogOpen(true);
                      }}
                    >
                      Adicionar Endereço
                    </Button>
                  </div>
                )}
                
                {addresses.length > 0 && (
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressDialogOpen(true);
                    }}
                  >
                    Adicionar Novo Endereço
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contatos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contatos Adicionais</CardTitle>
                <CardDescription>
                  Gerencie suas formas de contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {contact.contact_type === 'email' ? 'Email' :
                               contact.contact_type === 'phone' ? 'Telefone' :
                               contact.contact_type === 'whatsapp' ? 'WhatsApp' : 'Outro'}
                              {contact.is_primary && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  Principal
                                </span>
                              )}
                              {contact.verified && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Verificado
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {contact.contact_value}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingContact(contact);
                              setContactDialogOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum contato adicional cadastrado</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => {
                        setEditingContact(null);
                        setContactDialogOpen(true);
                      }}
                    >
                      Adicionar Contato
                    </Button>
                  </div>
                )}
                
                {contacts.length > 0 && (
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => {
                      setEditingContact(null);
                      setContactDialogOpen(true);
                    }}
                  >
                    Adicionar Novo Contato
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atividades</CardTitle>
                <CardDescription>
                  Veja o histórico completo de suas ações no portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserActivityHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Address Dialog */}
        <AddressFormDialog
          open={addressDialogOpen}
          loading={loading}
          address={editingAddress}
          onClose={() => {
            setAddressDialogOpen(false);
            setEditingAddress(null);
          }}
          onSuccess={() => {
            fetchAddresses();
          }}
        />

        {/* Contact Dialog */}
        <ContactFormDialog
          open={contactDialogOpen}
          loading={loading}
          contact={editingContact}
          onClose={() => {
            setContactDialogOpen(false);
            setEditingContact(null);
          }}
          onSuccess={() => {
            fetchContacts();
          }}
        />
      </div>
    </Layout>
  );
};

export default DadosPessoaisPage;