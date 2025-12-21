import { useState } from 'react';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Tag, Plus, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useCRM, UnifiedContact, CRMDeal } from '@/hooks/useCRM';
import { ContactTimeline } from './ContactTimeline';
import { ContactForm } from './ContactForm';
import { InteractionForm } from './InteractionForm';
import { DealForm } from './DealForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactProfileProps {
  contact: UnifiedContact;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
  active: 'Ativo',
};

const dealStageLabels: Record<string, string> = {
  lead: 'Lead',
  contacted: 'Contatado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
};

const dealStageColors: Record<string, string> = {
  lead: 'bg-gray-500/10 text-gray-500',
  contacted: 'bg-blue-500/10 text-blue-500',
  proposal: 'bg-purple-500/10 text-purple-500',
  negotiation: 'bg-yellow-500/10 text-yellow-500',
  won: 'bg-green-500/10 text-green-500',
  lost: 'bg-red-500/10 text-red-500',
};

export const ContactProfile = ({ contact, onBack }: ContactProfileProps) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);

  const { useContactProfile, useLeadById } = useCRM();
  const { data: profile, isLoading } = useContactProfile(contact.id, contact.type);
  const { data: leadData } = useLeadById(contact.type === 'lead' ? contact.id : null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{contact.full_name}</h1>
          <p className="text-muted-foreground">
            {contact.type === 'lead' ? 'Lead' : 'Usuário'} desde {format(new Date(contact.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowEditForm(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interações</p>
                <p className="text-2xl font-bold">{profile?.interactions.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Negócios</p>
                <p className="text-2xl font-bold">{profile?.deals.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(profile?.contact.total_value || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Interação</p>
                <p className="text-sm font-medium">
                  {profile?.contact.last_interaction_at 
                    ? format(new Date(profile.contact.last_interaction_at), 'dd/MM/yyyy', { locale: ptBR })
                    : 'Nenhuma'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{contact.email}</span>
              </div>
            )}
            
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{contact.phone}</span>
              </div>
            )}
            
            {contact.cpf && (
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">CPF: {contact.cpf}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <Badge variant="outline">
                {statusLabels[contact.status] || contact.status}
              </Badge>
            </div>
            
            {contact.source && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Origem</p>
                <p className="text-sm text-muted-foreground">{contact.source}</p>
              </div>
            )}
            
            {contact.tags && contact.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => setShowInteractionForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Interação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowDealForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Negócio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="timeline" className="w-full">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="deals">Negócios ({profile?.deals.length || 0})</TabsTrigger>
                <TabsTrigger value="milestones">Marcos ({profile?.milestones.length || 0})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="timeline" className="mt-0">
                <ContactTimeline 
                  interactions={profile?.interactions || []} 
                  milestones={profile?.milestones || []} 
                />
              </TabsContent>

              <TabsContent value="deals" className="mt-0">
                {!profile?.deals.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum negócio registrado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.deals.map((deal) => (
                      <div key={deal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{deal.title}</h4>
                          <Badge className={dealStageColors[deal.stage]}>
                            {dealStageLabels[deal.stage]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{formatCurrency(deal.value)}</span>
                          <span>{format(new Date(deal.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        {deal.description && (
                          <p className="text-sm text-muted-foreground mt-2">{deal.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="milestones" className="mt-0">
                {!profile?.milestones.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum marco registrado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.milestones.map((milestone) => (
                      <div key={milestone.id} className="border border-green-500/20 bg-green-500/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-600">{milestone.milestone_name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(milestone.milestone_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{milestone.activities_count} atividades</span>
                          {milestone.days_from_first_contact && (
                            <span>{milestone.days_from_first_contact} dias</span>
                          )}
                          {milestone.total_value > 0 && (
                            <span>{formatCurrency(milestone.total_value)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Dialogs */}
      {contact.type === 'lead' && (
        <ContactForm 
          open={showEditForm} 
          onOpenChange={setShowEditForm} 
          editingLead={leadData}
        />
      )}

      <InteractionForm
        open={showInteractionForm}
        onOpenChange={setShowInteractionForm}
        contactId={contact.id}
        contactType={contact.type}
        cpf={contact.cpf}
      />

      <DealForm
        open={showDealForm}
        onOpenChange={setShowDealForm}
        contactId={contact.id}
        contactType={contact.type}
        cpf={contact.cpf}
        contactName={contact.full_name}
      />
    </div>
  );
};
