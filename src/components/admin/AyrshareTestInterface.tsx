import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, CheckCircle, XCircle, Loader2, Globe, Info } from 'lucide-react';

export const AyrshareTestInterface: React.FC = () => {
  const [testPost, setTestPost] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [isPosting, setIsPosting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'instagram', name: 'Instagram', icon: '📸' }
  ];

  const handleTestPost = async () => {
    if (!testPost.trim() || selectedPlatforms.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha o conteúdo e selecione ao menos uma plataforma.',
        variant: 'destructive'
      });
      return;
    }

    setIsPosting(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-test-post', {
        body: {
          content: testPost,
          platforms: selectedPlatforms
        }
      });

      if (error) {
        throw error;
      }

      setLastResult(data);
      
      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: `Post enviado para ${selectedPlatforms.join(', ')} com sucesso.`,
        });
      } else {
        toast({
          title: 'Erro no envio',
          description: data?.error || 'Erro desconhecido ao enviar post.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao testar AYRSHARE:', error);
      setLastResult({ success: false, error: error.message });
      toast({
        title: 'Erro',
        description: 'Erro ao comunicar com o servidor AYRSHARE.',
        variant: 'destructive'
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Teste de Integração AYRSHARE</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use esta interface para testar a integração com o AYRSHARE antes de publicar posts automáticos do blog.
              Os posts de teste serão publicados nas suas redes sociais conectadas.
            </AlertDescription>
          </Alert>

          {/* Conteúdo do Post */}
          <div className="space-y-2">
            <Label htmlFor="test-content">Conteúdo do Post</Label>
            <Textarea
              id="test-content"
              placeholder="Digite o conteúdo do post de teste..."
              value={testPost}
              onChange={(e) => setTestPost(e.target.value)}
              rows={4}
              maxLength={280}
            />
            <div className="text-sm text-muted-foreground text-right">
              {testPost.length}/280 caracteres
            </div>
          </div>

          {/* Seleção de Plataformas */}
          <div className="space-y-3">
            <Label>Plataformas</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlatforms([...selectedPlatforms, platform.id]);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                      }
                    }}
                  />
                  <Label htmlFor={platform.id} className="flex items-center space-x-1 cursor-pointer">
                    <span>{platform.icon}</span>
                    <span>{platform.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Teste */}
          <Button 
            onClick={handleTestPost} 
            disabled={isPosting || !testPost.trim() || selectedPlatforms.length === 0}
            className="w-full"
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando Post...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Post de Teste
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Último Teste */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Resultado do Teste</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.success ? (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Post enviado com sucesso para as redes sociais!
                  </AlertDescription>
                </Alert>
                
                {lastResult.platforms && (
                  <div>
                    <Label className="text-sm font-medium">Plataformas:</Label>
                    <p className="text-sm text-muted-foreground">
                      {lastResult.platforms.join(', ')}
                    </p>
                  </div>
                )}

                {lastResult.ayrshare_result && (
                  <div>
                    <Label className="text-sm font-medium">Resposta do AYRSHARE:</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(lastResult.ayrshare_result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro:</strong> {lastResult.error}
                  {lastResult.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Detalhes técnicos</summary>
                      <pre className="text-xs bg-destructive/10 p-2 rounded mt-1 overflow-x-auto">
                        {lastResult.details}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como configurar o AYRSHARE:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Crie uma conta no <a href="https://ayrshare.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AYRSHARE</a></li>
                <li>Conecte suas redes sociais (Facebook, Twitter, LinkedIn, Instagram)</li>
                <li>Copie sua API Key do painel do AYRSHARE</li>
                <li>A API Key já foi configurada nos secrets do Supabase</li>
                <li>Use esta interface para testar antes de publicar posts automáticos</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};