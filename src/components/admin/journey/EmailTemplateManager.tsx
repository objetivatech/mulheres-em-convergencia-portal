import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Plus, Edit, Eye, Trash2 } from 'lucide-react';

const JOURNEY_STAGES = [
  { value: 'signup', label: 'Cadastro Inicial' },
  { value: 'profile_completed', label: 'Perfil Completo' },
  { value: 'plan_selected', label: 'Plano Selecionado' },
  { value: 'payment_pending', label: 'Pagamento Pendente' },
  { value: 'payment_confirmed', label: 'Pagamento Confirmado' },
  { value: 'active', label: 'Ativo' }
];

const AVAILABLE_VARIABLES = [
  { key: '{{user_name}}', description: 'Nome do usuário' },
  { key: '{{user_email}}', description: 'Email do usuário' },
  { key: '{{stage_name}}', description: 'Nome do estágio' },
  { key: '{{action_url}}', description: 'URL de ação' },
  { key: '{{support_email}}', description: 'Email de suporte' }
];

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  journey_stage: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export const EmailTemplateManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([template as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template criado com sucesso');
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Erro ao criar template');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...template }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template atualizado com sucesso');
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar template');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir template');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const template = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      html_content: formData.get('html_content') as string,
      text_content: formData.get('text_content') as string,
      journey_stage: formData.get('journey_stage') as string,
      is_active: formData.get('is_active') === 'on',
      variables: AVAILABLE_VARIABLES.map(v => v.key)
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...template });
    } else {
      createMutation.mutate(template);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Email</h2>
          <p className="text-muted-foreground">Gerencie templates personalizados para cada estágio da jornada</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Crie templates personalizados com variáveis dinâmicas
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingTemplate?.name}
                  placeholder="Ex: Boas-vindas após cadastro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="journey_stage">Estágio da Jornada</Label>
                <Select name="journey_stage" defaultValue={editingTemplate?.journey_stage} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNEY_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={editingTemplate?.subject}
                  placeholder="Use variáveis como {{user_name}}"
                  required
                />
              </div>

              <div>
                <Label htmlFor="html_content">Conteúdo HTML</Label>
                <Textarea
                  id="html_content"
                  name="html_content"
                  defaultValue={editingTemplate?.html_content}
                  placeholder="Use HTML e variáveis como {{user_name}}"
                  rows={10}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="text_content">Conteúdo Texto (opcional)</Label>
                <Textarea
                  id="text_content"
                  name="text_content"
                  defaultValue={editingTemplate?.text_content}
                  placeholder="Versão em texto puro"
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={editingTemplate?.is_active ?? true}
                />
                <Label htmlFor="is_active">Template ativo</Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Variáveis Disponíveis:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {AVAILABLE_VARIABLES.map(variable => (
                    <div key={variable.key} className="flex items-start gap-2">
                      <code className="bg-background px-2 py-1 rounded text-xs">{variable.key}</code>
                      <span className="text-muted-foreground">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">
                    {JOURNEY_STAGES.find(s => s.value === template.journey_stage)?.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(template);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este template?')) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template criado ainda</p>
              <p className="text-sm">Clique em "Novo Template" para começar</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Assunto: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-background">
            <div dangerouslySetInnerHTML={{ __html: previewTemplate?.html_content || '' }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
