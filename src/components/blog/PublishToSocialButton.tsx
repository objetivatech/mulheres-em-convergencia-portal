import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Share2, Linkedin, Facebook, Instagram, Globe } from 'lucide-react';
import { BlogPost } from '@/hooks/useBlogPosts';

interface PublishToSocialButtonProps {
  post: BlogPost;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const platformIcons = {
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  pinterest: Globe,
};

const platformNames = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
};

export function PublishToSocialButton({ post, variant = 'outline', size = 'sm' }: PublishToSocialButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customContent, setCustomContent] = useState('');

  // Buscar contas conectadas
  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Gerar conteúdo padrão para o post
  const generateDefaultContent = () => {
    const postUrl = `https://mulheresemconvergencia.com.br/convergindo/${post.slug}`;
    return `${post.excerpt || post.title}\n\nLeia mais: ${postUrl}`;
  };

  const publishToSocial = useMutation({
    mutationFn: async () => {
      const content = customContent || generateDefaultContent();
      
      // Criar registro de social_post
      const { data: socialPost, error: postError } = await supabase
        .from('social_posts')
        .insert({
          blog_post_id: post.id,
          content,
          platforms: selectedPlatforms,
          status: 'publishing',
        })
        .select()
        .single();

      if (postError) throw postError;

      // Publicar em cada plataforma selecionada
      const results = [];
      for (const platform of selectedPlatforms) {
        try {
          const { data, error } = await supabase.functions.invoke(`social-post-${platform}`, {
            body: {
              content,
              media_urls: post.featured_image_url ? [post.featured_image_url] : undefined,
            },
          });

          if (error) throw error;
          results.push({ platform, success: true, data });
        } catch (error: any) {
          results.push({ platform, success: false, error: error.message });
        }
      }

      // Atualizar status do social_post
      const allSuccess = results.every(r => r.success);
      const platformResponses = results.reduce((acc, r) => ({
        ...acc,
        [r.platform]: r.success ? r.data : { error: r.error }
      }), {});

      await supabase
        .from('social_posts')
        .update({
          status: allSuccess ? 'published' : 'failed',
          published_at: allSuccess ? new Date().toISOString() : null,
          platform_responses: platformResponses,
          error_message: allSuccess ? null : 'Erro em uma ou mais plataformas',
        })
        .eq('id', socialPost.id);

      return { results, allSuccess };
    },
    onSuccess: ({ results, allSuccess }) => {
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: allSuccess ? 'Publicado com sucesso!' : 'Publicação parcial',
        description: allSuccess
          ? `Post publicado em ${successCount} rede(s) social(is)`
          : `Publicado em ${successCount} de ${results.length} redes. Verifique os detalhes.`,
        variant: allSuccess ? 'default' : 'destructive',
      });

      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setOpen(false);
      setSelectedPlatforms([]);
      setCustomContent('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao publicar',
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

  const handlePublish = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Selecione ao menos uma rede social',
        variant: 'destructive',
      });
      return;
    }
    publishToSocial.mutate();
  };

  const connectedPlatforms = accounts?.map(a => a.platform) || [];

  if (!accounts || accounts.length === 0) {
    return null; // Não mostrar botão se não há contas conectadas
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Publicar nas Redes
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Publicar nas Redes Sociais</DialogTitle>
            <DialogDescription>
              Selecione as redes onde deseja publicar este post
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Redes Sociais Conectadas</Label>
              {connectedPlatforms.map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons];
                const name = platformNames[platform as keyof typeof platformNames];
                
                return (
                  <div key={platform} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <Label
                      htmlFor={platform}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {name}
                    </Label>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Post (opcional)</Label>
              <Textarea
                id="content"
                placeholder={generateDefaultContent()}
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Se deixar em branco, usaremos o resumo do post com o link
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={publishToSocial.isPending || selectedPlatforms.length === 0}
            >
              {publishToSocial.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
