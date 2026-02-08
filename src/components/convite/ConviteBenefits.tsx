import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Store, Calendar, Award, Headphones, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  Store,
  Calendar,
  Award,
  Headphones,
};

interface ConviteBenefitsProps {
  content: {
    title: string;
    subtitle: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
}

export const ConviteBenefits = ({ content }: ConviteBenefitsProps) => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              ✨ {content.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.items.map((item, index) => {
              const Icon = iconMap[item.icon] || Users;
              return (
                <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
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
