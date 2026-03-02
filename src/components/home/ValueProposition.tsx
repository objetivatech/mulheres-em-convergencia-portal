import { Network, BookOpen, Eye, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const pillars = [
  {
    icon: Network,
    label: 'Rede de Networking',
    to: '/diretorio',
  },
  {
    icon: BookOpen,
    label: 'Cursos e Workshops',
    to: '/academy',
  },
  {
    icon: Eye,
    label: 'Visibilidade para seu Negócio',
    to: '/planos',
  },
  {
    icon: CalendarDays,
    label: 'Eventos Exclusivos',
    to: '/eventos',
  },
];

const ValueProposition = () => {
  return (
    <section className="py-8 bg-muted/50 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar) => (
            <Link
              key={pillar.label}
              to={pillar.to}
              className="flex items-center gap-3 justify-center p-3 rounded-lg hover:bg-background transition-colors group"
            >
              <pillar.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {pillar.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
