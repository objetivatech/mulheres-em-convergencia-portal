import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineItem {
  id: string;
  year: number;
  date_label: string;
  title: string;
  description: string;
  image_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTimeline = (yearFilter?: number | null) => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('timeline_items' as any)
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (yearFilter) {
        query = query.eq('year', yearFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems((data as any) || []);
    } catch (error) {
      console.error('Error fetching timeline items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('timeline_items' as any)
        .select('year')
        .eq('active', true)
        .order('year', { ascending: true });

      if (error) throw error;
      const uniqueYears = [...new Set((data as any[])?.map((d: any) => d.year) || [])];
      setYears(uniqueYears as number[]);
    } catch (error) {
      console.error('Error fetching timeline years:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [yearFilter]);

  useEffect(() => {
    fetchYears();
  }, []);

  return { items, years, loading, refetch: fetchItems };
};

export const useTimelineAdmin = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('timeline_items' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setItems((data as any) || []);
    } catch (error) {
      console.error('Error fetching timeline items:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (item: Partial<TimelineItem>) => {
    const { error } = await supabase
      .from('timeline_items' as any)
      .insert(item as any);
    if (error) throw error;
    await fetchAll();
  };

  const updateItem = async (id: string, updates: Partial<TimelineItem>) => {
    const { error } = await supabase
      .from('timeline_items' as any)
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('timeline_items' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { items, loading, createItem, updateItem, deleteItem, refetch: fetchAll };
};
