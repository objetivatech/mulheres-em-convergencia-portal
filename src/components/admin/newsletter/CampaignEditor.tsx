import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, FileText, Eye, Send, ChevronLeft, ChevronRight } from 'lucide-react';

interface CampaignEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: any;
  onSuccess?: () => void;
}

export function CampaignEditor({ open, onOpenChange, campaign, onSuccess }: CampaignEditorProps) {
  const { useSenders, useGroups, useCreateCampaign, useUpdateCampaign, useSendTestCampaign } = useNewsletter();
  const { toast } = useToast();
  
  const { data: sendersData } = useSenders();
  const { data: groupsData } = useGroups();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const sendTestMutation = useSendTestCampaign();
  
  const senders = sendersData?.data || sendersData || [];
  const groups = groupsData?.data || groupsData || [];
  
  const [step, setStep] = useState(0);
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    sender_id: undefined as number | undefined,
    preview_text: '',
    reply_to: '',
    html_part: '',
    text_part: '',
    group_ids: [] as number[],
    url_token: true,
    analytics_utm_campaign: '',
  });
  
  const isEditing = !!campaign;
  
  useEffect(() => {
    if (campaign) {
      setFormData({
        subject: campaign.subject || '',
        sender_id: campaign.sender_id,
        preview_text: campaign.preview_text || '',
        reply_to: campaign.reply_to || '',
        html_part: campaign.html_part || '',
        text_part: campaign.text_part || '',
        group_ids: campaign.target?.group_ids || [],
        url_token: campaign.url_token !== false,
        analytics_utm_campaign: campaign.analytics_utm_campaign || '',
      });
    } else {
      setFormData({
        subject: '',
        sender_id: senders[0]?.id,
        preview_text: '',
        reply_to: '',
        html_part: '',
        text_part: '',
        group_ids: [],
        url_token: true,
        analytics_utm_campaign: '',
      });
    }
    setStep(0);
  }, [campaign, open, senders]);
  
  const handleSave = async () => {
    try {
      const payload: any = {
        subject: formData.subject,
        html_part: formData.html_part,
      };
      
      if (formData.sender_id) payload.sender_id = formData.sender_id;
      if (formData.text_part) payload.text_part = formData.text_part;
      if (formData.preview_text) payload.preview_text = formData.preview_text;
      if (formData.reply_to) payload.reply_to = formData.reply_to;
      if (formData.group_ids.length > 0) {
        payload.target = { group_ids: formData.group_ids };
      }
      if (formData.url_token !== undefined) payload.url_token = formData.url_token;
      if (formData.analytics_utm_campaign) payload.analytics_utm_campaign = formData.analytics_utm_campaign;
      
      if (isEditing && campaign) {
        await updateMutation.mutateAsync({ id: campaign.id, data: payload });
        toast({
          title: 'Campanha atualizada',
          description: 'As alterações foram salvas.',
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: 'Campanha criada',
          description: 'A campanha foi salva como rascunho.',
        });
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleSendTest = async () => {
    if (!campaign?.id || !testEmail) return;
    
    try {
      await sendTestMutation.mutateAsync({
        campaignId: campaign.id,
        emails: [testEmail],
      });
      
      toast({
        title: 'Email de teste enviado',
        description: `Teste enviado para ${testEmail}`,
      });
      
      setShowTestDialog(false);
      setTestEmail('');
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar teste',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const toggleGroup = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      group_ids: prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId],
    }));
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  const steps = [
    { id: 'config', label: 'Configuração', icon: Settings },
    { id: 'content', label: 'Conteúdo', icon: FileText },
    { id: 'preview', label: 'Revisão', icon: Eye },
  ];
  
  const canProceed = () => {
    if (step === 0) {
      return !!formData.subject;
    }
    if (step === 1) {
      return !!formData.html_part;
    }
    return true;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os detalhes da campanha'
              : 'Crie uma nova campanha de email marketing'
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 py-4">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => setStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  step === index 
                    ? 'bg-primary text-primary-foreground' 
                    : step > index 
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <s.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{s.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${step > index ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Configuration */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Assunto do email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender">Remetente</Label>
                  <Select
                    value={formData.sender_id?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sender_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um remetente" />
                    </SelectTrigger>
                    <SelectContent>
                      {senders.map((sender: any) => (
                        <SelectItem key={sender.id} value={sender.id.toString()}>
                          {sender.name || sender.email} ({sender.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview_text">Texto de Preview</Label>
                  <Input
                    id="preview_text"
                    value={formData.preview_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, preview_text: e.target.value }))}
                    placeholder="Texto exibido na prévia do email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparece ao lado do assunto na caixa de entrada
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reply_to">Reply-To</Label>
                  <Input
                    id="reply_to"
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, reply_to: e.target.value }))}
                    placeholder="email@resposta.com"
                  />
                </div>
              </div>
              
              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label>Grupos de Destinatários</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {groups.map((group: any) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={formData.group_ids.includes(group.id)}
                            onCheckedChange={() => toggleGroup(group.id)}
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {group.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para enviar a todos os inscritos ativos
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_campaign">UTM Campaign (Analytics)</Label>
                  <Input
                    id="utm_campaign"
                    value={formData.analytics_utm_campaign}
                    onChange={(e) => setFormData(prev => ({ ...prev, analytics_utm_campaign: e.target.value }))}
                    placeholder="nome-da-campanha"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="url_token"
                    checked={formData.url_token}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, url_token: !!checked }))}
                  />
                  <label htmlFor="url_token" className="text-sm">
                    Rastrear cliques em links
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Content */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html_part">Conteúdo HTML *</Label>
                <Textarea
                  id="html_part"
                  value={formData.html_part}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_part: e.target.value }))}
                  placeholder="<html><body>Seu conteúdo aqui...</body></html>"
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cole o código HTML do seu email. Use {'{{unsubscribe_url}}'} para o link de descadastro.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="text_part">Versão em Texto (opcional)</Label>
                <Textarea
                  id="text_part"
                  value={formData.text_part}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_part: e.target.value }))}
                  placeholder="Versão em texto puro do email..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Versão alternativa para clientes de email que não suportam HTML
                </p>
              </div>
            </div>
          )}
          
          {/* Step 3: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assunto</p>
                      <p className="font-medium">{formData.subject || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remetente</p>
                      <p className="font-medium">
                        {senders.find((s: any) => s.id === formData.sender_id)?.email || 'Não selecionado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preview</p>
                      <p className="font-medium">{formData.preview_text || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grupos</p>
                      <p className="font-medium">
                        {formData.group_ids.length > 0 
                          ? `${formData.group_ids.length} grupo(s) selecionado(s)`
                          : 'Todos os inscritos'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview do Email</CardTitle>
                  <CardDescription>
                    Visualização aproximada do conteúdo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border rounded-md p-4 bg-white max-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.html_part || '<p class="text-muted-foreground">Nenhum conteúdo HTML</p>' }}
                  />
                </CardContent>
              </Card>
              
              {isEditing && campaign?.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enviar Teste</CardTitle>
                    <CardDescription>
                      Envie um email de teste antes de enviar para todos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="flex-1"
                    />
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
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isPending || !formData.subject || !formData.html_part}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Campanha'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
