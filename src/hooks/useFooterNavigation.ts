import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  label: string;
  href: string;
  active: boolean;
}

export const useFooterNavigation = () => {
  const [footerNavigation, setFooterNavigation] = useState<MenuItem[]>([]);
  const [footerLegal, setFooterLegal] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallbacks
  const fallbackNavigation: MenuItem[] = [
    { label: 'Sobre', href: '/sobre', active: true },
    { label: 'Diretório', href: '/diretorio', active: true },
    { label: 'Eventos', href: '/eventos', active: true },
    { label: 'Comunidades', href: '/comunidades', active: true },
    { label: 'Convergindo', href: '/convergindo', active: true },
    { label: 'Contato', href: '/contato', active: true },
  ];

  const fallbackLegal: MenuItem[] = [
    { label: 'Termos de Uso', href: '/termos-de-uso', active: true },
    { label: 'Política de Privacidade', href: '/politica-de-privacidade', active: true },
    { label: 'Política de Cookies', href: '/politica-de-cookies', active: true },
  ];

  useEffect(() => {
    fetchFooterMenus();
  }, []);

  const fetchFooterMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('menu_key, menu_items, active')
        .in('menu_key', ['footer_navigation', 'footer_legal']);

      if (error) {
        console.warn('Erro ao carregar menus do rodapé:', error);
        setFooterNavigation(fallbackNavigation);
        setFooterLegal(fallbackLegal);
        return;
      }

      data?.forEach(menu => {
        if (!menu.active) return;

        let items: MenuItem[] = [];
        if (Array.isArray(menu.menu_items)) {
          items = (menu.menu_items as unknown as MenuItem[]).filter(item => item.active);
        }

        if (menu.menu_key === 'footer_navigation') {
          setFooterNavigation(items.length > 0 ? items : fallbackNavigation);
        } else if (menu.menu_key === 'footer_legal') {
          setFooterLegal(items.length > 0 ? items : fallbackLegal);
        }
      });
    } catch (err) {
      console.warn('Erro ao carregar menus do rodapé:', err);
      setFooterNavigation(fallbackNavigation);
      setFooterLegal(fallbackLegal);
    } finally {
      setLoading(false);
    }
  };

  return {
    footerNavigation,
    footerLegal,
    loading,
    refetch: fetchFooterMenus
  };
};