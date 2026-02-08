import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ConviteFinalCTAProps {
  content: {
    title: string;
    description: string;
    buttonText: string;
  };
  onCtaClick: () => void;
}

export const ConviteFinalCTA = ({ content, onCtaClick }: ConviteFinalCTAProps) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            🎯 {content.title}
          </h2>
          
          <p className="text-lg text-muted-foreground">
            {content.description}
          </p>
          
          <Button 
            size="lg" 
            onClick={onCtaClick}
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            {content.buttonText}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
