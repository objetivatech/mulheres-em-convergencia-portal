import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_highlighted: boolean;
  highlight_label: string | null;
  display_order: number;
  active: boolean;
}

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

export const useBusinessMenu = (businessId: string | undefined) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch categories and items in parallel
        const [categoriesResult, itemsResult] = await Promise.all([
          supabase
            .from('business_menu_categories')
            .select('id, name, description, display_order, active')
            .eq('business_id', businessId)
            .eq('active', true)
            .order('display_order'),
          supabase
            .from('business_menu_items')
            .select('id, category_id, name, description, price, image_url, is_highlighted, highlight_label, display_order, active')
            .eq('business_id', businessId)
            .eq('active', true)
            .order('display_order')
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (itemsResult.error) throw itemsResult.error;

        setCategories(categoriesResult.data || []);
        setItems(itemsResult.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching menu:', err);
        setError(err.message);
        setCategories([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [businessId]);

  const hasMenu = categories.length > 0 || items.length > 0;

  return { categories, items, loading, error, hasMenu };
};
