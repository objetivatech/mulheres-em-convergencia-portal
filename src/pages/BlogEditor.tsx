import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Eye, Send } from 'lucide-react';
import slugify from 'slugify';
import DOMPurify from 'dompurify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Layout from '@/components/layout/Layout';
import { QuillEditor } from '@/components/blog/QuillEditor';
import { ImageUploader } from '@/components/blog/ImageUploader';
import { 
  useBlogPost, 
  useCreateBlogPost, 
  useUpdateBlogPost,
  BlogPost 
} from '@/hooks/useBlogPosts';
import { 
  useBlogCategories, 
  useBlogTags, 
  useCreateBlogTag,
  useCreateBlogCategory,
  useUserPermissions 
} from '@/hooks/useBlogCategories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const blogPostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  category_id: z.string().optional(),
  featured_image_url: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  published_at: z.string().optional(),
  scheduled_for: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const { data: post, isLoading: postLoading } = useBlogPost(id || '');
  const { data: categories } = useBlogCategories();
  const { data: tags } = useBlogTags();
  const { data: permissions } = useUserPermissions();
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const createTag = useCreateBlogTag();
  const createCategory = useCreateBlogCategory();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category_id: '',
      featured_image_url: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: [],
      status: 'draft',
      published_at: '',
      scheduled_for: '',
    },
  });

  // Load post data when editing
  useEffect(() => {
    if (isEditing && post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        category_id: post.category_id || '',
        featured_image_url: post.featured_image_url || '',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        seo_keywords: post.seo_keywords || [],
        status: post.status,
        published_at: post.published_at || '',
        scheduled_for: post.scheduled_for || '',
      });
      setSelectedTags(post.tags?.map(tag => tag.id) || []);
    }
  }, [post, form, isEditing]);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (!isEditing || !form.getValues('slug')) {
      const slug = slugify(title, { lower: true, strict: true });
      form.setValue('slug', slug);
    }
  };

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        slug: slugify(newTagName.trim(), { lower: true, strict: true })
      });
      setSelectedTags([...selectedTags, newTag.id]);
      setNewTagName('');
      setIsTagDialogOpen(false);
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      });
      form.setValue('category_id', newCategory.id);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCategoryDialogOpen(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      // Sanitize HTML content
      const sanitizedContent = DOMPurify.sanitize(data.content);
      
      // Force draft status for authors when publishing
      let finalStatus = data.status;
      if (permissions?.isAuthor && !permissions?.isAdmin && data.status === 'published') {
        finalStatus = 'draft';
      }
      
      const postData = {
        ...data,
        status: finalStatus,
        content: sanitizedContent,
        published_at: finalStatus === 'published' && !data.published_at 
          ? new Date().toISOString() 
          : data.published_at,
      };

      if (isEditing && id) {
        await updateBlogPost.mutateAsync({
          id,
          postData,
          tagIds: selectedTags
        });
      } else {
        await createBlogPost.mutateAsync({
          ...postData,
          tagIds: selectedTags
        });
      }

      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  if (postLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-center text-muted-foreground">Carregando post...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-nexa text-foreground">
                {isEditing ? 'Editar Post' : 'Novo Post'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Edite as informações do seu post' : 'Crie um novo post para o blog'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {form.watch('status') === 'published' && permissions?.canPublish ? (
              <Button
                type="button"
                onClick={() => form.handleSubmit((data) => onSubmit({ ...data, status: 'published' }))()}
                disabled={createBlogPost.isPending || updateBlogPost.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit((data) => onSubmit({ ...data, status: 'draft' }))()}
                disabled={createBlogPost.isPending || updateBlogPost.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {permissions?.isAuthor ? 'Enviar para Revisão' : 'Salvar Rascunho'}
              </Button>
            )}
            
            {form.watch('status') === 'draft' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit((data) => onSubmit({ ...data, status: 'draft' }))()}
                disabled={createBlogPost.isPending || updateBlogPost.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Rascunho
              </Button>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Digite o título do post"
                          onChange={(e) => handleTitleChange(e.target.value)}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="url-amigavel-do-post"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumo</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Breve descrição do post"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                   <QuillEditor
                     value={field.value}
                     onChange={field.onChange}
                     height={500}
                     placeholder="Digite o conteúdo do seu post..."
                   />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border space-y-4">
                  <h3 className="font-medium text-foreground">Configurações</h3>
                  
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <div className="flex space-x-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nova Categoria</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="category-name">Nome</Label>
                                <Input
                                  id="category-name"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="Nome da categoria"
                                />
                              </div>
                              <div>
                                <Label htmlFor="category-description">Descrição</Label>
                                <Textarea
                                  id="category-description"
                                  value={newCategoryDescription}
                                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                                  placeholder="Descrição da categoria (opcional)"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button type="button" onClick={handleCreateCategory}>
                                  Criar Categoria
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          {permissions?.canPublish && (
                            <SelectItem value="published">Publicado</SelectItem>
                          )}
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Tag</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="tag-name">Nome da Tag</Label>
                            <Input
                              id="tag-name"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Nome da tag"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="button" onClick={handleCreateTag}>
                              Criar Tag
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Selected Tags */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tagId) => {
                        const tag = tags?.find(t => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => removeTag(tagId)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {/* Available Tags */}
                  <div className="flex flex-wrap gap-2">
                    {tags?.filter(tag => !selectedTags.includes(tag.id)).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="text-sm px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Fields - Published At for published posts, Scheduled For for drafts */}
                {form.watch('status') === 'published' && (
                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Publicação</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const value = e.target.value ? new Date(e.target.value).toISOString() : '';
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Deixe em branco para usar a data atual. Você pode definir uma data no passado para posts históricos.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('status') === 'draft' && (
                  <FormField
                    control={form.control}
                    name="scheduled_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agendar Publicação</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="datetime-local"
                            placeholder="Data e hora para publicar"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Opcional: Defina quando este post deve ser publicado automaticamente.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                  <FormField
                    control={form.control}
                    name="featured_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUploader
                            value={field.value}
                            onChange={field.onChange}
                            label="Imagem Destacada"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* SEO Section */}
                <div className="bg-card p-6 rounded-lg border space-y-4">
                  <h3 className="font-medium text-foreground">SEO</h3>
                  
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Título otimizado para SEO"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descrição para motores de busca"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}