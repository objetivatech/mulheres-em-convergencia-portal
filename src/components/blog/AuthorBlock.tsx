import { User } from 'lucide-react';

interface AuthorBlockProps {
  displayName: string;
  photoUrl?: string | null;
  bio?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export const AuthorBlock = ({ displayName, photoUrl, bio, instagramUrl, linkedinUrl, websiteUrl }: AuthorBlockProps) => {
  const hasSocials = instagramUrl || linkedinUrl || websiteUrl;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <div className="bg-muted/50 rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start">
        {/* Photo */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sobre a autora</p>
          <h3 className="text-lg font-semibold text-foreground mb-2">{displayName}</h3>
          {bio && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">{bio}</p>
          )}
          {hasSocials && (
            <div className="flex gap-3">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Instagram
                </a>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  LinkedIn
                </a>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Site
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
