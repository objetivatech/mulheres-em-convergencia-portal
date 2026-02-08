import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react';

interface ConviteHeroProps {
  content: {
    badge: string;
    headline: string;
    subheadline: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  ambassadorName?: string;
  onCtaClick: () => void;
  onScrollClick?: () => void;
}

export const ConviteHero = ({ content, ambassadorName, onCtaClick, onScrollClick }: ConviteHeroProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c75a92' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center animate-fade-in">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {content.badge}
              {ambassadorName && (
                <span className="text-primary font-semibold"> por {ambassadorName}</span>
              )}
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {content.headline}
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-primary font-semibold animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {content.subheadline}
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {content.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              onClick={onCtaClick}
              className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {onScrollClick && (
              <Button 
                variant="ghost" 
                size="lg"
                onClick={onScrollClick}
                className="w-full sm:w-auto text-muted-foreground hover:text-primary"
              >
                {content.ctaSecondary}
                <ArrowDown className="ml-2 h-4 w-4 animate-bounce" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-6 w-6 text-muted-foreground/50" />
      </div>
    </section>
  );
};
