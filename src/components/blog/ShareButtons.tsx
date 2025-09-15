import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  MessageCircle, 
  Send, 
  Mail, 
  Copy,
  Share2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  className?: string;
}

export const ShareButtons = ({ 
  title, 
  url, 
  description = '', 
  imageUrl,
  className = '' 
}: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  // Generate UTM parameters for tracking
  const generateUTMUrl = (source: string, medium: string = 'social') => {
    const utmParams = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: 'blog_share',
      utm_content: title.toLowerCase().replace(/\s+/g, '_')
    });
    
    return `${url}?${utmParams.toString()}`;
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(url);

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateUTMUrl('facebook'))}`,
      color: 'hover:bg-blue-600 hover:text-white',
      ariaLabel: 'Compartilhar no Facebook'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generateUTMUrl('linkedin'))}`,
      color: 'hover:bg-blue-700 hover:text-white',
      ariaLabel: 'Compartilhar no LinkedIn'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,  
      url: `https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(generateUTMUrl('whatsapp'))}`,
      color: 'hover:bg-green-600 hover:text-white',
      ariaLabel: 'Compartilhar no WhatsApp'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${encodeURIComponent(generateUTMUrl('telegram'))}&text=${encodedTitle}`,
      color: 'hover:bg-blue-500 hover:text-white',
      ariaLabel: 'Compartilhar no Telegram'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodeURIComponent(generateUTMUrl('email', 'email'))}`,
      color: 'hover:bg-gray-600 hover:text-white',
      ariaLabel: 'Compartilhar por email'
    }
  ];

  const handleCopyLink = async () => {
    try {
      const shareUrl = generateUTMUrl('copy_link', 'direct');
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error('Erro ao copiar o link');
    }
  };

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: generateUTMUrl('native_share', 'mobile')
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled or failed');
      }
    }
  };

  return (
    <div className={`share-buttons ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Compartilhar este post:
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {shareButtons.map((button) => {
          const Icon = button.icon;
          return (
            <Button
              key={button.name}
              variant="outline"
              size="sm"
              onClick={() => handleShare(button.url)}
              className={`flex items-center gap-2 transition-colors ${button.color}`}
              aria-label={button.ariaLabel}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{button.name}</span>
            </Button>
          );
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Copiar link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? 'Copiado!' : 'Copiar Link'}
          </span>
        </Button>

        {/* Native share button for mobile devices */}
        {navigator.share && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors md:hidden"
            aria-label="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </Button>
        )}
      </div>

      {/* Instagram note */}
      <div className="mt-3 p-2 bg-muted rounded-lg">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Instagram className="h-3 w-3" />
          <span>
            Para Instagram: Copie o link e compartilhe nos Stories ou posts
          </span>
        </div>
      </div>
    </div>
  );
};