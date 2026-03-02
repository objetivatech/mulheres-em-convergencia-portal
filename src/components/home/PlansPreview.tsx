import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscriptionPlans } from '@/hooks/useHomepageStats';
import { Skeleton } from '@/components/ui/skeleton';

const PlansPreview = () => {
  const { data: plans, isLoading } = useSubscriptionPlans();

  if (isLoading) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!plans || plans.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            Planos de Associação
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha o plano ideal para o momento do seu negócio e tenha acesso a benefícios exclusivos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const features = (plan.features as any)?.benefits as string[] | undefined;
            const topFeatures = features?.slice(0, 3) || [];
            const isFeatured = plan.is_featured;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isFeatured ? 'border-primary shadow-md ring-1 ring-primary/20' : ''
                }`}
              >
                {isFeatured && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-xs px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{plan.display_name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">
                        R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {topFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" variant="outline">
            <Link to="/planos">
              Ver Todos os Planos e Benefícios
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PlansPreview;
