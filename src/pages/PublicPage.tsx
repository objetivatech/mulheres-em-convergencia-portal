import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilder } from '@/components/page-builder/PageBuilder';
import NotFound from './NotFound';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: 'draft' | 'published';
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

const PublicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data as PageData;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return <NotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{page.seo_title || page.title || 'Página'} | Mulheres em Convergência</title>
        {page.seo_description && (
          <meta name="description" content={page.seo_description} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={page.seo_title || page.title} />
        {page.seo_description && (
          <meta property="og:description" content={page.seo_description} />
        )}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/page/${page.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.seo_title || page.title} />
        {page.seo_description && (
          <meta name="twitter:description" content={page.seo_description} />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${window.location.origin}/page/${page.slug}`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": page.title,
            "description": page.seo_description,
            "url": `${window.location.origin}/page/${page.slug}`,
            "datePublished": page.created_at,
            "dateModified": page.updated_at,
            "publisher": {
              "@type": "Organization",
              "name": "Mulheres em Convergência",
              "url": window.location.origin
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen">
        <PageBuilder
          data={page.content}
          onPublish={() => {}} // Read-only mode
          mode="preview"
        />
      </div>
    </>
  );
};

export default PublicPage;