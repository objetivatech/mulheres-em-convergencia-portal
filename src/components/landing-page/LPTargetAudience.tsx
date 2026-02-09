import { TargetAudienceContent } from '@/types/landing-page';
import { UserCheck } from 'lucide-react';

interface LPTargetAudienceProps {
  content: TargetAudienceContent;
}

export const LPTargetAudience = ({ content }: LPTargetAudienceProps) => {
  return (
    <section id="para-quem" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            👩‍💼 {content.title}
          </h2>

          {/* Profiles Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {content.profiles.map((profile, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border/50 shadow-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground">
                  {profile}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
