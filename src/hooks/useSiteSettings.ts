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

  // Fallback navigation - links essenciais do site
  const fallbackNavigation: NavigationMenu[] = [
    { label: 'Início', href: '/', active: true },
    { label: 'Diretório', href: '/diretorio', active: true },
    { label: 'Convergindo', href: '/convergindo', active: true },
    { label: 'Sobre', href: '/sobre', active: true },
    { label: 'Contato', href: '/contato', active: true },
  ];

  // Default settings fallback
  const fallbackSettings: SiteSettings = {
    site_title: 'Mulheres em Convergência',
    site_description: 'Portal de empreendedorismo feminino e negócios',
    contact_info: {
      email: 'contato@mulhereseconvergencia.com.br',
      phone: '',
    },
    social_links: {
      instagram: '',
      facebook: '',
      linkedin: '',
    },
    footer_text: 'Mulheres em Convergência - Todos os direitos reservados',
  };

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

      if (error) {
        console.warn('Erro ao carregar configurações, usando fallback:', error);
        setSettings(fallbackSettings);
        return;
      }

      const settingsObject: any = { ...fallbackSettings };
      data?.forEach(item => {
        try {
          // Tenta fazer o parse do JSON se for string
          if (typeof item.setting_value === 'string' && item.setting_value.startsWith('{')) {
            settingsObject[item.setting_key] = JSON.parse(item.setting_value);
          } else {
            settingsObject[item.setting_key] = item.setting_value;
          }
        } catch (e) {
          console.warn(`Erro ao fazer parse de ${item.setting_key}:`, e);
          // Mantém o valor fallback se houver erro no parse
        }
      });

      setSettings(settingsObject as SiteSettings);
    } catch (err) {
      console.warn('Erro ao carregar configurações, usando fallback:', err);
      setSettings(fallbackSettings);
      setError('Usando configurações padrão');
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

      if (error) {
        console.warn('Erro ao carregar navegação, usando fallback:', error);
        setNavigation(fallbackNavigation);
        return;
      }

      let menuItems: NavigationMenu[] = [];
      
      if (Array.isArray(data?.menu_items)) {
        menuItems = (data.menu_items as unknown as NavigationMenu[]).filter(item => item.active);
      }
      
      // Se não há itens válidos, usa fallback
      if (menuItems.length === 0) {
        menuItems = fallbackNavigation;
      }
        
      setNavigation(menuItems);
    } catch (err) {
      console.warn('Erro ao carregar navegação, usando fallback:', err);
      setNavigation(fallbackNavigation);
      setError('Usando navegação padrão');
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