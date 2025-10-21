import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store } from 'lucide-react';

interface AddBusinessDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUSINESS_CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'artesanato', label: 'Artesanato' },
  { value: 'beleza', label: 'Beleza e Estética' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'educacao', label: 'Educação' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'moda', label: 'Moda e Vestuário' },
  { value: 'saude', label: 'Saúde e Bem-estar' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'outros', label: 'Outros' },
];

export const AddBusinessDialog = ({ userId, userName, open, onOpenChange }: AddBusinessDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    isComplimentary: true, // Por padrão, negócios criados pelo admin são cortesia
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Gerar slug único baseado no nome
      const baseSlug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar se slug já existe e adicionar sufixo se necessário
      let slug = baseSlug;
      let counter = 1;
      let slugExists = true;
      
      while (slugExists) {
        const { data: existing } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        if (!existing) {
          slugExists = false;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Criar o negócio
      const { data: business, error } = await supabase
        .from('businesses')
        .insert({
          name: data.name,
          category: data.category,
          description: data.description || null,
          city: data.city || null,
          state: data.state || null,
          phone: data.phone || null,
          email: data.email || null,
          owner_id: userId,
          slug: slug,
          is_complimentary: data.isComplimentary,
          subscription_active: data.isComplimentary, // Se é cortesia, já ativa automaticamente
          subscription_plan: 'iniciante', // Plano padrão
        })
        .select()
        .single();

      if (error) throw error;
      return business;
    },
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ['user-businesses', userId] });
      toast({
        title: 'Negócio criado com sucesso!',
        description: `${business.name} foi adicionado para ${userName}.`,
      });
      setFormData({
        name: '',
        category: '',
        description: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        isComplimentary: true,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar negócio',
        description: error.message || 'Não foi possível criar o negócio.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do negócio.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.category) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Por favor, selecione uma categoria.',
        variant: 'destructive',
      });
      return;
    }

    createBusinessMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Adicionar Negócio para {userName}
          </DialogTitle>
          <DialogDescription>
            Crie um novo perfil de negócio para este usuário. Por padrão, o negócio será criado como cortesia (gratuito).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Negócio */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do Negócio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ateliê da Maria"
              required
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o negócio..."
              rows={3}
            />
          </div>

          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Porto Alegre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="Ex: RS"
                maxLength={2}
              />
            </div>
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(51) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@negocio.com"
              />
            </div>
          </div>

          {/* Cortesia */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="complimentary" className="text-base">
                Acesso Cortesia (Gratuito)
              </Label>
              <p className="text-sm text-muted-foreground">
                Negócios cortesia ficam ativos permanentemente sem necessidade de assinatura
              </p>
            </div>
            <Switch
              id="complimentary"
              checked={formData.isComplimentary}
              onCheckedChange={(checked) => setFormData({ ...formData, isComplimentary: checked })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBusinessMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createBusinessMutation.isPending}>
              {createBusinessMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Negócio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

