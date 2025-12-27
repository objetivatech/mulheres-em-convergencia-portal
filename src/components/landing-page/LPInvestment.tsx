import { InvestmentContent, ProductConfig } from '@/types/landing-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, CreditCard } from 'lucide-react';

interface LPInvestmentProps {
  content: InvestmentContent;
  product: ProductConfig;
  onCtaClick: () => void;
  isLoading?: boolean;
}

export const LPInvestment = ({ content, product, onCtaClick, isLoading }: LPInvestmentProps) => {
  return (
    <section id="investimento" className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold">
                💰 {content.title}
              </h2>
            </div>

            <CardContent className="p-8 space-y-6">
              {/* Price */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Valor do investimento
                </p>
                <p className="text-5xl md:text-6xl font-bold text-primary">
                  {content.price}
                </p>
                <p className="text-muted-foreground">
                  pagamento único
                </p>
              </div>

              {/* Description */}
              <p className="text-center text-lg text-foreground leading-relaxed">
                {content.description}
              </p>

              {/* CTA Button */}
              <Button 
                size="lg" 
                onClick={onCtaClick}
                disabled={isLoading}
                className="w-full text-lg py-8 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {isLoading ? (
                  'Processando...'
                ) : (
                  <>
                    {content.ctaText}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>PIX, Cartão ou Boleto</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
