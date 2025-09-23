import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, Settings } from 'lucide-react';

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
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${setting.setting_key}_instagram`}>Instagram</Label>
              <Input
                id={`${setting.setting_key}_instagram`}
                type="url"
                value={value.instagram || ''}
                onChange={(e) => handleInputChange(
                  setting.setting_key,
                  { ...value, instagram: e.target.value },
                  setting.setting_type
                )}
                placeholder="https://instagram.com/usuario"
              />
            </div>
            <div>
              <Label htmlFor={`${setting.setting_key}_facebook`}>Facebook</Label>
              <Input
                id={`${setting.setting_key}_facebook`}
                type="url"
                value={value.facebook || ''}
                onChange={(e) => handleInputChange(
                  setting.setting_key,
                  { ...value, facebook: e.target.value },
                  setting.setting_type
                )}
                placeholder="https://facebook.com/pagina"
              />
            </div>
            <div>
              <Label htmlFor={`${setting.setting_key}_linkedin`}>LinkedIn</Label>
              <Input
                id={`${setting.setting_key}_linkedin`}
                type="url"
                value={value.linkedin || ''}
                onChange={(e) => handleInputChange(
                  setting.setting_key,
                  { ...value, linkedin: e.target.value },
                  setting.setting_type
                )}
                placeholder="https://linkedin.com/company/empresa"
              />
            </div>
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