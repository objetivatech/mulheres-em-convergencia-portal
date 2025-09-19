import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageBuilderContent {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export const usePageBuilder = (slug: string) => {
  const [pageContent, setPageContent] = useState<PageBuilderContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (error) {
          console.error('Error fetching page content:', error);
          setError(error.message);
        } else {
          setPageContent(data);
        }
      } catch (err) {
        console.error('Error fetching page content:', err);
        setError('Erro ao carregar conteúdo da página');
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
  }, [slug]);

  return { pageContent, loading, error };
};