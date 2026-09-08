import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, CreditCard, GraduationCap, Store } from 'lucide-react';
import AreaLayout from '@/components/area/AreaLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeuPerfil, useMeusAcessos, useMinhasInscricoesArea, useMeuNegocio } from '@/hooks/useMinhaArea';
import { dinheiro } from '@/hooks/usePlanosEventos';

const ROTULO_ACESSO: Record<string, string> = {
  diretorio: 'Diretório',
  conecta: 'Conecta+',
  academy: 'Academy',
  evento: 'Encontros',
  area_embaixadora: 'Embaixadoras',
};

const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function MinhaAreaHome() {
  const { data: perfil, isLoading } = useMeuPerfil();
  const { data: acessos } = useMeusAcessos();
  const { data: inscricoes } = useMinhasInscricoesArea();
  const { data: negocio } = useMeuNegocio();

  const vigentes = (acessos ?? []).filter(
    (a) => !a.fim_em || new Date(a.fim_em).getTime() > Date.now()
  );
  const proximos = (inscricoes ?? []).filter(
    (i) => i.evento?.inicio_em && new Date(i.evento.inicio_em).getTime() > Date.now()
  );

  return (
    <AreaLayout
      titulo={`Olá, ${perfil?.nome_social || perfil?.nome?.split(' ')[0] || 'boas-vindas'}`}
      descricao="Aqui ficam seus planos, encontros e dados."
    >
      <Helmet>
        <title>Minha área | Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Seus acessos</h2>
            {vigentes.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem um plano ativo. Escolha um plano para entrar no diretório e na comunidade.
                </p>
                <Button asChild size="sm"><Link to="/planos">Ver planos</Link></Button>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {vigentes.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{ROTULO_ACESSO[a.tipo] ?? a.tipo}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.fim_em ? `Vence em ${data(a.fim_em)}` : 'Sem prazo de término'}
                      </p>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/minha-area/planos" className="rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
              <CreditCard className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium">Meus planos</p>
              <p className="text-sm text-muted-foreground">Pagamentos e renovações</p>
            </Link>
            <Link to="/minha-area/encontros" className="rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
              <CalendarDays className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium">Meus encontros</p>
              <p className="text-sm text-muted-foreground">
                {proximos.length ? `${proximos.length} confirmado(s) à frente` : 'Nenhum encontro marcado'}
              </p>
            </Link>
            <Link to="/minha-area/academy" className="rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
              <GraduationCap className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium">Academy</p>
              <p className="text-sm text-muted-foreground">Seus cursos e progresso</p>
            </Link>
          </div>

          {proximos.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-3">Próximos encontros</h2>
              <ul className="space-y-3">
                {proximos.slice(0, 3).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{i.evento?.titulo}</p>
                      <p className="text-xs text-muted-foreground">{data(i.evento?.inicio_em)}</p>
                    </div>
                    <Badge variant={i.situacao === 'confirmada' ? 'secondary' : 'outline'}>
                      {i.situacao === 'confirmada' ? 'Confirmada' : 'Pagamento pendente'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {negocio && (
            <section className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{negocio.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {negocio.publicado ? 'Publicado no diretório' : 'Ainda não publicado'}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/painel-conteudo/negocios/${negocio.id}`}>Editar ficha</Link>
              </Button>
            </section>
          )}

          {perfil && perfil.completude_percentual < 100 && (
            <section className="rounded-xl border border-dashed border-border p-5">
              <p className="text-sm">
                Seu cadastro está {perfil.completude_percentual}% completo.{' '}
                <Link to="/minha-area/dados" className="text-primary underline underline-offset-4">
                  Completar agora
                </Link>
              </p>
            </section>
          )}
        </div>
      )}
    </AreaLayout>
  );
}

