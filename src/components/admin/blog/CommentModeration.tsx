import { useState } from 'react';
import { Check, X, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAllBlogComments, useModerateComment, useDeleteComment } from '@/hooks/useBlogComments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CommentModeration = () => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const { data: comments, isLoading } = useAllBlogComments(statusFilter);
  const moderateComment = useModerateComment();
  const deleteComment = useDeleteComment();

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando comentários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Moderação de Comentários</h3>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!comments || comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum comentário encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autor</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment: any) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{comment.author_name}</p>
                    <p className="text-xs text-muted-foreground">{comment.author_email}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm line-clamp-2">{comment.content}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {comment.blog_posts?.title || '-'}
                  </p>
                </TableCell>
                <TableCell>{statusBadge(comment.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(comment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {comment.status !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moderateComment.mutate({ id: comment.id, status: 'approved' })}
                        title="Aprovar"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    {comment.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moderateComment.mutate({ id: comment.id, status: 'rejected' })}
                        title="Rejeitar"
                      >
                        <X className="w-4 h-4 text-orange-600" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteComment.mutate(comment.id)}
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
      )}
    </div>
  );
};
