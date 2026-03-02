import { Button } from '@/components/ui/button';
import { ArrowRight, Users, GraduationCap, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHomepageStats } from '@/hooks/useHomepageStats';

const Hero = () => {
  const { data: stats } = useHomepageStats();

  const ctaCards = [
    {
      icon: Users,
      title: 'Associe-se',
      description: 'Faça parte da maior rede de mulheres empreendedoras',
      to: '/planos',
      accent: 'primary',
    },
    {
      icon: GraduationCap,
      title: 'MeC Academy',
      description: 'Cursos e workshops para impulsionar seu negócio',
      to: '/academy',
      accent: 'secondary',
    },
    {
      icon: Search,
      title: 'Encontre Negócios',
      description: 'Descubra empreendedoras e conecte-se',
      to: '/diretorio',
      accent: 'tertiary',
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-tertiary/10 py-16 lg:py-28 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
            Conecte-se à Inteligência Coletiva da{' '}
            <span className="text-primary">Melhor Rede</span> de{' '}
            <span className="text-brand-secondary">Mulheres Empreendedoras</span> e acelere seu crescimento.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Planos de associação, cursos exclusivos e um diretório completo de negócios
            liderados por mulheres — tudo em um só lugar.
          </p>

          {/* Social proof inline */}
          {stats && stats.totalMembers > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>
                Mais de <strong className="text-foreground">{stats.totalMembers}</strong> empreendedoras conectadas
              </span>
            </div>
          )}
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
          {ctaCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group relative flex flex-col items-center text-center p-6 lg:p-8 rounded-xl border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <card.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-snug">{card.description}</p>
              <ArrowRight className="w-4 h-4 text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
