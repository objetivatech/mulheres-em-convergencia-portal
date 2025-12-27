import { TransformationContent } from '@/types/landing-page';
import { CheckCircle } from 'lucide-react';

interface LPTransformationProps {
  content: TransformationContent;
}

export const LPTransformation = ({ content }: LPTransformationProps) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            🚀 {content.title}
          </h2>

          {/* Transformations Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {content.transformations.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 bg-background rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-foreground font-medium">
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
