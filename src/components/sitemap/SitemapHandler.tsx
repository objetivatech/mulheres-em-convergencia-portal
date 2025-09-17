import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const SitemapHandler: React.FC = () => {
  useEffect(() => {
    const handleSitemapRequest = async () => {
      if (window.location.pathname === '/sitemap.xml') {
        try {
          const { data, error } = await supabase.functions.invoke('generate-sitemap');
          
          if (error) {
            console.error('Error generating sitemap:', error);
            return;
          }
          
          // Create a blob and trigger download or display
          const blob = new Blob([data], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          
          // Replace current page with sitemap content
          window.location.href = url;
        } catch (error) {
          console.error('Error handling sitemap request:', error);
        }
      }
    };

    handleSitemapRequest();
  }, []);

  return null; // This component doesn't render anything
};