import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, GraduationCap } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCursos } from '@/hooks/useAcademyNova';

export default function AcademyPage() {
  const { data: cursos, isLoading } = useCursos();

  return (
    <SiteLayout>
      <Helmet>
        <title>Academy | Mulheres em Convergência</title>
        <meta
          name="description"
          content="Cursos práticos de gestão, marketing e finanças para empreendedoras da rede Mulheres em Convergência."
        />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 max-w-2xl space-y-4 text-center">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Academy</h1>
          <p className="text-muted-foreground">
            Conteúdo prático para fazer seu negócio crescer, no seu ritmo.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : !cursos?.length ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Os cursos estão sendo preparados. Volte em breve.</p>
            <Button asChild variant="outline"><Link to="/planos">Conhecer os planos</Link></Button>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-3">
            {cursos.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                {c.capa_url ? (
                  <img src={c.capa_url} alt={c.titulo} className="w-full h-40 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {c.categoria?.nome && <Badge variant="outline">{c.categoria.nome}</Badge>}
                    {c.gratuito && <Badge variant="secondary">Gratuito</Badge>}
                  </div>
                  <h2 className="font-semibold">{c.titulo}</h2>
                  {c.resumo && <p className="text-sm text-muted-foreground line-clamp-3">{c.resumo}</p>}
                  {c.carga_horaria_min && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {Math.round(c.carga_horaria_min / 60)}h de conteúdo
                    </p>
                  )}
                  <Button asChild size="sm" className="mt-auto w-fit">
                    <Link to={`/academy/curso/${c.slug}`}>Ver curso</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}
