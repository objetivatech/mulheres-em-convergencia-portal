import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { useListLandingPages, useDeleteLandingPage, useDuplicateLandingPage, useUpdateLandingPage } from '@/hooks/useLandingPages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Copy, ExternalLink, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import slugify from 'slugify';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'default' },
  archived: { label: 'Arquivada', variant: 'outline' },
};

const AdminLandingPages = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: pages, isLoading } = useListLandingPages(statusFilter);
  const deleteMutation = useDeleteLandingPage();
  const duplicateMutation = useDuplicateLandingPage();
  const updateMutation = useUpdateLandingPage();

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    navigate(`/admin/landing-pages/nova?title=${encodeURIComponent(newTitle)}&slug=${encodeURIComponent(newSlug || slugify(newTitle, { lower: true, strict: true }))}`);
    setCreateOpen(false);
    setNewTitle('');
    setNewSlug('');
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, active: !currentActive });
  };

  return (
    <>
      <Helmet>
        <title>Landing Pages - Admin</title>
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Landing Pages</h1>
                <p className="text-muted-foreground">Gerencie suas páginas de venda e eventos</p>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Landing Page
              </Button>
            </div>

            {/* Filtro */}
            <div className="flex gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {pages?.length || 0} Landing Page{(pages?.length || 0) !== 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : !pages?.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma Landing Page encontrada. Crie a primeira!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Destaque</TableHead>
                        <TableHead>Ativa</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => {
                        const status = statusLabels[page.status] || statusLabels.draft;
                        return (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">{page.title}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              /lp/{page.slug}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {page.featured && <Badge variant="outline">⭐ Destaque</Badge>}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleActive(page.id, page.active)}
                              >
                                {page.active ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/landing-pages/${page.id}`)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
                                  title="Visualizar"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => duplicateMutation.mutate(page.id)}
                                  title="Duplicar"
                                  disabled={duplicateMutation.isPending}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(page.id)}
                                  title="Excluir"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Dialog Nova LP */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(slugify(e.target.value, { lower: true, strict: true }));
                  }}
                  placeholder="Ex: Workshop Marketing Digital"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="workshop-marketing-digital"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A LP ficará acessível em: /lp/{newSlug || '...'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()}>Criar e Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmar Exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Landing Page?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. A Landing Page será permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={() => {
                  if (deleteId) deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </>
  );
};

export default AdminLandingPages;
