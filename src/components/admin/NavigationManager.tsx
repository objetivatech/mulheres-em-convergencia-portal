import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2, Menu, GripVertical, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

// Interface atualizada para suportar submenus
interface MenuItem {
  label: string;
  href: string;
  active: boolean;
  children?: MenuItem[]; // Suporte a submenus
}

interface NavigationMenuDB {
  id: string;
  menu_key: string;
  menu_name: string;
  menu_items: any;
  active: boolean;
}

interface NavigationMenu {
  id: string;
  menu_key: string;
  menu_name: string;
  menu_items: MenuItem[];
  active: boolean;
}

interface SortableItemProps {
  id: string;
  item: MenuItem;
  menuId: string;
  parentIndex?: number;
  index: number;
  onUpdate: (updates: Partial<MenuItem>) => void;
  onRemove: () => void;
  onAddChild?: () => void;
  onUpdateChild?: (childIndex: number, updates: Partial<MenuItem>) => void;
  onRemoveChild?: (childIndex: number) => void;
  level?: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  id, 
  item, 
  onUpdate, 
  onRemove, 
  onAddChild,
  onUpdateChild,
  onRemoveChild,
  level = 0 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div 
        className={`flex items-center space-x-2 p-3 border rounded-lg bg-card ${level > 0 ? 'ml-8 border-dashed' : ''}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Toggle para submenus */}
        {level === 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="w-4" />
            )}
          </Button>
        )}
        
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            value={item.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Rótulo"
          />
          <Input
            value={item.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="URL"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={item.active}
            onCheckedChange={(checked) => onUpdate({ active: checked })}
          />
          {level === 0 && onAddChild && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onAddChild}
              title="Adicionar submenu"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Submenus */}
      {level === 0 && hasChildren && isOpen && (
        <div className="space-y-2 ml-8">
          {item.children!.map((child, childIndex) => (
            <div 
              key={childIndex}
              className="flex items-center space-x-2 p-3 border border-dashed rounded-lg bg-muted/50"
            >
              <div className="w-6" /> {/* Espaçador */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={child.label}
                  onChange={(e) => onUpdateChild?.(childIndex, { label: e.target.value })}
                  placeholder="Rótulo do submenu"
                />
                <Input
                  value={child.href}
                  onChange={(e) => onUpdateChild?.(childIndex, { href: e.target.value })}
                  placeholder="URL"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={child.active}
                  onCheckedChange={(checked) => onUpdateChild?.(childIndex, { active: checked })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveChild?.(childIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Descrições amigáveis para cada tipo de menu
const menuDescriptions: Record<string, string> = {
  main_navigation: 'Menu principal exibido no cabeçalho do site',
  footer_navigation: 'Links de navegação exibidos no rodapé do site',
  footer_legal: 'Links jurídicos (termos, privacidade, cookies) no rodapé',
};

export const NavigationManager: React.FC = () => {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('*')
        .order('menu_key');

      if (error) throw error;

      // Converter dados do banco para o formato esperado
      const convertedMenus: NavigationMenu[] = (data || []).map((menu: NavigationMenuDB) => ({
        ...menu,
        menu_items: Array.isArray(menu.menu_items) ? menu.menu_items as MenuItem[] : []
      }));

      setMenus(convertedMenus);
    } catch (error) {
      console.error('Erro ao carregar menus:', error);
      toast.error('Erro ao carregar menus de navegação');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const menu of menus) {
        const { error } = await supabase
          .from('navigation_menus')
          .update({
            menu_name: menu.menu_name,
            menu_items: menu.menu_items as any,
            active: menu.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', menu.id);

        if (error) throw error;
      }

      toast.success('Menus de navegação salvos com sucesso!');
      fetchMenus();
    } catch (error) {
      console.error('Erro ao salvar menus:', error);
      toast.error('Erro ao salvar menus de navegação');
    } finally {
      setSaving(false);
    }
  };

  const updateMenu = (menuId: string, updates: Partial<NavigationMenu>) => {
    setMenus(prev => prev.map(menu => 
      menu.id === menuId ? { ...menu, ...updates } : menu
    ));
  };

  const addMenuItem = (menuId: string) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newItem: MenuItem = {
      label: 'Novo Item',
      href: '/',
      active: true,
      children: []
    };

    updateMenu(menuId, {
      menu_items: [...menu.menu_items, newItem]
    });
  };

  const removeMenuItem = (menuId: string, itemIndex: number) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newItems = menu.menu_items.filter((_, index) => index !== itemIndex);
    updateMenu(menuId, { menu_items: newItems });
  };

  const updateMenuItem = (menuId: string, itemIndex: number, updates: Partial<MenuItem>) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newItems = menu.menu_items.map((item, index) => 
      index === itemIndex ? { ...item, ...updates } : item
    );
    updateMenu(menuId, { menu_items: newItems });
  };

  // Funções para gerenciar submenus
  const addChildItem = (menuId: string, parentIndex: number) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newChild: MenuItem = {
      label: 'Novo Submenu',
      href: '/',
      active: true
    };

    const newItems = menu.menu_items.map((item, index) => {
      if (index === parentIndex) {
        return {
          ...item,
          children: [...(item.children || []), newChild]
        };
      }
      return item;
    });

    updateMenu(menuId, { menu_items: newItems });
  };

  const updateChildItem = (menuId: string, parentIndex: number, childIndex: number, updates: Partial<MenuItem>) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newItems = menu.menu_items.map((item, index) => {
      if (index === parentIndex && item.children) {
        return {
          ...item,
          children: item.children.map((child, cIdx) =>
            cIdx === childIndex ? { ...child, ...updates } : child
          )
        };
      }
      return item;
    });

    updateMenu(menuId, { menu_items: newItems });
  };

  const removeChildItem = (menuId: string, parentIndex: number, childIndex: number) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const newItems = menu.menu_items.map((item, index) => {
      if (index === parentIndex && item.children) {
        return {
          ...item,
          children: item.children.filter((_, cIdx) => cIdx !== childIndex)
        };
      }
      return item;
    });

    updateMenu(menuId, { menu_items: newItems });
  };

  const handleDragEnd = (menuId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const oldIndex = parseInt(active.id as string);
    const newIndex = parseInt(over.id as string);
    
    updateMenu(menuId, {
      menu_items: arrayMove(menu.menu_items, oldIndex, newIndex)
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Carregando menus...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Menu className="h-6 w-6" />
            Gerenciar Navegação
          </h2>
          <p className="text-muted-foreground">
            Configure os menus de navegação do site (incluindo submenus e rodapé)
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {menus.map((menu) => (
          <Card key={menu.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{menu.menu_name}</CardTitle>
                  <CardDescription>
                    {menuDescriptions[menu.menu_key] || `Chave: ${menu.menu_key}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`menu-active-${menu.id}`}>Ativo</Label>
                  <Switch
                    id={`menu-active-${menu.id}`}
                    checked={menu.active}
                    onCheckedChange={(checked) => 
                      updateMenu(menu.id, { active: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`menu-name-${menu.id}`}>Nome do Menu</Label>
                <Input
                  id={`menu-name-${menu.id}`}
                  value={menu.menu_name}
                  onChange={(e) => updateMenu(menu.id, { menu_name: e.target.value })}
                  placeholder="Nome do menu"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Itens do Menu</Label>
                  <Button 
                    size="sm"
                    onClick={() => addMenuItem(menu.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {menu.menu_key === 'main_navigation' && (
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: Use o botão <FolderPlus className="inline h-3 w-3" /> para adicionar submenus a cada item
                  </p>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(menu.id, event)}
                >
                  <SortableContext
                    items={menu.menu_items.map((_, idx) => idx.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {menu.menu_items.map((item, index) => (
                        <SortableItem
                          key={index}
                          id={index.toString()}
                          item={item}
                          menuId={menu.id}
                          index={index}
                          onUpdate={(updates) => updateMenuItem(menu.id, index, updates)}
                          onRemove={() => removeMenuItem(menu.id, index)}
                          onAddChild={menu.menu_key === 'main_navigation' ? () => addChildItem(menu.id, index) : undefined}
                          onUpdateChild={(childIdx, updates) => updateChildItem(menu.id, index, childIdx, updates)}
                          onRemoveChild={(childIdx) => removeChildItem(menu.id, index, childIdx)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {menu.menu_items.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum item de menu configurado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Menus
            </>
          )}
        </Button>
      </div>
    </div>
  );
};