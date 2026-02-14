import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { useAcademyCourses, useAcademyCategories } from '@/hooks/useAcademy';
import { useAcademyAccess, useMyEnrollments } from '@/hooks/useAcademyEnrollment';
import { CourseCard } from '@/components/academy/CourseCard';
import { CategoryFilter } from '@/components/academy/CategoryFilter';
import { AccessGate } from '@/components/academy/AccessGate';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Search, BookOpen } from 'lucide-react';

const AcademyCatalogo = () => {
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const { data: courses, isLoading } = useAcademyCourses({ status: 'published' });
  const { data: categories } = useAcademyCategories();
  const { data: access } = useAcademyAccess();
  const { data: enrollments } = useMyEnrollments();

  const materialTypes = useMemo(
    () => categories?.filter((c) => c.category_type === 'material_type') || [],
    [categories]
  );
  const subjects = useMemo(
    () => categories?.filter((c) => c.category_type === 'subject') || [],
    [categories]
  );

  const filtered = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      if (materialFilter && c.material_type_id !== materialFilter) return false;
      if (subjectFilter && c.subject_id !== subjectFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.instructor_name?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [courses, materialFilter, subjectFilter, search]);

  const canAccess = access === 'full' || access === 'subscriber';

  return (
    <>
      <Helmet>
        <title>Catálogo - MeC Academy | Mulheres em Convergência</title>
        <meta name="description" content="Explore cursos, workshops e materiais do MeC Academy." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/academy/catalogo`} />
      </Helmet>

      <Layout>
        <AccessGate isFreeContent>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <BookOpen className="h-8 w-8 text-primary" />
                  Catálogo MeC Academy
                </h1>
                <p className="text-muted-foreground">
                  Explore todos os conteúdos disponíveis para seu crescimento.
                </p>
              </div>

              {/* Search & Filters */}
              <div className="space-y-4 mb-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos, aulas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-video bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Nenhum conteúdo encontrado com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((course) => {
                    const isLocked = !canAccess && !course.is_free && access !== 'free';
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
            </div>
          </div>
        </AccessGate>
      </Layout>
    </>
  );
};

export default AcademyCatalogo;
