import { PillarsContent } from '@/types/landing-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, Sparkles, LucideIcon } from 'lucide-react';

interface LPPillarsProps {
  content: PillarsContent;
}

const iconMap: Record<string, LucideIcon> = {
  Lightbulb,
  Target,
  Sparkles,
};

export const LPPillars = ({ content }: LPPillarsProps) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            💪 {content.title}
          </h2>

          {/* Pillars Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {content.pillars.map((pillar, index) => {
              const IconComponent = pillar.icon ? iconMap[pillar.icon] || Lightbulb : Lightbulb;
              
              return (
                <Card 
                  key={pillar.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-primary/20 hover:border-primary/40"
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-primary uppercase tracking-wide">
                      {pillar.title}
                    </p>
                    <CardTitle className="text-xl md:text-2xl text-foreground">
                      {pillar.subtitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center leading-relaxed">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
