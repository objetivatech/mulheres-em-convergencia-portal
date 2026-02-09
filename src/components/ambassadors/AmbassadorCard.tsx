import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, Linkedin, Globe, Link2, MapPin } from 'lucide-react';
import { PublicAmbassador } from '@/hooks/usePublicAmbassadors';
import { toast } from 'sonner';

interface AmbassadorCardProps {
  ambassador: PublicAmbassador;
}

const tierConfig: Record<string, { label: string; color: string }> = {
  bronze: { label: 'Bronze', color: 'bg-amber-700 text-white' },
  silver: { label: 'Prata', color: 'bg-gray-400 text-gray-900' },
  gold: { label: 'Ouro', color: 'bg-yellow-500 text-yellow-900' },
};

export function AmbassadorCard({ ambassador }: AmbassadorCardProps) {
  const { referral_code, tier } = ambassador;
  const tierInfo = tierConfig[tier] || tierConfig.bronze;
  
  const referralLink = `${window.location.origin}/convite/${referral_code}`;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link copiado!');
  };

  const location = [ambassador.public_city, ambassador.public_state].filter(Boolean).join(', ');

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* Avatar with tier badge */}
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarImage src={ambassador.public_photo_url || undefined} alt={ambassador.public_name} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
              {getInitials(ambassador.public_name)}
            </AvatarFallback>
          </Avatar>
          <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${tierInfo.color} text-xs`}>
            {tierInfo.label}
          </Badge>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {ambassador.public_name}
        </h3>

        {/* Location */}
        {location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="h-3 w-3" />
            {location}
          </p>
        )}

        {/* Bio */}
        {ambassador.public_bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {ambassador.public_bio}
          </p>
        )}

        {/* Social Links */}
        <div className="flex items-center gap-2 mb-4">
          {ambassador.public_instagram_url && (
            <a
              href={ambassador.public_instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {ambassador.public_linkedin_url && (
            <a
              href={ambassador.public_linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {ambassador.public_website_url && (
            <a
              href={ambassador.public_website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Website"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Referral Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Copiar Link de Indicação
        </Button>
      </CardContent>
    </Card>
  );
}
