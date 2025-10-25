import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface CommunityFormData {
  name: string;
  description: string;
}

export function CommunitiesManagement() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comunidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (community?: Community) => {
    if (community) {
      setEditingCommunity(community);
      setFormData({
        name: community.name,
        description: community.description || '',
      });
    } else {
      setEditingCommunity(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da comunidade é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const communityData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      if (editingCommunity) {
        const { error } = await supabase
          .from('communities')
          .update(communityData)
          .eq('id', editingCommunity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('communities')
          .insert(communityData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Comunidade ${editingCommunity ? 'atualizada' : 'criada'} com sucesso`,
      });

      setDialogOpen(false);
      fetchCommunities();
    } catch (error: any) {
      console.error('Error saving community:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe uma comunidade com este nome",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível salvar a comunidade",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta comunidade?')) return;

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comunidade deletada com sucesso",
      });

      fetchCommunities();
    } catch (error) {
      console.error('Error deleting community:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a comunidade",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Comunidade ${!currentActive ? 'ativada' : 'desativada'} com sucesso`,
      });

      fetchCommunities();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comunidades/Coletivos</CardTitle>
              <CardDescription>
                Gerencie as comunidades que podem ser vinculadas aos negócios
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Comunidade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando...</div>
          ) : communities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma comunidade cadastrada
            </div>
          ) : (
            <div className="space-y-3">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{community.name}</h3>
                      <Badge variant={community.active ? "default" : "secondary"}>
                        {community.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    {community.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {community.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(community.id, community.active)}
                      title={community.active ? "Desativar" : "Ativar"}
                    >
                      {community.active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(community)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(community.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCommunity ? 'Editar Comunidade' : 'Nova Comunidade'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Comunidade *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Mulheres Empreendedoras"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a comunidade..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingCommunity ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
