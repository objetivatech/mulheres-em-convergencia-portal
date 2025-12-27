import { IncludedContent } from '@/types/landing-page';
import { CheckCircle, Gift, Star } from 'lucide-react';

interface LPIncludedProps {
  content: IncludedContent;
}

export const LPIncluded = ({ content }: LPIncludedProps) => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            📦 {content.title}
          </h2>

          {/* Items List */}
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  item.isBonus 
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30' 
                    : item.highlight 
                      ? 'bg-primary/5 border border-primary/20' 
                      : 'bg-muted/30 border border-border/50'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.isBonus 
                    ? 'bg-primary/20' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {item.isBonus ? (
                    <Gift className="h-5 w-5 text-primary" />
                  ) : item.highlight ? (
                    <Star className="h-5 w-5 text-primary" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <p className={`text-lg ${
                  item.isBonus || item.highlight 
                    ? 'font-semibold text-foreground' 
                    : 'text-foreground'
                }`}>
                  {item.isBonus && <span className="text-primary font-bold mr-2">BÔNUS:</span>}
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
