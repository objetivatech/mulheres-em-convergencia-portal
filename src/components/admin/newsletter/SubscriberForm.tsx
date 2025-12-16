import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SubscriberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriber?: {
    id: number;
    email: string;
    name?: string;
    status?: string;
    group_ids?: number[];
  } | null;
  onSuccess?: () => void;
}

export function SubscriberForm({ open, onOpenChange, subscriber, onSuccess }: SubscriberFormProps) {
  const { useGroups, useCreateSubscriber, useUpdateSubscriber } = useNewsletter();
  const { toast } = useToast();
  
  const { data: groupsData } = useGroups();
  const createMutation = useCreateSubscriber();
  const updateMutation = useUpdateSubscriber();
  
  const groups = groupsData?.data || groupsData || [];
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    status: 'active',
    group_ids: [] as number[],
  });
  
  const isEditing = !!subscriber;
  
  useEffect(() => {
    if (subscriber) {
      setFormData({
        email: subscriber.email,
        name: subscriber.name || '',
        status: subscriber.status || 'active',
        group_ids: subscriber.group_ids || [],
      });
    } else {
      setFormData({
        email: '',
        name: '',
        status: 'active',
        group_ids: [],
      });
    }
  }, [subscriber, open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && subscriber) {
        await updateMutation.mutateAsync({
          id: subscriber.id,
          data: formData,
        });
        toast({
          title: 'Contato atualizado',
          description: 'As informações foram atualizadas com sucesso.',
        });
      } else {
        await createMutation.mutateAsync(formData);
        toast({
          title: 'Contato criado',
          description: 'O contato foi adicionado com sucesso.',
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
  
  const toggleGroup = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      group_ids: prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId],
    }));
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do contato'
              : 'Adicione um novo contato à lista de newsletter'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
              disabled={isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do contato"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Grupos</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
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
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.email}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
