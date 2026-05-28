// src/pages/PublicPageView.tsx
import { Helmet } from 'react-helmet-async';
import { useParams, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { TipTapRenderer } from '@/components/editor/TipTapRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function PublicPageView() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['public-page', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug, content, seo_title, seo_description, is_public, status')
        .eq('slug', slug!)
        .eq('status', 'published')
        .eq('is_public', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Page not found or not public — redirect home
  if (isError || !page) {
    return <Navigate to="/" replace />;
  }

  const title = page.seo_title || page.title;
  const description = page.seo_description ?? undefined;

  return (
    <>
      <Helmet>
        <title>{title} | Mulheres em Convergência</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-3xl mx-auto">
            <TipTapRenderer content={page.content} />
          </article>
        </main>
      </Layout>
    </>
  );
}
