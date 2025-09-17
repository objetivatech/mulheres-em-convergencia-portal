import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilder } from '@/components/page-builder/PageBuilder';

interface PageData {
  id?: string;
  title: string;
  slug: string;
  content: any;
  status: 'draft' | 'published';
}

const defaultPageData = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        title: 'Bem-vindas ao Futuro',
        subtitle: 'Conectando mulheres empreendedoras em todo o Brasil',
        backgroundColor: 'hsl(var(--primary))',
        textColor: 'white',
        height: 'lg'
      }
    }
  ],
  root: {}
};

export default function PageBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';
  
  const [pageData, setPageData] = useState<PageData>({
    title: '',
    slug: '',
    content: defaultPageData,
    status: 'draft' as const
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadPage(id);
    }
  }, [id, isEditing]);

  const loadPage = async (pageId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;

      setPageData({
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content || defaultPageData,
        status: data.status as 'draft' | 'published'
      });
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Erro ao carregar página');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (status: 'draft' | 'published' = 'draft') => {
    try {
      setSaving(true);
      
      if (!pageData.title.trim()) {
        toast.error('Título é obrigatório');
        return;
      }

      if (!pageData.slug.trim()) {
        // Auto-generate slug from title
        const slug = pageData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        setPageData(prev => ({ ...prev, slug }));
      }

      const pageToSave = {
        title: pageData.title,
        slug: pageData.slug,
        content: pageData.content,
        status: status,
        author_id: (await supabase.auth.getUser()).data.user?.id
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('pages')
          .update(pageToSave)
          .eq('id', id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('pages')
          .insert(pageToSave)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(
        status === 'published' 
          ? 'Página publicada com sucesso!' 
          : 'Página salva como rascunho!'
      );

      if (!isEditing) {
        navigate(`/admin/page-builder/${result.data.id}`);
      } else {
        setPageData(prev => ({ ...prev, status }));
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast.error('Erro ao salvar página: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = (puckData: any) => {
    setPageData(prev => ({ ...prev, content: puckData }));
    savePage('published');
  };

  const handleSaveAsDraft = () => {
    savePage('draft');
  };

  const previewPage = () => {
    if (pageData.slug) {
      window.open(`/page/${pageData.slug}`, '_blank');
    } else {
      toast.error('Salve a página primeiro para visualizá-la');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isEditing ? `Editando: ${pageData.title}` : 'Nova Página'} | Page Builder
        </title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <div>
                  <h1 className="text-lg font-semibold">
                    {isEditing ? `Editando: ${pageData.title || 'Página sem título'}` : 'Nova Página'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {pageData.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Título da página"
                  value={pageData.title}
                  onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 border border-input rounded-md text-sm min-w-[200px]"
                />
                
                <input
                  type="text"
                  placeholder="slug-da-pagina"
                  value={pageData.slug}
                  onChange={(e) => setPageData(prev => ({ ...prev, slug: e.target.value }))}
                  className="px-3 py-2 border border-input rounded-md text-sm min-w-[150px]"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={previewPage}
                  disabled={!pageData.slug}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAsDraft}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </Button>

                <Button
                  size="sm"
                  onClick={() => handlePublish(pageData.content)}
                  disabled={saving || !pageData.title.trim()}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Builder */}
        <div className="h-[calc(100vh-73px)]">
          <PageBuilder
            data={pageData.content}
            onPublish={handlePublish}
          />
        </div>
      </div>
    </>
  );
}