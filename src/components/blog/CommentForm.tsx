import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitComment } from '@/hooks/useBlogComments';
import { MessageCircle } from 'lucide-react';

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onCancel?: () => void;
}

export const CommentForm = ({ postId, parentId = null, onCancel }: CommentFormProps) => {
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const submitComment = useSubmitComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) return;

    await submitComment.mutateAsync({
      post_id: postId,
      author_name: authorName.trim(),
      author_email: authorEmail.trim(),
      content: content.trim(),
      parent_id: parentId,
    });

    setAuthorName('');
    setAuthorEmail('');
    setContent('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="comment-name">Nome *</Label>
          <Input
            id="comment-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Seu nome"
            required
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="comment-email">Email *</Label>
          <Input
            id="comment-email"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="Seu email (não será exibido)"
            required
            maxLength={255}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="comment-content">Comentário *</Label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seu comentário..."
          rows={4}
          required
          maxLength={1000}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitComment.isPending}>
          <MessageCircle className="w-4 h-4 mr-2" />
          {submitComment.isPending ? 'Enviando...' : 'Enviar Comentário'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Seu comentário será exibido após aprovação da moderação.
      </p>
    </form>
  );
};
