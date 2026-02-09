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
  Loader2,
  Sparkles
} from 'lucide-react';
import { AmbassadorQRCode } from './AmbassadorQRCode';
import { useAmbassadorMaterials, MaterialType } from '@/hooks/useAmbassadorMaterials';

interface AmbassadorMaterialsProps {
  referralCode: string;
  referralLink: string;
}

export const AmbassadorMaterials = ({ referralCode, referralLink }: AmbassadorMaterialsProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { useMaterialsByType, incrementDownloadCount } = useAmbassadorMaterials();
  
  const { data: whatsappTemplates = [], isLoading: loadingWpp } = useMaterialsByType('whatsapp_template');
  const { data: instagramTemplates = [], isLoading: loadingIg } = useMaterialsByType('instagram_template');
  const { data: banners = [], isLoading: loadingBanners } = useMaterialsByType('banner');
  const { data: pdfs = [], isLoading: loadingPdfs } = useMaterialsByType('pdf');

  const replaceVariables = (content: string) => {
    return content
      .replace(/\{\{LINK\}\}/g, referralLink)
      .replace(/\{\{CODIGO\}\}/g, referralCode);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(replaceVariables(text));
      setCopiedId(id);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleDownload = async (material: { id: string; file_url: string | null; title: string }) => {
    if (!material.file_url) return;
    
    try {
      await incrementDownloadCount(material.id);
      
      const link = document.createElement('a');
      link.href = material.file_url;
      link.download = material.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

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
            {loadingWpp ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : whatsappTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum template de WhatsApp disponível no momento.</p>
              </div>
            ) : (
              whatsappTemplates.map((template) => (
                <Card key={template.id} className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.title}</h4>
                        {template.category && (
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(template.content || '', template.id)}
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
                      {replaceVariables(template.content || '')}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Instagram Templates */}
          <TabsContent value="instagram" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Templates para Stories, Feed e Reels. Adapte para seu estilo!
            </p>
            {loadingIg ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : instagramTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Instagram className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum template de Instagram disponível no momento.</p>
              </div>
            ) : (
              instagramTemplates.map((template) => (
                <Card key={template.id} className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.title}</h4>
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(template.content || '', template.id)}
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
                      {replaceVariables(template.content || '')}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Banners */}
          <TabsContent value="banners" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Banners em diferentes tamanhos para suas redes sociais e materiais de divulgação.
            </p>
            {loadingBanners ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : banners.length === 0 ? (
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum banner disponível no momento.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em breve novos materiais serão adicionados!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <Card key={banner.id} className="bg-muted/50 overflow-hidden">
                    {banner.file_url && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={banner.file_url} 
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{banner.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {banner.dimensions && (
                              <Badge variant="secondary" className="text-xs">
                                {banner.dimensions}
                              </Badge>
                            )}
                            {banner.category && (
                              <Badge variant="outline" className="text-xs">
                                {banner.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(banner)}
                          disabled={!banner.file_url}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
              Apresentações e documentos em PDF para enviar por email ou imprimir.
            </p>
            {loadingPdfs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pdfs.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="font-medium mb-2">Nenhum PDF disponível</h4>
                  <p className="text-sm text-muted-foreground">
                    Em breve materiais em PDF serão adicionados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pdfs.map((pdf) => (
                  <Card key={pdf.id} className="bg-muted/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{pdf.title}</h4>
                          {pdf.description && (
                            <p className="text-sm text-muted-foreground">
                              {pdf.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(pdf)}
                        disabled={!pdf.file_url}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
