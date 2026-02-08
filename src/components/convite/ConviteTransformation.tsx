import { CheckCircle } from 'lucide-react';

interface ConviteTransformationProps {
  content: {
    title: string;
    items: string[];
    ctaText: string;
  };
}

export const ConviteTransformation = ({ content }: ConviteTransformationProps) => {
  return (
    <section className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-12">
            🚀 {content.title}
          </h2>

          {/* Items */}
          <div className="space-y-4 mb-8">
            {content.items.map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 text-left bg-background rounded-lg p-4 shadow-sm"
              >
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground text-lg">{item}</p>
              </div>
            ))}
          </div>

          {/* CTA Text */}
          <p className="text-xl md:text-2xl font-semibold text-primary">
            {content.ctaText}
          </p>
        </div>
      </div>
    </section>
  );
};
