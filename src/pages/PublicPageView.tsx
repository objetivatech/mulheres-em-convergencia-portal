import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PageRow } from '@/hooks/usePageEditor';

const PublicPageView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_public', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as unknown as PageRow);
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !page) {
    return <Navigate to="/" replace />;
  }

  // Render TipTap JSON content as plain HTML via text extraction
  const renderContent = (content: unknown): string => {
    if (!content || typeof content !== 'object') return '';
    const doc = content as { type?: string; content?: unknown[] };
    if (!doc.content) return '';

    const extractText = (nodes: unknown[]): string => {
      return nodes.map((node) => {
        const n = node as { type?: string; text?: string; content?: unknown[] };
        if (n.type === 'text') return n.text ?? '';
        if (n.content) return extractText(n.content);
        return '';
      }).join('');
    };

    return extractText(doc.content);
  };

  return (
    <>
      <Helmet>
        <title>{page.seo_title || page.title}</title>
        {page.seo_description && (
          <meta name="description" content={page.seo_description} />
        )}
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <div className="prose prose-lg max-w-none">
            <p>{renderContent(page.content)}</p>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default PublicPageView;
