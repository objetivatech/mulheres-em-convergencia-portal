import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAcademyCourses } from '@/hooks/useAcademy';
import { CourseCard } from '@/components/academy/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

const AcademyShowcase = () => {
  const { data: courses, isLoading } = useAcademyCourses({ status: 'published', showOnLanding: true });

  const displayCourses = courses?.slice(0, 3) || [];

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-background to-tertiary/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Novo
              </Badge>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Aprenda com quem faz: MeC Academy
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Cursos, workshops e masterclasses exclusivos para impulsionar seu empreendimento.
              Aprenda com especialistas e cresça no seu ritmo.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 self-start lg:self-auto">
            <Link to="/academy">
              Assine por R$ 29,90/mês
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : displayCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Em breve novos cursos estarão disponíveis!</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/academy">Conheça o Academy</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AcademyShowcase;
