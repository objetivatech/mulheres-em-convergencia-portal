import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Building2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  type: string;
  cnpj: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CostCenterFormData {
  name: string;
  description: string;
  type: string;
  cnpj: string;
  active: boolean;
}

export const CostCentersManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<CostCenterFormData>({
    name: '',
    description: '',
    type: 'empresa',
    cnpj: '',
    active: true,
  });

  // Fetch cost centers
  const { data: costCenters, isLoading } = useQuery({
    queryKey: ['cost-centers-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CostCenter[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CostCenterFormData) => {
      const { error } = await supabase.from('cost_centers').insert({
        name: data.name,
        description: data.description || null,
        type: data.type,
        cnpj: data.cnpj || null,
        active: data.active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers-admin'] });
      toast.success('Centro de custo criado');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar centro de custo');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CostCenterFormData }) => {
      const { error } = await supabase
        .from('cost_centers')
        .update({
          name: data.name,
          description: data.description || null,
          type: data.type,
          cnpj: data.cnpj || null,
          active: data.active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers-admin'] });
      toast.success('Centro de custo atualizado');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao atualizar centro de custo');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'empresa',
      cnpj: '',
      active: true,
    });
    setEditingCenter(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      description: center.description || '',
      type: center.type,
      cnpj: center.cnpj || '',
      active: center.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Centros de Custo</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os centros de custo para segregação financeira
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do centro de custo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="associacao">Associação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do centro de custo"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Ativo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCenter ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costCenters?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costCenters?.filter((c) => c.type === 'empresa').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Associações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costCenters?.filter((c) => c.type === 'associacao').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : costCenters?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum centro de custo cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCenters?.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{center.name}</div>
                        {center.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {center.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.type === 'empresa' ? 'default' : 'secondary'}>
                        {center.type === 'empresa' ? 'Empresa' : 'Associação'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {center.cnpj || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.active ? 'default' : 'outline'}>
                        {center.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(center)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
