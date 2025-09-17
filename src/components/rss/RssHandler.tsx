import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const RssHandler: React.FC = () => {
  useEffect(() => {
    const handleRssRequest = async () => {
      if (window.location.pathname === '/rss.xml') {
        try {
          const { data, error } = await supabase.functions.invoke('generate-rss');
          
          if (error) {
            console.error('Error generating RSS:', error);
            return;
          }
          
          // Create a blob and trigger download or display
          const blob = new Blob([data], { type: 'application/rss+xml' });
          const url = URL.createObjectURL(blob);
          
          // Replace current page with RSS content
          window.location.href = url;
        } catch (error) {
          console.error('Error handling RSS request:', error);
        }
      }
    };

    handleRssRequest();
  }, []);

  return null; // This component doesn't render anything
};