import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageBuilder from '@/components/page-builder/PageBuilder';
import { Data } from '@measured/puck';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  content: Data;
  created_at: string;
  updated_at: string;
}

export const PageBuilderAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Check admin permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        navigate('/dashboard');
        return;
      }

      fetchPages();
    };

    checkPermissions();
  }, [user, navigate]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar páginas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createPage = async () => {
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      toast({
        title: 'Erro',
        description: 'Título e slug são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const defaultData: Data = {
        content: [],
        root: {}
      };

      const { data, error } = await supabase
        .from('pages')
        .insert({
          title: newPageTitle,
          slug: newPageSlug,
          status: 'draft',
          content: defaultData,
          author_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setPages([data, ...pages]);
      setCurrentPage(data);
      setMode('edit');
      setNewPageTitle('');
      setNewPageSlug('');

      toast({
        title: 'Sucesso',
        description: 'Página criada com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar página',
        variant: 'destructive'
      });
    }
  };

  const savePage = async (data: Data) => {
    if (!currentPage) return;

    try {
      const { error } = await supabase
        .from('pages')
        .update({
          content: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPage.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Página salva com sucesso'
      });

      fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar página',
        variant: 'destructive'
      });
    }
  };

  const publishPage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ status: 'published' })
        .eq('id', pageId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Página publicada com sucesso'
      });

      fetchPages();
    } catch (error: any) {
      console.error('Error publishing page:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao publicar página',
        variant: 'destructive'
      });
    }
  };

  const deletePage = async (pageId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta página?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setPages(pages.filter(p => p.id !== pageId));

      toast({
        title: 'Sucesso',
        description: 'Página excluída com sucesso'
      });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir página',
        variant: 'destructive'
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (mode === 'edit' && currentPage) {
    return (
      <div className="fixed inset-0 z-50">
        <PageBuilder
          data={currentPage.content}
          onPublish={savePage}
          onChange={(data) => savePage(data)}
        />
        <Button
          className="fixed top-4 left-4 z-50"
          variant="outline"
          onClick={() => {
            setMode('list');
            setCurrentPage(null);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editor de Páginas</h1>
          <p className="text-muted-foreground">
            Crie e gerencie páginas personalizadas para o portal
          </p>
        </div>

        {/* Create New Page */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criar Nova Página</CardTitle>
            <CardDescription>
              Configure uma nova página usando o editor visual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título da Página</Label>
                <Input
                  id="title"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    setNewPageSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Digite o título da página"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug da URL</Label>
                <Input
                  id="slug"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="url-da-pagina"
                />
              </div>
            </div>
            <Button onClick={createPage} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Criar Página
            </Button>
          </CardContent>
        </Card>

        {/* Pages List */}
        <Card>
          <CardHeader>
            <CardTitle>Páginas Existentes</CardTitle>
            <CardDescription>
              Gerencie suas páginas personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma página criada ainda.</p>
                <p className="text-sm">Crie sua primeira página acima.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        /{page.slug} • {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Atualizada em {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={`/${page.slug}`} target="_blank">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(page);
                          setMode('edit');
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {page.status === 'draft' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => publishPage(page.id)}
                        >
                          Publicar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePage(page.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PageBuilderAdmin;