import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/blog/ImageUploader';
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
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  description: string;
  partnership_type: string;
  start_date?: string;
  contact_email?: string;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  display_order: number;
  active: boolean;
}

interface PartnerFormData {
  name: string;
  logo_url: string;
  website_url: string;
  description: string;
  partnership_type: string;
  start_date: string;
  contact_email: string;
  instagram: string;
  linkedin: string;
  facebook: string;
}

const SortablePartnerItem = ({ partner, onEdit, onDelete, onToggleActive }: {
  partner: Partner;
  onEdit: (partner: Partner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: partner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border rounded-lg">
      <button
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <img
        src={partner.logo_url}
        alt={partner.name}
        className="w-16 h-16 object-contain rounded border"
      />

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{partner.name}</h4>
          <Badge variant={partner.active ? "default" : "secondary"}>
            {partner.active ? "Ativo" : "Inativo"}
          </Badge>
          <Badge variant="outline">{partner.partnership_type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {partner.description}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleActive(partner.id, !partner.active)}
        >
          {partner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(partner)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(partner.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const PartnersManagement = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    partnership_type: 'Parceiro',
    start_date: '',
    contact_email: '',
    instagram: '',
    linkedin: '',
    facebook: '',
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPartners((data as any) || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os parceiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = partners.findIndex((p) => p.id === active.id);
      const newIndex = partners.findIndex((p) => p.id === over.id);

      const newPartners = arrayMove(partners, oldIndex, newIndex);
      setPartners(newPartners);

      // Update display_order in database
      try {
        const updates = newPartners.map((partner, index) => ({
          id: partner.id,
          display_order: index,
        }));

      for (const update of updates) {
          await supabase
            .from('partners' as any)
            .update({ display_order: update.display_order })
            .eq('id', update.id);
        }

        toast({
          title: "Ordem atualizada",
          description: "A ordem dos parceiros foi salva com sucesso",
        });
      } catch (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a ordem",
          variant: "destructive",
        });
        fetchPartners(); // Reload to get correct order
      }
    }
  };

  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        logo_url: partner.logo_url,
        website_url: partner.website_url || '',
        description: partner.description,
        partnership_type: partner.partnership_type,
        start_date: partner.start_date || '',
        contact_email: partner.contact_email || '',
        instagram: partner.social_links?.instagram || '',
        linkedin: partner.social_links?.linkedin || '',
        facebook: partner.social_links?.facebook || '',
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        logo_url: '',
        website_url: '',
        description: '',
        partnership_type: 'Parceiro',
        start_date: '',
        contact_email: '',
        instagram: '',
        linkedin: '',
        facebook: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.logo_url || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, logo e descrição",
        variant: "destructive",
      });
      return;
    }

    try {
      const socialLinks = {
        instagram: formData.instagram || undefined,
        linkedin: formData.linkedin || undefined,
        facebook: formData.facebook || undefined,
      };

      const partnerData = {
        name: formData.name,
        logo_url: formData.logo_url,
        website_url: formData.website_url || null,
        description: formData.description,
        partnership_type: formData.partnership_type,
        start_date: formData.start_date || null,
        contact_email: formData.contact_email || null,
        social_links: socialLinks,
        display_order: editingPartner ? editingPartner.display_order : partners.length,
      };

      if (editingPartner) {
        const { error } = await supabase
          .from('partners' as any)
          .update(partnerData)
          .eq('id', editingPartner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partners' as any)
          .insert(partnerData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Parceiro ${editingPartner ? 'atualizado' : 'criado'} com sucesso`,
      });

      setDialogOpen(false);
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o parceiro",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este parceiro?')) return;

    try {
      const { error } = await supabase
        .from('partners' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parceiro deletado com sucesso",
      });

      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o parceiro",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('partners' as any)
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Parceiro ${active ? 'ativado' : 'desativado'} com sucesso`,
      });

      fetchPartners();
    } catch (error) {
      console.error('Error toggling partner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o parceiro",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Parceiros</CardTitle>
            <CardDescription>
              Adicione e organize os logos de parceiros e apoiadores
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Parceiro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : partners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum parceiro cadastrado
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={partners.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {partners.map((partner) => (
                  <SortablePartnerItem
                    key={partner.id}
                    partner={partner}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Logo do Parceiro *</Label>
              <ImageUploader
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                bucket="partner-logos"
                label="Clique para enviar logo (PNG/JPG, máx 5MB)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: 200x200px a 400x400px, PNG com fundo transparente
              </p>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partnership_type">Tipo de Parceria</Label>
                <Input
                  id="partnership_type"
                  value={formData.partnership_type}
                  onChange={(e) => setFormData({ ...formData, partnership_type: e.target.value })}
                  placeholder="Parceiro, Apoiador, Patrocinador..."
                />
              </div>

              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website_url">Site</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="contact_email">E-mail de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Redes Sociais</Label>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Instagram (URL completa)"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
                <Input
                  placeholder="LinkedIn (URL completa)"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
                <Input
                  placeholder="Facebook (URL completa)"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
