import { CheckCircle, Circle, Play, FileText, Image as ImageIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AcademyLesson } from '@/hooks/useAcademy';
import type { AcademyProgress } from '@/hooks/useAcademyEnrollment';

interface LessonListProps {
  lessons: AcademyLesson[];
  progress: AcademyProgress[];
  currentLessonId?: string;
  onSelect: (lesson: AcademyLesson) => void;
  canAccessContent: boolean;
  isFreeStudent: boolean;
}

const contentIcon = (type: string) => {
  switch (type) {
    case 'youtube': return Play;
    case 'pdf': return FileText;
    case 'image': return ImageIcon;
    default: return Play;
  }
};

export const LessonList = ({
  lessons,
  progress,
  currentLessonId,
  onSelect,
  canAccessContent,
  isFreeStudent,
}: LessonListProps) => {
  const progressMap = new Map(progress.map((p) => [p.lesson_id, p]));

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-3 mb-2">
        Conteúdo ({lessons.length} aulas)
      </h3>
      {lessons.map((lesson, idx) => {
        const prog = progressMap.get(lesson.id);
        const isCompleted = prog?.completed;
        const isCurrent = lesson.id === currentLessonId;
        const Icon = contentIcon(lesson.content_type);
        const isLocked = !canAccessContent && !(isFreeStudent && lesson.is_free_preview);

        return (
          <button
            key={lesson.id}
            onClick={() => !isLocked && onSelect(lesson)}
            disabled={isLocked}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors text-sm',
              isCurrent
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted/60 text-foreground',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex-shrink-0 w-5 h-5">
              {isLocked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <span className="flex-shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="flex-1 truncate">{lesson.title}</span>
            {lesson.duration_minutes > 0 && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {lesson.duration_minutes} min
              </span>
            )}
            {lesson.is_free_preview && (
              <span className="text-xs text-green-600 font-medium flex-shrink-0">Grátis</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
