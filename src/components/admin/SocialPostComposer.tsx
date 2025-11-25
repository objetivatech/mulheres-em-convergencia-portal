import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Linkedin, Send } from 'lucide-react';

const platformIcons = {
  linkedin: Linkedin,
};

const platformNames = {
  linkedin: 'LinkedIn',
};

export function SocialPostComposer() {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  const publishPost = useMutation({
    mutationFn: async () => {
      if (selectedPlatforms.length === 0) {
        throw new Error('Selecione pelo menos uma plataforma');
      }

      if (!content.trim()) {
        throw new Error('O conteúdo do post não pode estar vazio');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const results = [];

      for (const platform of selectedPlatforms) {
        const account = accounts?.find(acc => acc.platform === platform);
        if (!account) continue;

        try {
          const response = await supabase.functions.invoke(`social-post-${platform}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: {
              content,
              account_id: account.id,
            },
          });

          if (response.error) throw response.error;
          results.push({ platform, success: true, data: response.data });
        } catch (error: any) {
          results.push({ platform, success: false, error: error.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: 'Post publicado!',
          description: `Publicado com sucesso em ${successCount} plataforma(s)${failCount > 0 ? `. Falhou em ${failCount}.` : '.'}`,
        });
        
        if (successCount === selectedPlatforms.length) {
          setContent('');
          setSelectedPlatforms([]);
        }
      } else {
        toast({
          title: 'Erro ao publicar',
          description: 'Não foi possível publicar em nenhuma plataforma',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const activeAccounts = accounts?.filter(acc => {
    const expiresAt = new Date(acc.token_expires_at);
    return expiresAt > new Date();
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma conta conectada</CardTitle>
          <CardDescription>
            Conecte pelo menos uma conta de rede social na aba "Contas" para começar a publicar
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Post</CardTitle>
        <CardDescription>
          Escreva seu conteúdo e publique em múltiplas redes sociais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="content">Conteúdo do Post</Label>
          <Textarea
            id="content"
            placeholder="Escreva seu post aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            {content.length} caracteres
          </p>
        </div>

        <div className="space-y-3">
          <Label>Publicar em:</Label>
          <div className="space-y-2">
            {activeAccounts.map((account) => {
              const Icon = platformIcons[account.platform as keyof typeof platformIcons];
              const name = platformNames[account.platform as keyof typeof platformNames];

              return (
                <div key={account.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${account.id}`}
                    checked={selectedPlatforms.includes(account.platform)}
                    onCheckedChange={() => handlePlatformToggle(account.platform)}
                  />
                  <Label
                    htmlFor={`platform-${account.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {name} ({account.account_name})
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={() => publishPost.mutate()}
          disabled={publishPost.isPending || !content.trim() || selectedPlatforms.length === 0}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {publishPost.isPending ? 'Publicando...' : 'Publicar Agora'}
        </Button>
      </CardContent>
    </Card>
  );
}
