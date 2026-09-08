import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasMatriculas, useMeuPerfil } from '@/hooks/useMinhaArea';

export default function MinhaAcademy() {
  const { data: matriculas, isLoading } = useMinhasMatriculas();
  const { data: perfil } = useMeuPerfil();

  return (
    <AreaLayout titulo="Academy" descricao="Seus cursos e o que já foi concluído.">
      <Helmet>
        <title>Academy | Minha área</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {!perfil?.acesso_academy && (
        <div className="mb-6 rounded-xl border border-dashed border-border p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem acesso completo à Academy. Cursos gratuitos continuam liberados.
          </p>
          <Button asChild size="sm"><Link to="/planos">Ver planos</Link></Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !matriculas?.length ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Você ainda não começou nenhum curso.</p>
          <Button asChild size="sm"><Link to="/academy">Ver catálogo</Link></Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {matriculas.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {m.curso?.capa_url && (
                <img src={m.curso.capa_url} alt={m.curso?.titulo ?? 'Curso'} className="w-full h-32 object-cover" loading="lazy" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{m.curso?.titulo}</p>
                  {m.concluido_em && <Badge variant="secondary">Concluído</Badge>}
                </div>
                {m.curso?.resumo && <p className="text-sm text-muted-foreground line-clamp-2">{m.curso.resumo}</p>}
                <Button asChild size="sm" variant="outline">
                  <Link to={`/academy/curso/${m.curso?.slug}`}>Continuar</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AreaLayout>
  );
}
