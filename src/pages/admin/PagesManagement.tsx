import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Globe, FileText } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  author_id: string;
}

const PagesManagement = () => {
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Page[];
    }
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('Página excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting page:', error);
      toast.error('Erro ao excluir página');
    }
  });

  const togglePageStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'published' }) => {
      const { error } = await supabase
        .from('pages')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('Status da página atualizado!');
    },
    onError: (error) => {
      console.error('Error updating page status:', error);
      toast.error('Erro ao atualizar status da página');
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-center text-muted-foreground">Carregando páginas...</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Páginas | Admin</title>
      </Helmet>
      
      <Layout>
        <div className="container mx-auto py-8">
          <AdminBackButton />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-nexa text-foreground">Gerenciar Páginas</h1>
              <p className="text-muted-foreground">
                Crie e gerencie páginas personalizadas com o Page Builder
              </p>
            </div>
            
            <Button asChild>
              <Link to="/admin/page-builder/new">
                <Plus className="w-4 h-4 mr-2" />
                Nova Página
              </Link>
            </Button>
          </div>

          {pages && pages.length > 0 ? (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span>{page.title || 'Sem título'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                          {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {page.status === 'published' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                            >
                              <a 
                                href={`/page/${page.slug}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            asChild
                          >
                            <Link to={`/admin/page-builder/${page.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => 
                              togglePageStatus.mutate({
                                id: page.id,
                                status: page.status === 'published' ? 'draft' : 'published'
                              })
                            }
                            disabled={togglePageStatus.isPending}
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir página?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A página "{page.title}" será excluída permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePage.mutate(page.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma página criada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira página personalizada
              </p>
              <Button asChild>
                <Link to="/admin/page-builder/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Página
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default PagesManagement;