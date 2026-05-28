// src/pages/admin/AdminPages.tsx
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { usePagesList, useDeletePage } from '@/hooks/usePageEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Globe, Lock, ArrowLeft, ExternalLink } from 'lucide-react';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
};

const statusLabel: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
};

export default function AdminPages() {
  const navigate = useNavigate();
  const { data: pages = [], isLoading } = usePagesList();
  const deleteMutation = useDeletePage();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageToDelete = pages.find((p) => p.id === deleteId);

  return (
    <>
      <Helmet><title>Gerenciador de Páginas - Admin</title></Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Gerenciador de Páginas</h1>
                <p className="text-sm text-muted-foreground">Crie e edite páginas do portal com editor rico</p>
              </div>
              <Button onClick={() => navigate('/admin/paginas/nova')}>
                <Plus className="h-4 w-4 mr-2" /> Nova Página
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Todas as Páginas ({pages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando...</div>
                ) : pages.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhuma página encontrada. Clique em "+ Nova Página" para criar a primeira.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibilidade</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell>
                            <Badge variant={page.page_type === 'system' ? 'outline' : 'secondary'}>
                              {page.page_type === 'system' ? 'Sistema' : 'Livre'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[page.status] ?? 'outline'}>
                              {statusLabel[page.status] ?? page.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {page.is_public ? (
                              <span className="flex items-center gap-1 text-sm text-emerald-600">
                                <Globe className="h-3.5 w-3.5" /> Pública
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Lock className="h-3.5 w-3.5" /> Interna
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {page.is_public && page.status === 'published' ? (
                              <a
                                href={`/pagina/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                /pagina/{page.slug}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">/{page.slug}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/paginas/${page.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={page.page_type === 'system'}
                                title={page.page_type === 'system' ? 'Páginas do sistema não podem ser excluídas' : 'Excluir'}
                                onClick={() => setDeleteId(page.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{pageToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O conteúdo da página será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
