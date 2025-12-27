import { MethodContent } from '@/types/landing-page';
import { CheckCircle } from 'lucide-react';

interface LPMethodProps {
  content: MethodContent;
}

export const LPMethod = ({ content }: LPMethodProps) => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            🧠 {content.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground">
            {content.description}
          </p>

          {/* Benefits */}
          <div className="pt-4">
            <p className="text-xl font-semibold text-foreground mb-6">
              Ele ensina o caminho certo para:
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8">
              {content.benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center gap-2 text-lg text-primary font-medium"
                >
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Closing Text */}
          <div className="pt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-lg md:text-xl text-foreground italic">
              "{content.closingText}"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
