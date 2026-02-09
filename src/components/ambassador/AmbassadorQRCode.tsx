import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, QrCode, Loader2 } from 'lucide-react';

interface AmbassadorQRCodeProps {
  referralCode: string;
  referralLink: string;
}

export const AmbassadorQRCode = ({ referralCode, referralLink }: AmbassadorQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [referralLink]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    
    try {
      // Use a free QR code API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}&margin=10`;
      
      // Fetch and convert to data URL
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const downloadQRCode = async () => {
    if (!qrDataUrl) {
      toast.error('QR Code não disponível');
      return;
    }

    try {
      // Create a canvas to add branding
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (QR code + padding + text)
      const qrSize = 300;
      const padding = 40;
      const textHeight = 60;
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + textHeight;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw QR code
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, padding, padding, qrSize, qrSize);
          resolve();
        };
        img.onerror = reject;
        img.src = qrDataUrl;
      });

      // Add text below QR code
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mulheres em Convergência', canvas.width / 2, qrSize + padding + 25);
      
      ctx.fillStyle = '#666666';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Código: ${referralCode}`, canvas.width / 2, qrSize + padding + 50);

      // Download
      const link = document.createElement('a');
      link.download = `qrcode-${referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('QR Code baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
      toast.error('Erro ao baixar QR Code');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* QR Code Preview */}
      <Card className="bg-muted/50">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          {isGenerating ? (
            <div className="w-[300px] h-[300px] flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code para ${referralCode}`}
              className="w-[300px] h-[300px] rounded-lg"
            />
          ) : (
            <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded-lg">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Código: <span className="font-mono font-bold">{referralCode}</span>
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Seu QR Code Personalizado</h4>
          <p className="text-sm text-muted-foreground">
            Este QR Code leva diretamente para seu link de indicação. Use em:
          </p>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>• Cartões de visita</li>
            <li>• Materiais impressos</li>
            <li>• Apresentações</li>
            <li>• Eventos presenciais</li>
            <li>• Assinatura de email</li>
          </ul>
        </div>

        <Button 
          onClick={downloadQRCode}
          className="w-full"
          disabled={isGenerating || !qrDataUrl}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar QR Code (PNG)
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          O download inclui seu código de referência para fácil identificação.
        </p>
      </div>
    </div>
  );
};
