import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AmbassadorsGrid } from '@/components/ambassadors';
import Layout from '@/components/layout/Layout';
import { Users, ArrowRight, Heart } from 'lucide-react';

export default function Embaixadoras() {
  return (
    <Layout>
      <Helmet>
        <title>Nossas Embaixadoras | Mulheres em Convergência</title>
        <meta 
          name="description" 
          content="Conheça as embaixadoras do Mulheres em Convergência. Mulheres que acreditam no poder da colaboração e estão prontas para ajudar você em sua jornada." 
        />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Nossas Embaixadoras
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Mulheres incríveis que acreditam no poder da colaboração e estão prontas 
                para ajudar você a fazer parte dessa comunidade transformadora.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <span>Conectando mulheres que fazem acontecer</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ambassadors Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <AmbassadorsGrid />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                ✨ Conte com Nossas Embaixadoras
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Nossas embaixadoras estão aqui para ajudar você a descobrir 
                como o Mulheres em Convergência pode transformar sua jornada 
                empreendedora. Entre em contato com qualquer uma delas!
              </p>
              
              <Button 
                size="lg" 
                asChild
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link to="/planos">
                  Conheça Nossos Planos
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
