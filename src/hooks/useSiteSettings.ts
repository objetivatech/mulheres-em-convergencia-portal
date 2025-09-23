import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_title: string;
  site_description: string;
  contact_info: {
    email: string;
    phone: string;
  };
  social_links: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  footer_text: string;
}

interface NavigationMenu {
  label: string;
  href: string;
  active: boolean;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navigation, setNavigation] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchNavigation();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['site_title', 'site_description', 'contact_info', 'social_links', 'footer_text']);

      if (error) throw error;

      const settingsObject: any = {};
      data?.forEach(item => {
        try {
          settingsObject[item.setting_key] = typeof item.setting_value === 'string' 
            ? JSON.parse(item.setting_value) 
            : item.setting_value;
        } catch (e) {
          settingsObject[item.setting_key] = item.setting_value;
        }
      });

      setSettings(settingsObject as SiteSettings);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações do site');
    }
  };

  const fetchNavigation = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('menu_items')
        .eq('menu_key', 'main_navigation')
        .eq('active', true)
        .single();

      if (error) throw error;

      const menuItems = Array.isArray(data?.menu_items) 
        ? (data.menu_items as unknown as NavigationMenu[])
        : [];
        
      setNavigation(menuItems.filter(item => item.active));
    } catch (err) {
      console.error('Erro ao carregar navegação:', err);
      setError('Erro ao carregar menu de navegação');
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    navigation,
    loading,
    error,
    refetch: () => {
      fetchSettings();
      fetchNavigation();
    }
  };
};