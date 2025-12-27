import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Lightbulb, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-tertiary/20 via-background to-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                <span className="text-primary">Mulheres</span> em{' '}
                <span className="text-brand-secondary">Convergência</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Espaço criado para <strong>educar</strong>, <strong>conectar</strong> e{' '}
                <strong>impulsionar</strong> mulheres por meio do empreendedorismo e do 
                fortalecimento de redes de apoio.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Impacto Social</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <span>Autonomia Financeira</span>
                </div>
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  <span>Transformação Comunitária</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link to="/sobre">
                  Conheça Nossa História
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg" asChild>
                <Link to="/convergindo">Explore o Blog</Link>
              </Button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-primary/20 to-brand-secondary/20 rounded-full flex items-center justify-center">
                <div className="w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-tr from-primary to-brand-secondary rounded-full flex items-center justify-center shadow-2xl">
                  <div className="text-white text-center space-y-4">
                    <div className="text-2xl lg:text-3xl font-bold">MEC</div>
                    <div className="text-sm lg:text-base opacity-90">
                      Mulheres<br />
                      Empreendedoras<br />
                      Conectadas
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
