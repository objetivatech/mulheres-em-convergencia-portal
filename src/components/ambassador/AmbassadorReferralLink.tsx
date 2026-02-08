import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Link2, 
  Share2, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Mail,
  QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAmbassador } from '@/hooks/useAmbassador';

interface AmbassadorReferralLinkProps {
  referralCode: string;
}

export const AmbassadorReferralLink = ({ referralCode }: AmbassadorReferralLinkProps) => {
  const [copied, setCopied] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const { toast } = useToast();
  const { getInviteLink, getInviteLinkWithUTM } = useAmbassador();

  const baseLink = getInviteLink(referralCode);
  const customLink = utmSource || utmMedium || utmCampaign
    ? getInviteLinkWithUTM(referralCode, { 
        source: utmSource || undefined, 
        medium: utmMedium || undefined, 
        campaign: utmCampaign || undefined 
      })
    : baseLink;

  const handleCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para sua área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      getUrl: (link: string) => 
        `https://wa.me/?text=${encodeURIComponent(`Olha que oportunidade incrível! Venha fazer parte do Mulheres em Convergência: ${link}`)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      getUrl: (link: string) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      getUrl: (link: string) => 
        `mailto:?subject=${encodeURIComponent('Convite: Mulheres em Convergência')}&body=${encodeURIComponent(`Olá!\n\nQuero te convidar para conhecer o Mulheres em Convergência, uma comunidade incrível de mulheres empreendedoras.\n\nAcesse: ${link}`)}`,
    },
  ];

  const presetCampaigns = [
    { name: 'Instagram Bio', source: 'instagram', medium: 'bio', campaign: '' },
    { name: 'WhatsApp Status', source: 'whatsapp', medium: 'status', campaign: '' },
    { name: 'Email Marketing', source: 'email', medium: 'newsletter', campaign: '' },
    { name: 'Facebook Post', source: 'facebook', medium: 'post', campaign: '' },
  ];

  const applyPreset = (preset: typeof presetCampaigns[0]) => {
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
    setUtmCampaign(preset.campaign);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Seu Link de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe este link para ganhar comissões em cada assinatura
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-sm">
            {referralCode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Link Simples</TabsTrigger>
            <TabsTrigger value="advanced">Link com UTM</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={baseLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => handleCopy(baseLink)}
                variant="outline"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Compartilhar via:</Label>
              <div className="flex gap-2 flex-wrap">
                {shareLinks.map((share) => {
                  const Icon = share.icon;
                  return (
                    <Button
                      key={share.name}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(share.getUrl(baseLink), '_blank')}
                    >
                      <Icon className="h-4 w-4" />
                      {share.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="utm_source">Origem (utm_source)</Label>
                <Input
                  id="utm_source"
                  placeholder="instagram, facebook..."
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_medium">Mídia (utm_medium)</Label>
                <Input
                  id="utm_medium"
                  placeholder="post, story, bio..."
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_campaign">Campanha (utm_campaign)</Label>
                <Input
                  id="utm_campaign"
                  placeholder="lancamento, promocao..."
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Presets rápidos:</Label>
              <div className="flex gap-2 flex-wrap">
                {presetCampaigns.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link personalizado:</Label>
              <div className="flex gap-2">
                <Input 
                  value={customLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={() => handleCopy(customLink)}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
