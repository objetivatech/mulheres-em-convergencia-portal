import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCurso, useMinhaMatricula, useMatricular, useMarcarAula } from '@/hooks/useAcademyNova';

export default function AcademyCursoPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: curso, isLoading } = useCurso(slug);
  const { data: situacao } = useMinhaMatricula(curso?.id);
  const matricular = useMatricular();
  const marcar = useMarcarAula();

  const liberado = !!situacao?.matricula && (situacao.temAcesso || curso?.gratuito);

  const entrar = async () => {
    if (!user) return;
    try {
      await matricular.mutateAsync(curso.id);
      toast({ title: 'Tudo certo', description: 'Você entrou no curso.' });
    } catch (e: any) {
      toast({
        title: 'Não foi possível entrar',
        description: 'Este curso é para associadas com plano ativo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-14 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </SiteLayout>
    );
  }

  if (!curso) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Curso não encontrado</h1>
          <Button asChild variant="outline"><Link to="/academy">Ver catálogo</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${curso.titulo} | Academy`}</title>
        <meta name="description" content={curso.resumo ?? `Curso ${curso.titulo} na Academy Mulheres em Convergência.`} />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{curso.nivel}</Badge>
            {curso.gratuito && <Badge variant="secondary">Gratuito</Badge>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{curso.titulo}</h1>
          {curso.resumo && <p className="text-muted-foreground">{curso.resumo}</p>}

          {!user ? (
            <Button asChild><Link to="/entrar">Entrar para acessar</Link></Button>
          ) : !situacao?.matricula ? (
            <Button onClick={entrar} disabled={matricular.isPending}>
              {matricular.isPending ? 'Entrando…' : 'Começar curso'}
            </Button>
          ) : !liberado ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Este curso faz parte da Academy para associadas.</p>
              <Button asChild><Link to="/planos">Ver planos</Link></Button>
            </div>
          ) : (
            <Badge variant="secondary">Você está matriculada</Badge>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        {curso.descricao && (
          <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: curso.descricao }} />
        )}

        <div>
          <h2 className="font-semibold mb-3">Aulas</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {(curso.aulas ?? []).map((a: any) => {
              const podeVer = liberado || a.gratuita;
              const concluida = situacao?.concluidas?.has(a.id);
              return (
                <li key={a.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {podeVer ? (
                        <button
                          aria-label={concluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
                          onClick={() => marcar.mutate({ aulaId: a.id, concluida: !concluida })}
                          className="mt-0.5"
                        >
                          {concluida ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{a.titulo}</p>
                        {a.descricao && <p className="text-xs text-muted-foreground">{a.descricao}</p>}
                      </div>
                    </div>
                    {a.duracao_min && <span className="text-xs text-muted-foreground">{a.duracao_min} min</span>}
                  </div>

                  {podeVer && a.video_url && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={a.video_url}
                        title={a.titulo}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {podeVer && a.material_url && (
                    <a href={a.material_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-4">
                      Material da aula
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
