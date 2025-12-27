import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SliderItem {
  id: string;
  type: 'event' | 'landing_page';
  title: string;
  description: string;
  imageUrl?: string;
  href: string;
  date?: Date;
  badge?: string;
  featured?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  image_url: string | null;
  date_start: string;
  status: string;
  featured?: boolean;
}

interface LandingPage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  start_date: string | null;
  end_date: string | null;
}

export const useEventsAndLPs = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar eventos publicados e futuros
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, description, slug, image_url, date_start, status')
          .eq('status', 'published')
          .gte('date_start', new Date().toISOString())
          .order('date_start', { ascending: true })
          .limit(10);

        if (eventsError) {
          console.warn('Erro ao carregar eventos:', eventsError);
        } else {
          setEvents(eventsData || []);
        }

        // Buscar landing pages ativas
        const { data: lpData, error: lpError } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('active', true)
          .order('featured', { ascending: false })
          .limit(10);

        if (lpError) {
          console.warn('Erro ao carregar landing pages:', lpError);
        } else {
          setLandingPages(lpData || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados para slider:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Combinar e ordenar itens
  const items = useMemo((): SliderItem[] => {
    const eventItems: SliderItem[] = events.map(event => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      description: event.description || 'Confira os detalhes deste evento',
      imageUrl: event.image_url || undefined,
      href: `/eventos/${event.slug}`,
      date: new Date(event.date_start),
      featured: false,
    }));

    const lpItems: SliderItem[] = landingPages.map(lp => ({
      id: lp.id,
      type: 'landing_page' as const,
      title: lp.title,
      description: lp.description || 'Confira esta oportunidade exclusiva',
      imageUrl: lp.image_url || undefined,
      href: `/${lp.slug}`,
      date: lp.start_date ? new Date(lp.start_date) : undefined,
      featured: lp.featured,
    }));

    // Ordenar: featured primeiro, depois por data
    const allItems = [...eventItems, ...lpItems];
    
    return allItems.sort((a, b) => {
      // Featured primeiro
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Depois por data (mais próximos primeiro)
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime();
      }
      if (a.date) return -1;
      if (b.date) return 1;
      
      return 0;
    });
  }, [events, landingPages]);

  return {
    items,
    events,
    landingPages,
    loading,
  };
};