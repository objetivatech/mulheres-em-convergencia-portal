import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2, Menu, GripVertical } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  active: boolean;
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
      active: true
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
            Configure os menus de navegação do site
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
                  <p className="text-sm text-muted-foreground">
                    Chave: {menu.menu_key}
                  </p>
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

                <div className="space-y-2">
                  {menu.menu_items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 p-3 border rounded-lg"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={item.label}
                          onChange={(e) => updateMenuItem(menu.id, index, { label: e.target.value })}
                          placeholder="Rótulo"
                        />
                        <Input
                          value={item.href}
                          onChange={(e) => updateMenuItem(menu.id, index, { href: e.target.value })}
                          placeholder="URL"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={item.active}
                          onCheckedChange={(checked) => 
                            updateMenuItem(menu.id, index, { active: checked })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMenuItem(menu.id, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

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