import { useBlogComments } from '@/hooks/useBlogComments';
import { User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentListProps {
  postId: string;
}

export const CommentList = ({ postId }: CommentListProps) => {
  const { data: comments, isLoading } = useBlogComments(postId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Nenhum comentário ainda. Seja a primeira a comentar!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
};
