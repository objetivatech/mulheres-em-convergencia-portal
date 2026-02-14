import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import type { AcademyCourse } from '@/hooks/useAcademy';

interface CourseCardProps {
  course: AcademyCourse;
  progressPct?: number;
  locked?: boolean;
}

export const CourseCard = ({ course, progressPct, locked }: CourseCardProps) => {
  const linkTo = locked ? '#' : `/academy/curso/${course.slug}`;

  return (
    <Link to={linkTo} className={locked ? 'pointer-events-none' : ''}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {course.is_free ? (
              <Badge className="bg-green-600 text-white text-xs">Gratuito</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Premium</Badge>
            )}
            {course.is_standalone_lesson && (
              <Badge variant="outline" className="bg-background/80 text-xs">Aula Avulsa</Badge>
            )}
          </div>

          {locked && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">🔒 Conteúdo bloqueado</span>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          {/* Category badges */}
          <div className="flex gap-1.5 flex-wrap">
            {course.material_type && (
              <Badge variant="outline" className="text-xs">{course.material_type.name}</Badge>
            )}
            {course.subject && (
              <Badge variant="outline" className="text-xs">{course.subject.name}</Badge>
            )}
          </div>

          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            {course.total_duration_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.total_duration_minutes} min
              </span>
            )}
            {course.instructor_name && (
              <span className="truncate">{course.instructor_name}</span>
            )}
          </div>

          {/* Progress bar */}
          {progressPct !== undefined && progressPct > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
