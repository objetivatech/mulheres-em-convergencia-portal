import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, Filter, Clock, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useBlogPosts, useDeleteBlogPost } from '@/hooks/useBlogPosts';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { usePendingCommentsCount } from '@/hooks/useBlogComments';
import { CommentModeration } from '@/components/admin/blog/CommentModeration';
import { AuthorManager } from '@/components/admin/blog/AuthorManager';
import { useAuth } from '@/hooks/useAuth';

export default function BlogDashboard() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, user } = useAuth();

  const { data: posts, isLoading } = useBlogPosts(statusFilter);
  const { data: categories } = useBlogCategories();
  const { data: pendingCount } = usePendingCommentsCount();
  const deleteBlogPost = useDeleteBlogPost();

  // For blog editors (non-admin), filter to show only their own posts
  const userPosts = isAdmin ? posts : posts?.filter(p => p.author_id === user?.id);

  const getStatusBadge = (status: string, scheduledFor?: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, className: '' },
      published: { label: 'Publicado', variant: 'default' as const, className: '' },
      archived: { label: 'Arquivado', variant: 'outline' as const, className: '' },
      scheduled: { label: 'Agendado', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={config.variant} className={config.className}>
          {status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
          {config.label}
        </Badge>
        {status === 'scheduled' && scheduledFor && (
          <span className="text-xs text-muted-foreground">
            {new Date(scheduledFor).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  };

  const filteredPosts = userPosts?.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteBlogPost.mutateAsync(id);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <AdminBackButton label="Voltar ao Admin" />
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-nexa text-foreground">Painel do Blog</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus posts, categorias e conteúdo do blog
            </p>
          </div>
          <div className="flex space-x-3">
            <Button asChild variant="outline">
              <Link to="/admin/blog/categorias">
                <Filter className="w-4 h-4 mr-2" />
                Categorias
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/blog/novo">
                <Plus className="w-4 h-4 mr-2" />
                Novo Post
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-medium text-sm text-muted-foreground">Total de Posts</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{userPosts?.length || 0}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-medium text-sm text-muted-foreground">Publicados</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{userPosts?.filter(p => p.status === 'published').length || 0}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-medium text-sm text-muted-foreground">Rascunhos</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{userPosts?.filter(p => p.status === 'draft').length || 0}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-medium text-sm text-muted-foreground">Agendados</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{userPosts?.filter(p => p.status === 'scheduled').length || 0}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-medium text-sm text-muted-foreground">Categorias</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{categories?.length || 0}</p>
          </div>
        </div>

        {/* Tabs: Posts, Authors, Comments (admin only for authors/comments) */}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="authors" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Autores
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  Comentários
                  {!!pendingCount && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="scheduled">Agendados</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts Table */}
            <div className="bg-card rounded-lg border">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">Carregando posts...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Visualizações</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts?.map((post) => {
                      const isOwnPost = post.author_id === user?.id;
                      const canEdit = isAdmin || isOwnPost;
                      const canDelete = isAdmin;

                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              {post.excerpt && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status, post.scheduled_for)}</TableCell>
                          <TableCell>
                            {post.category ? (
                              <Badge variant="outline">{post.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{post.views_count}</TableCell>
                          <TableCell>
                            {(post.published_at ? new Date(post.published_at) : new Date(post.created_at)).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/convergindo/${post.slug}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              {canEdit && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/admin/blog/editar/${post.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                              )}
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o post "{post.title}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(post.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="authors" className="mt-4">
                <AuthorManager />
              </TabsContent>
              <TabsContent value="comments" className="mt-4">
                <CommentModeration />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
