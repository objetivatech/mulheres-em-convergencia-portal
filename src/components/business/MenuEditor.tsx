import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/blog/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, GripVertical, Image, Tag, FolderPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_highlighted: boolean;
  highlight_label: string | null;
  display_order: number;
}

interface MenuEditorProps {
  businessId: string;
}

const highlightLabels = [
  { value: 'novo', label: 'Novo' },
  { value: 'popular', label: 'Mais Vendido' },
  { value: 'promocao', label: 'Promoção' },
  { value: 'destaque', label: 'Destaque' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'vegetariano', label: 'Vegetariano' },
];

export const MenuEditor: React.FC<MenuEditorProps> = ({ businessId }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states for new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Form states for new/edit item
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const [itemIsHighlighted, setItemIsHighlighted] = useState(false);
  const [itemHighlightLabel, setItemHighlightLabel] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('business_menu_categories')
          .select('*')
          .eq('business_id', businessId)
          .eq('active', true)
          .order('display_order'),
        supabase
          .from('business_menu_items')
          .select('*')
          .eq('business_id', businessId)
          .eq('active', true)
          .order('display_order')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(categoriesRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching menu:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cardápio',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da categoria é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('business_menu_categories')
        .insert({
          business_id: businessId,
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          display_order: categories.length
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setCategoryDialogOpen(false);
      toast({ title: 'Sucesso', description: 'Categoria adicionada!' });
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar categoria',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os itens serão mantidos sem categoria.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('business_menu_categories')
        .update({ active: false })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== categoryId));
      // Atualizar itens para remover a categoria
      setItems(items.map(item => 
        item.category_id === categoryId ? { ...item, category_id: null } : item
      ));
      toast({ title: 'Sucesso', description: 'Categoria removida!' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover categoria',
        variant: 'destructive'
      });
    }
  };

  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDescription(item.description || '');
      setItemPrice(item.price ? item.price.toString() : '');
      setItemCategoryId(item.category_id);
      setItemImageUrl(item.image_url);
      setItemIsHighlighted(item.is_highlighted);
      setItemHighlightLabel(item.highlight_label);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDescription('');
      setItemPrice('');
      setItemCategoryId(null);
      setItemImageUrl(null);
      setItemIsHighlighted(false);
      setItemHighlightLabel(null);
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do item é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        business_id: businessId,
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        price: itemPrice ? parseFloat(itemPrice.replace(',', '.')) : null,
        category_id: itemCategoryId,
        image_url: itemImageUrl,
        is_highlighted: itemIsHighlighted,
        highlight_label: itemIsHighlighted ? itemHighlightLabel : null,
        display_order: editingItem ? editingItem.display_order : items.length
      };

      if (editingItem) {
        const { error } = await supabase
          .from('business_menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        toast({ title: 'Sucesso', description: 'Item atualizado!' });
      } else {
        const { data, error } = await supabase
          .from('business_menu_items')
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;

        setItems([...items, data]);
        toast({ title: 'Sucesso', description: 'Item adicionado!' });
      }

      setItemDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar item',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('business_menu_items')
        .update({ active: false })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemId));
      toast({ title: 'Sucesso', description: 'Item removido!' });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover item',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Consultar';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cardápio / Catálogo</h3>
          <p className="text-sm text-muted-foreground">
            Adicione categorias e itens para exibir no seu perfil
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nome da Categoria *</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Entradas, Pratos Principais, Serviços..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Descrição (opcional)</Label>
                  <Textarea
                    id="categoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Breve descrição da categoria"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddCategory} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={() => openItemDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Lista de Categorias e Itens */}
      {categories.length === 0 && items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-1">Nenhum item cadastrado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Comece adicionando categorias e itens ao seu cardápio
            </p>
            <Button onClick={() => openItemDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-4">
          {/* Categorias com seus itens */}
          {categories.map((category) => {
            const categoryItems = items.filter(item => item.category_id === category.id);
            
            return (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-4">
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                    
                    {categoryItems.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Nenhum item nesta categoria
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {categoryItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            formatPrice={formatPrice}
                            onEdit={() => openItemDialog(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setItemCategoryId(category.id);
                          openItemDialog();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar item
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir categoria
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}

          {/* Itens sem categoria */}
          {items.filter(item => !item.category_id).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sem categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {items
                    .filter(item => !item.category_id)
                    .map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        formatPrice={formatPrice}
                        onEdit={() => openItemDialog(item)}
                        onDelete={() => handleDeleteItem(item.id)}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </Accordion>
      )}

      {/* Dialog para adicionar/editar item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Nome do Item *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Pizza Margherita, Corte de Cabelo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemDescription">Descrição</Label>
              <Textarea
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Descreva o item..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemPrice">Preço (R$)</Label>
                <Input
                  id="itemPrice"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0,00"
                  type="text"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCategory">Categoria</Label>
                <Select
                  value={itemCategoryId || 'none'}
                  onValueChange={(value) => setItemCategoryId(value === 'none' ? null : value)}
                >
                  <SelectTrigger id="itemCategory">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem do Item</Label>
              <ImageUploader
                value={itemImageUrl || undefined}
                onChange={(url) => setItemImageUrl(url)}
                bucket="business-gallery"
                label="Imagem do item"
              />
              {itemImageUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <img
                    src={itemImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setItemImageUrl(null)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="itemHighlight">Destacar item</Label>
                <Switch
                  id="itemHighlight"
                  checked={itemIsHighlighted}
                  onCheckedChange={setItemIsHighlighted}
                />
              </div>

              {itemIsHighlighted && (
                <div className="space-y-2">
                  <Label htmlFor="highlightLabel">Etiqueta de destaque</Label>
                  <Select
                    value={itemHighlightLabel || ''}
                    onValueChange={setItemHighlightLabel}
                  >
                    <SelectTrigger id="highlightLabel">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {highlightLabels.map((label) => (
                        <SelectItem key={label.value} value={label.value}>
                          {label.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de Card do Item
const ItemCard: React.FC<{
  item: MenuItem;
  formatPrice: (price: number | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ item, formatPrice, onEdit, onDelete }) => {
  const highlightColors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-700',
    popular: 'bg-orange-100 text-orange-700',
    promocao: 'bg-red-100 text-red-700',
    destaque: 'bg-purple-100 text-purple-700',
    vegano: 'bg-green-100 text-green-700',
    vegetariano: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Imagem */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.name}</span>
          {item.is_highlighted && item.highlight_label && (
            <Badge className={cn('text-xs', highlightColors[item.highlight_label] || 'bg-primary/10 text-primary')}>
              {highlightLabels.find(l => l.value === item.highlight_label)?.label || item.highlight_label}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        )}
        <span className="text-sm font-semibold text-primary">
          {formatPrice(item.price)}
        </span>
      </div>

      {/* Ações */}
      <div className="flex-shrink-0 flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default MenuEditor;
