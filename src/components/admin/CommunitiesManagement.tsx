import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, Users } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export const CommunitiesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Community[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('communities')
        .insert({ name: data.name, description: data.description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities-admin'] });
      toast({ title: 'Comunidade criada com sucesso!' });
      setShowDialog(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar comunidade', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Community> }) => {
      const { error } = await supabase
        .from('communities')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities-admin'] });
      toast({ title: 'Comunidade atualizada com sucesso!' });
      setShowDialog(false);
      setEditingCommunity(null);
      setFormData({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar comunidade', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities-admin'] });
      toast({ title: 'Comunidade excluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir comunidade', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    if (editingCommunity) {
      updateMutation.mutate({ id: editingCommunity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({ name: community.name, description: community.description || '' });
    setShowDialog(true);
  };

  const handleToggleActive = (community: Community) => {
    updateMutation.mutate({ id: community.id, data: { active: !community.active } });
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Total: {communities.length} | Ativas: {communities.filter(c => c.active).length}
          </p>
        </div>
        <Button onClick={() => { setEditingCommunity(null); setFormData({ name: '', description: '' }); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comunidade
        </Button>
      </div>

      <div className="grid gap-4">
        {communities.map((community) => (
          <Card key={community.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{community.name}</h3>
                    {community.description && (
                      <p className="text-sm text-muted-foreground">{community.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Cadastrado em: {new Date(community.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={community.active ? 'default' : 'secondary'}>
                    {community.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleToggleActive(community)}>
                    {community.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(community)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(community.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCommunity ? 'Editar' : 'Nova'} Comunidade/Coletivo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Coletivo Empreendedoras Unidas"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição da comunidade ou coletivo"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCommunity ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
