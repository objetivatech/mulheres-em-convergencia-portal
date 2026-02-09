import { PainPointsContent } from '@/types/landing-page';
import { AlertCircle } from 'lucide-react';

interface LPPainPointsProps {
  content: PainPointsContent;
}

export const LPPainPoints = ({ content }: LPPainPointsProps) => {
  return (
    <section id="desafios" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            🎯 {content.title}
          </h2>

          {/* Pain Points List */}
          <div className="space-y-4 text-left">
            {content.painPoints.map((point, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-lg text-foreground flex-1 pt-1">
                  {point.text}
                </p>
              </div>
            ))}
          </div>

          {/* Closing Statement */}
          <div className="pt-8 space-y-2">
            <p className="text-xl text-muted-foreground">
              👉 {content.closingText}
            </p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {content.closingHighlight}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
