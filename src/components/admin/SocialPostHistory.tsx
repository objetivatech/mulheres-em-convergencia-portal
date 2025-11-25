import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin } from 'lucide-react';

const platformIcons = {
  linkedin: Linkedin,
};

const platformNames = {
  linkedin: 'LinkedIn',
};

const statusVariants = {
  published: 'default',
  failed: 'destructive',
  pending: 'secondary',
  scheduled: 'outline',
} as const;

const statusLabels = {
  published: 'Publicado',
  failed: 'Falhou',
  pending: 'Pendente',
  scheduled: 'Agendado',
  publishing: 'Publicando',
  cancelled: 'Cancelado',
};

export function SocialPostHistory() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['social-posts-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem histórico</CardTitle>
          <CardDescription>
            Você ainda não publicou nenhum post
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {post.platforms.map((platform: string) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const name = platformNames[platform as keyof typeof platformNames];
                    
                    return (
                      <Badge key={platform} variant="outline" className="flex items-center gap-1">
                        {Icon && <Icon className="h-3 w-3" />}
                        {name}
                      </Badge>
                    );
                  })}
                  <Badge variant={statusVariants[post.status as keyof typeof statusVariants] || 'secondary'}>
                    {statusLabels[post.status as keyof typeof statusLabels] || post.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {post.published_at
                    ? `Publicado em ${new Date(post.published_at).toLocaleString('pt-BR')}`
                    : `Criado em ${new Date(post.created_at).toLocaleString('pt-BR')}`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
            {post.error_message && (
              <p className="text-sm text-destructive mt-2">
                Erro: {post.error_message}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
