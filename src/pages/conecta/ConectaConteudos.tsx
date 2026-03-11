import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Video, FileText, Link2, BookOpen, GraduationCap, Search } from 'lucide-react';
import { useConectaContents } from '@/hooks/useConectaContents';
import { useAcademyCourses, useAcademyCategories } from '@/hooks/useAcademy';
import { useAcademyAccess } from '@/hooks/useAcademyEnrollment';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { CourseCard } from '@/components/academy/CourseCard';
import { CategoryFilter } from '@/components/academy/CategoryFilter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  video: { icon: Video, label: 'Vídeo', color: 'bg-red-100 text-red-700' },
  document: { icon: FileText, label: 'Documento', color: 'bg-blue-100 text-blue-700' },
  article: { icon: BookOpen, label: 'Artigo', color: 'bg-green-100 text-green-700' },
  link: { icon: Link2, label: 'Link', color: 'bg-purple-100 text-purple-700' },
};

export default function ConectaConteudos() {
  const { contents, isLoading: contentsLoading } = useConectaContents();
  const { data: courses, isLoading: coursesLoading } = useAcademyCourses({ status: 'published' });
  const { data: categories } = useAcademyCategories();
  const { data: access } = useAcademyAccess();
  const { accessLevel } = useConectaAccess();
  const isGuest = accessLevel === 'convidado';

  const [courseSearch, setCourseSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const materialTypes = useMemo(
    () => categories?.filter((c) => c.category_type === 'material_type') || [],
    [categories]
  );
  const subjects = useMemo(
    () => categories?.filter((c) => c.category_type === 'subject') || [],
    [categories]
  );

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      // Guests only see free courses
      if (isGuest && !c.is_free) return false;
      if (materialFilter && c.material_type_id !== materialFilter) return false;
      if (subjectFilter && c.subject_id !== subjectFilter) return false;
      if (courseSearch) {
        const s = courseSearch.toLowerCase();
        return (
          c.title.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.instructor_name?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [courses, materialFilter, subjectFilter, courseSearch, isGuest]);

  const canAccessAcademy = access === 'full' || access === 'subscriber';

  return (
    <ConectaLayout>
      <Helmet><title>Conteúdos | CONECTA+</title></Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">📚 Conteúdos</h1>

        <Tabs defaultValue="academy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="academy" className="gap-2">
              <GraduationCap className="h-4 w-4" />MeC Academy
            </TabsTrigger>
            <TabsTrigger value="conecta" className="gap-2">
              <BookOpen className="h-4 w-4" />CONECTA+
            </TabsTrigger>
          </TabsList>

          {/* Academy Tab - Course Catalog */}
          <TabsContent value="academy" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <CategoryFilter
                  categories={materialTypes}
                  selected={materialFilter}
                  onChange={setMaterialFilter}
                  label="Tipo"
                />
                <CategoryFilter
                  categories={subjects}
                  selected={subjectFilter}
                  onChange={setSubjectFilter}
                  label="Assunto"
                />
              </div>
            </div>

            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-video bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum curso encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const isLocked = !canAccessAcademy && !course.is_free && access !== 'free';
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      locked={isLocked}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Conecta Contents Tab */}
          <TabsContent value="conecta" className="space-y-4 mt-6">
            {contents.length === 0 && !contentsLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum conteúdo CONECTA+ disponível no momento.
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {contents.map((content: any) => {
                  const type = typeConfig[content.content_type] || typeConfig.link;
                  const Icon = type.icon;
                  return (
                    <Card key={content.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        {content.thumbnail_url && (
                          <img src={content.thumbnail_url} alt={content.title} className="w-full h-36 object-cover rounded-md" />
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={type.color}>
                            <Icon className="h-3 w-3 mr-1" />{type.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(content.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground leading-tight">{content.title}</h3>
                        {content.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{content.description}</p>
                        )}
                        {content.url && (
                          <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                            <a href={content.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" /> Acessar
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ConectaLayout>
  );
}
