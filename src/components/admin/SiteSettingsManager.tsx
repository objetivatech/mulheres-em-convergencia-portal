import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, Settings, Plus, X } from 'lucide-react';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  display_name: string;
  description?: string;
  setting_type: string;
}

export const SiteSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
      
      // Inicializar formData com os valores atuais
      const initialData: Record<string, any> = {};
      data?.forEach(setting => {
        try {
          initialData[setting.setting_key] = 
            setting.setting_type === 'text' ? 
              JSON.parse(setting.setting_value as string) : 
              setting.setting_value;
        } catch (e) {
          initialData[setting.setting_key] = setting.setting_value;
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações do site');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addSocialNetwork = () => {
    const newKey = prompt('Nome da rede social (ex: tiktok, youtube, twitter):');
    if (!newKey || !newKey.trim()) return;

    const sanitizedKey = newKey.toLowerCase().trim().replace(/\s+/g, '_');
    
    if (formData.social_links && formData.social_links[sanitizedKey] !== undefined) {
      toast.error('Esta rede social já existe');
      return;
    }

    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [sanitizedKey]: ''
      }
    }));
    
    toast.success(`${newKey} adicionado com sucesso!`);
  };

  const removeSocialNetwork = (key: string) => {
    if (!confirm(`Tem certeza que deseja remover ${key}?`)) return;
    
    setFormData(prev => {
      const newSocialLinks = { ...prev.social_links };
      delete newSocialLinks[key];
      return {
        ...prev,
        social_links: newSocialLinks
      };
    });
    
    toast.success(`${key} removido com sucesso!`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preparar updates
      const updates = settings.map(setting => ({
        id: setting.id,
        setting_value: setting.setting_type === 'text' ? 
          JSON.stringify(formData[setting.setting_key]) : 
          formData[setting.setting_key]
      }));

      // Executar updates
      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            setting_value: update.setting_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      fetchSettings(); // Recarregar para sincronizar
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: SiteSetting) => {
    const value = formData[setting.setting_key] || '';
    
    if (setting.setting_type === 'json') {
      // Para JSON, renderizar campos específicos baseados na chave
      if (setting.setting_key === 'contact_info') {
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${setting.setting_key}_email`}>Email</Label>
              <Input
                id={`${setting.setting_key}_email`}
                type="email"
                value={value.email || ''}
                onChange={(e) => handleInputChange(
                  setting.setting_key,
                  { ...value, email: e.target.value },
                  setting.setting_type
                )}
                placeholder="contato@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor={`${setting.setting_key}_phone`}>Telefone</Label>
              <Input
                id={`${setting.setting_key}_phone`}
                type="tel"
                value={value.phone || ''}
                onChange={(e) => handleInputChange(
                  setting.setting_key,
                  { ...value, phone: e.target.value },
                  setting.setting_type
                )}
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>
        );
      } else if (setting.setting_key === 'social_links') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Redes Sociais</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialNetwork}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Rede
              </Button>
            </div>
            <div className="space-y-3">
              {Object.entries(value || {}).map(([key, url]) => (
                <div key={key} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      type="url"
                      value={(url as string) || ''}
                      onChange={(e) => handleInputChange(
                        setting.setting_key,
                        { ...value, [key]: e.target.value },
                        setting.setting_type
                      )}
                      placeholder={`https://${key}.com/...`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialNetwork(key)}
                    className="mb-0.5"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {(!value || Object.keys(value).length === 0) && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhuma rede social configurada. Clique em "Adicionar Rede" para começar.
              </div>
            )}
          </div>
        );
      }
    }

    // Campo de texto padrão
    return (
      <Input
        value={value}
        onChange={(e) => handleInputChange(
          setting.setting_key,
          e.target.value,
          setting.setting_type
        )}
        placeholder={setting.description}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Site
          </h2>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do portal
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

      <div className="grid gap-6">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle className="text-lg">{setting.display_name}</CardTitle>
              {setting.description && (
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {renderInput(setting)}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

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
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};