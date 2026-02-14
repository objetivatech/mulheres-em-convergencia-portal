import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAcademyCourse, useAcademyLessons } from '@/hooks/useAcademy';
import { useAcademyAccess, useCourseProgress, useUpdateProgress, useEnrollInCourse } from '@/hooks/useAcademyEnrollment';
import { LessonPlayer } from '@/components/academy/LessonPlayer';
import { LessonList } from '@/components/academy/LessonList';
import { AccessGate } from '@/components/academy/AccessGate';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { AcademyLesson } from '@/hooks/useAcademy';

const AcademyCurso = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useAcademyCourse(slug || '');
  const { data: lessons } = useAcademyLessons(course?.id || '');
  const { data: access } = useAcademyAccess();
  const { data: progress } = useCourseProgress(course?.id || '');
  const updateProgress = useUpdateProgress();
  const enrollInCourse = useEnrollInCourse();

  const [currentLesson, setCurrentLesson] = useState<AcademyLesson | null>(null);

  const canAccess = access === 'full' || access === 'subscriber' || (access === 'free' && course?.is_free);
  const isFreeStudent = access === 'free';

  // Set initial lesson
  useEffect(() => {
    if (lessons?.length && !currentLesson) {
      setCurrentLesson(lessons[0]);
    }
  }, [lessons, currentLesson]);

  // Auto-enroll on first visit
  useEffect(() => {
    if (course?.id && canAccess) {
      enrollInCourse.mutate({ courseId: course.id });
    }
  }, [course?.id, canAccess]);

  const currentIndex = useMemo(
    () => lessons?.findIndex((l) => l.id === currentLesson?.id) ?? -1,
    [lessons, currentLesson]
  );

  const overallProgress = useMemo(() => {
    if (!lessons?.length || !progress?.length) return 0;
    const completed = progress.filter((p) => p.completed).length;
    return Math.round((completed / lessons.length) * 100);
  }, [lessons, progress]);

  const handleLessonComplete = () => {
    if (!currentLesson || !course) return;
    updateProgress.mutate({
      lessonId: currentLesson.id,
      courseId: course.id,
      completed: true,
      progressPct: 100,
    });
  };

  const goToNext = () => {
    if (lessons && currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    if (lessons && currentIndex > 0) {
      setCurrentLesson(lessons[currentIndex - 1]);
    }
  };

  if (courseLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
          <Button onClick={() => navigate('/academy/catalogo')}>Voltar ao Catálogo</Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{course.title} - MeC Academy</title>
        <meta name="description" content={course.description || ''} />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/academy/curso/${course.slug}`} />
      </Helmet>

      <Layout>
        <AccessGate requirePremium={!course.is_free} isFreeContent={course.is_free}>
          <div className="container mx-auto px-4 py-6">
            {/* Back */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy/catalogo')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Catálogo
            </Button>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                {currentLesson ? (
                  <>
                    <LessonPlayer
                      contentType={currentLesson.content_type as any}
                      contentUrl={currentLesson.content_url}
                      title={currentLesson.title}
                    />

                    {/* Lesson info & nav */}
                    <div className="mt-4 space-y-3">
                      <h2 className="text-xl font-bold">{currentLesson.title}</h2>
                      {currentLesson.description && (
                        <p className="text-muted-foreground text-sm">{currentLesson.description}</p>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentIndex <= 0}
                          onClick={goToPrev}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>

                        <Button
                          size="sm"
                          onClick={handleLessonComplete}
                          disabled={updateProgress.isPending}
                        >
                          Marcar como Concluída
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!lessons || currentIndex >= lessons.length - 1}
                          onClick={goToNext}
                        >
                          Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>

                        {lessons && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {currentIndex + 1} de {lessons.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Selecione uma aula</p>
                  </div>
                )}

                {/* Course info */}
                {course.long_description && (
                  <div className="mt-8 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.long_description }} />
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="sticky top-20 space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    {course.instructor_name && (
                      <p className="text-sm text-muted-foreground mb-3">
                        por {course.instructor_name}
                      </p>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso geral</span>
                        <span>{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                  </div>

                  {lessons && (
                    <LessonList
                      lessons={lessons}
                      progress={progress || []}
                      currentLessonId={currentLesson?.id}
                      onSelect={setCurrentLesson}
                      canAccessContent={canAccess}
                      isFreeStudent={isFreeStudent}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccessGate>
      </Layout>
    </>
  );
};

export default AcademyCurso;
