// src/pages/admin/AdminPageEditor.tsx
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { usePage, useSavePage, getEditorContent } from '@/hooks/usePageEditor';
import type { PageSavePayload } from '@/hooks/usePageEditor';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Globe, Lock, ExternalLink, Loader2 } from 'lucide-react';

// Simple inline slugify (avoids external dependency issues)
const toSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

export default function AdminPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'nova';

  const { data: existing, isLoading } = usePage(isNew ? undefined : id);
  const saveMutation = useSavePage();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [content, setContent] = useState<TipTapDoc | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Populate form when existing data loads
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setStatus(existing.status as 'draft' | 'published');
      setIsPublic(existing.is_public);
      setSeoTitle(existing.seo_title ?? '');
      setSeoDescription(existing.seo_description ?? '');
      setContent(getEditorContent(existing));
    }
  }, [existing]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsDirty(true);
    if (isNew) setSlug(toSlug(value));
  };

  const handleContentChange = (doc: TipTapDoc) => {
    setContent(doc);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content) return;
    const payload: PageSavePayload = {
      id: isNew ? undefined : id,
      title,
      slug,
      status,
      is_public: isPublic,
      page_type: existing?.page_type ?? 'free',
      seo_title: seoTitle || undefined,
      seo_description: seoDescription || undefined,
      content,
    };
    const saved = await saveMutation.mutateAsync(payload);
    setIsDirty(false);
    if (isNew) navigate(`/admin/paginas/${saved.id}`, { replace: true });
  };

  const isSystemPage = existing?.page_type === 'system';
  const publicUrl = isPublic && status === 'published' ? `/pagina/${slug}` : null;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Nova Página' : `Editar: ${title}`} - Admin</title>
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Header bar */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/paginas')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold flex-1 truncate">
                {isNew ? 'Nova Página' : title || 'Editar Página'}
              </h1>
              {isDirty && <span className="text-xs text-amber-600 font-medium">Alterações não salvas</span>}
            </div>

            <div className="flex gap-6">
              {/* Main content: tabs */}
              <div className="flex-1 min-w-0">
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título da página</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Ex: Sobre o projeto"
                        className="mt-1 text-lg font-semibold"
                      />
                    </div>
                    <TipTapEditor
                      content={content}
                      onChange={handleContentChange}
                      placeholder="Comece a escrever o conteúdo da página..."
                      className="mt-2"
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-4">
                    <div>
                      <Label htmlFor="seo-title">Título SEO</Label>
                      <p className="text-xs text-muted-foreground mb-1">Exibido na aba do navegador e nos resultados de busca. Recomendado: 50–60 caracteres.</p>
                      <Input
                        id="seo-title"
                        value={seoTitle}
                        onChange={(e) => { setSeoTitle(e.target.value); setIsDirty(true); }}
                        placeholder={title}
                        maxLength={80}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/80</p>
                    </div>
                    <div>
                      <Label htmlFor="seo-description">Descrição SEO</Label>
                      <p className="text-xs text-muted-foreground mb-1">Exibida nos resultados de busca. Recomendado: 120–160 caracteres.</p>
                      <Textarea
                        id="seo-description"
                        value={seoDescription}
                        onChange={(e) => { setSeoDescription(e.target.value); setIsDirty(true); }}
                        placeholder="Breve descrição do conteúdo da página..."
                        rows={3}
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/200</p>
                    </div>
                    {/* Search preview */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Prévia no Google</p>
                      <p className="text-blue-600 text-sm font-medium truncate">{seoTitle || title || 'Título da página'}</p>
                      <p className="text-green-700 text-xs">{publicUrl ?? `/${slug || 'pagina/slug'}`}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{seoDescription || 'Descrição da página aparecerá aqui...'}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div>
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isSystemPage ? 'O slug de páginas do sistema não pode ser alterado.' : 'Identificador único na URL. Use apenas letras minúsculas, números e hifens.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">/pagina/</span>
                        <Input
                          id="slug"
                          value={slug}
                          onChange={(e) => { setSlug(e.target.value); setIsDirty(true); }}
                          disabled={isSystemPage}
                          placeholder="minha-pagina"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Visibilidade pública</Label>
                        <p className="text-xs text-muted-foreground">Quando ativado, a página fica acessível em <code>/pagina/{slug || 'slug'}</code></p>
                      </div>
                      <Switch
                        checked={isPublic}
                        onCheckedChange={(v) => { setIsPublic(v); setIsDirty(true); }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <aside className="w-64 flex-shrink-0">
                <Card className="sticky top-24">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Publicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                        {status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Visibilidade</span>
                      <span className="flex items-center gap-1 text-sm">
                        {isPublic
                          ? <><Globe className="h-3.5 w-3.5 text-emerald-600" /> Pública</>
                          : <><Lock className="h-3.5 w-3.5" /> Interna</>
                        }
                      </span>
                    </div>

                    {publicUrl && (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline break-all"
                      >
                        Ver página <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { setStatus(status === 'published' ? 'draft' : 'published'); setIsDirty(true); }}
                      >
                        {status === 'published' ? 'Mover para Rascunho' : 'Publicar'}
                      </Button>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleSave}
                        disabled={saveMutation.isPending || !title.trim() || !slug.trim()}
                      >
                        {saveMutation.isPending
                          ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...</>
                          : <><Save className="h-3.5 w-3.5 mr-1.5" /> Salvar</>
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
