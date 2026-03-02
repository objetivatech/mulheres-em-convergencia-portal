import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/10 to-tertiary/10">
      <div className="container mx-auto px-4 text-center space-y-6 max-w-2xl">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          Pronta para fazer parte?
        </h2>
        <p className="text-muted-foreground text-lg">
          Junte-se a uma comunidade que educa, conecta e impulsiona mulheres empreendedoras.
          Escolha seu plano e comece hoje.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg">
            <Link to="/planos">
              Associe-se Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg">
            <Link to="/academy">Conheça o Academy</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
