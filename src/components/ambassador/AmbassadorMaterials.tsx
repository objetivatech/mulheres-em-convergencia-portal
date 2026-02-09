import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  Image as ImageIcon, 
  MessageSquare, 
  Instagram, 
  FileText,
  QrCode,
  Download,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AmbassadorQRCode } from './AmbassadorQRCode';

interface AmbassadorMaterialsProps {
  referralCode: string;
  referralLink: string;
}

export const AmbassadorMaterials = ({ referralCode, referralLink }: AmbassadorMaterialsProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  // WhatsApp message templates
  const whatsappTemplates = [
    {
      id: 'wpp-invite',
      title: 'Convite Simples',
      message: `🌟 Oi! Tudo bem?

Você já conhece o Mulheres em Convergência? É uma comunidade incrível de mulheres empreendedoras que se apoiam e crescem juntas!

Eu faço parte e tenho aprendido muito. Acho que você ia amar!

Se quiser conhecer, dá uma olhada aqui: ${referralLink}

Qualquer dúvida, me chama! 💜`
    },
    {
      id: 'wpp-benefits',
      title: 'Destacando Benefícios',
      message: `✨ Oii!

Preciso te contar sobre uma comunidade que tem transformado minha jornada empreendedora!

O Mulheres em Convergência oferece:
📚 Conteúdos exclusivos
🤝 Networking com outras mulheres
📅 Eventos e workshops
💡 Apoio mútuo de verdade

Usa meu link para conhecer: ${referralLink}

Me conta o que achou! 💜`
    },
    {
      id: 'wpp-personal',
      title: 'História Pessoal',
      message: `🌸 Oi, [NOME]!

Lembrei de você quando estava no evento do Mulheres em Convergência hoje!

Desde que entrei para a comunidade, minha visão sobre empreendedorismo mudou completamente. As mulheres lá são incríveis e o apoio é real.

Achei que você também ia curtir: ${referralLink}

Se inscreve e depois a gente conversa! 💜`
    }
  ];

  // Instagram templates
  const instagramTemplates = [
    {
      id: 'ig-stories',
      title: 'Stories',
      content: `🌟 Dica de ouro pra você que empreende!

Conheci uma comunidade que mudou minha forma de ver negócios: @mulheresemconvergencia

✨ Conteúdo exclusivo
✨ Eventos incríveis  
✨ Rede de apoio real

Link na bio pra você conhecer também! 💜

#empreendedorismofeminino #mulheresqueempreendem #comunidade #networking`
    },
    {
      id: 'ig-feed',
      title: 'Post Feed',
      content: `Se você é mulher e empreende (ou quer empreender), precisa conhecer o @mulheresemconvergencia!

É uma comunidade que une mulheres incríveis, com conteúdos, eventos e uma rede de apoio que faz toda a diferença.

Desde que entrei, aprendi tanto e fiz conexões valiosas! 🌟

👉 Link na bio para você conhecer
Use meu código: ${referralCode}

Marca aqui uma amiga que precisa conhecer! 💜

#mulheresemconvergencia #empreendedorismo #mulheresqueinspiriam #comunidadefeminina #networking #crescerjuntas`
    },
    {
      id: 'ig-reels',
      title: 'Roteiro Reels',
      content: `[HOOK] "Se você é mulher e empreende, para tudo!"

[DESENVOLVIMENTO]
Preciso te contar sobre a comunidade que mudou minha vida empreendedora.

O Mulheres em Convergência reúne mulheres incríveis que:
- Compartilham conhecimento
- Fazem networking de verdade
- Se apoiam nos desafios

[CTA]
O link tá na bio! Usa meu código ${referralCode} pra entrar 💜

#mulheresquefazem #empreendedorismofeminino`
    }
  ];

  // Banner sizes info
  const bannerInfo = [
    { size: '1200x628', usage: 'Facebook/LinkedIn', aspect: '1.91:1' },
    { size: '1080x1080', usage: 'Instagram Feed', aspect: '1:1' },
    { size: '1080x1920', usage: 'Stories/Reels', aspect: '9:16' },
    { size: '728x90', usage: 'Banner Horizontal', aspect: '8:1' },
    { size: '300x250', usage: 'Banner Quadrado', aspect: '6:5' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Materiais Promocionais</CardTitle>
            <CardDescription>
              Use estes materiais para divulgar seu link de indicação
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="whatsapp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4" />
              <span className="hidden sm:inline">Instagram</span>
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Banners</span>
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Templates */}
          <TabsContent value="whatsapp" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mensagens prontas para enviar via WhatsApp. Clique para copiar e personalize como quiser!
            </p>
            {whatsappTemplates.map((template) => (
              <Card key={template.id} className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{template.title}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.message, template.id)}
                    >
                      {copiedId === template.id ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copiar
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-background p-3 rounded-lg overflow-x-auto">
                    {template.message}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Instagram Templates */}
          <TabsContent value="instagram" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Templates para Stories, Feed e Reels. Adapte para seu estilo!
            </p>
            {instagramTemplates.map((template) => (
              <Card key={template.id} className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.id.includes('stories') ? 'Stories' : 
                         template.id.includes('reels') ? 'Reels' : 'Feed'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.content, template.id)}
                    >
                      {copiedId === template.id ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copiar
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-background p-3 rounded-lg overflow-x-auto">
                    {template.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Banners */}
          <TabsContent value="banners" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Banners em diferentes tamanhos para suas redes sociais e materiais de divulgação.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bannerInfo.map((banner, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{banner.usage}</h4>
                        <p className="text-sm text-muted-foreground">
                          {banner.size} ({banner.aspect})
                        </p>
                      </div>
                      <Badge variant="outline">Em breve</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Os banners personalizados com seu código estarão disponíveis em breve!
              </p>
            </div>
          </TabsContent>

          {/* QR Code */}
          <TabsContent value="qrcode" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              QR Code personalizado com seu link de indicação. Ideal para materiais impressos!
            </p>
            <AmbassadorQRCode 
              referralCode={referralCode} 
              referralLink={referralLink} 
            />
          </TabsContent>

          {/* PDF */}
          <TabsContent value="pdf" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Apresentação em PDF para enviar por email ou imprimir.
            </p>
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">Apresentação do Programa</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF com todos os benefícios da associação e como funciona o programa de embaixadoras.
                </p>
                <Badge variant="outline">Em breve</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
