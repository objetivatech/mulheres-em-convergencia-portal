import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Send, Eye, Clock, FileEdit, Play, Loader2 } from 'lucide-react';

export function CampaignsList() {
  const { useCampaigns, useSentCampaigns, useCreateCampaign, useSendCampaign, useSendTestCampaign, useSenders } = useNewsletter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'drafts' | 'sent'>('drafts');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState('');
  
  // Form state
  const [newCampaign, setNewCampaign] = useState({
    subject: '',
    html_part: '',
    text_part: '',
  });
  
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: sentCampaigns, isLoading: sentLoading } = useSentCampaigns();
  const { data: senders } = useSenders();
  
  const createMutation = useCreateCampaign();
  const sendMutation = useSendCampaign();
  const sendTestMutation = useSendTestCampaign();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        subject: newCampaign.subject,
        html_part: newCampaign.html_part,
        text_part: newCampaign.text_part,
        sender_id: senders?.[0]?.id,
      });
      
      toast({
        title: 'Campanha criada',
        description: 'A campanha foi salva como rascunho.',
      });
      
      setShowCreateDialog(false);
      setNewCampaign({ subject: '', html_part: '', text_part: '' });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSend = async (campaignId: number) => {
    try {
      await sendMutation.mutateAsync(campaignId);
      toast({
        title: 'Campanha enviada',
        description: 'A campanha está sendo enviada para todos os destinatários.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar campanha',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendTest = async () => {
    if (!selectedCampaignId || !testEmail) return;
    
    try {
      await sendTestMutation.mutateAsync({
        campaignId: selectedCampaignId,
        emails: [testEmail],
      });
      
      toast({
        title: 'Email de teste enviado',
        description: `Teste enviado para ${testEmail}`,
      });
      
      setShowTestDialog(false);
      setTestEmail('');
      setSelectedCampaignId(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar teste',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const currentCampaigns = activeTab === 'drafts' 
    ? (campaigns?.data || campaigns || [])
    : (sentCampaigns?.data || sentCampaigns || []);
  const isLoading = activeTab === 'drafts' ? campaignsLoading : sentLoading;

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'drafts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('drafts')}
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Rascunhos
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sent')}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviadas
          </Button>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha de email para enviar aos seus inscritos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto do email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="html_part">Conteúdo HTML</Label>
                <Textarea
                  id="html_part"
                  value={newCampaign.html_part}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, html_part: e.target.value }))}
                  placeholder="<html>...</html>"
                  rows={10}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="text_part">Conteúdo Texto (opcional)</Label>
                <Textarea
                  id="text_part"
                  value={newCampaign.text_part}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, text_part: e.target.value }))}
                  placeholder="Versão em texto puro..."
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newCampaign.subject || !newCampaign.html_part || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'drafts' ? 'Campanhas em Rascunho' : 'Campanhas Enviadas'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'drafts' 
              ? 'Campanhas prontas para enviar'
              : 'Histórico de campanhas enviadas'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : currentCampaigns && currentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {currentCampaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{campaign.subject || 'Sem assunto'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {activeTab === 'drafts' 
                          ? `Criado: ${new Date(campaign.created_at).toLocaleDateString('pt-BR')}`
                          : `Enviado: ${new Date(campaign.sent_at || campaign.created_at).toLocaleDateString('pt-BR')}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activeTab === 'drafts' ? (
                      <>
                        <Badge variant="secondary">
                          <FileEdit className="h-3 w-3 mr-1" />
                          Rascunho
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaignId(campaign.id);
                            setShowTestDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Teste
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Enviar Campanha</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja enviar esta campanha para todos os destinatários?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleSend(campaign.id)}
                                disabled={sendMutation.isPending}
                              >
                                {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <>
                        {campaign.stats && (
                          <div className="flex items-center gap-4 text-sm">
                            <span>{campaign.stats.sent || 0} enviados</span>
                            <span>{campaign.stats.opened || 0} abertos</span>
                            <span>{campaign.stats.clicked || 0} cliques</span>
                          </div>
                        )}
                        <Badge className="bg-green-100 text-green-800">
                          <Send className="h-3 w-3 mr-1" />
                          Enviada
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {activeTab === 'drafts' 
                  ? 'Nenhum rascunho encontrado'
                  : 'Nenhuma campanha enviada'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Teste */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Teste</DialogTitle>
            <DialogDescription>
              Envie um email de teste para verificar a campanha antes de enviar para todos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email para teste</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
