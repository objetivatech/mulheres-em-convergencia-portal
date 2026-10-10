import { ReactNode } from 'react';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { Home, CreditCard, CalendarDays, GraduationCap, Users, Sparkles, UserCog, Store, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMeuPerfil, useMeuNegocio } from '@/hooks/useMinhaArea';
import Tour from '@/components/tour/Tour';
import { cn } from '@/lib/utils';
import LogoComponent from '@/components/layout/LogoComponent';

const ITENS = [
  { para: '/minha-area', rotulo: 'Visão geral', icone: Home, fim: true },
  { para: '/minha-area/planos', rotulo: 'Meus planos', icone: CreditCard },
  { para: '/minha-area/encontros', rotulo: 'Meus encontros', icone: CalendarDays },
  { para: '/minha-area/academy', rotulo: 'Academy', icone: GraduationCap },
  { para: '/minha-area/conecta', rotulo: 'Conecta+', icone: Users },
  { para: '/minha-area/embaixadora', rotulo: 'Embaixadoras', icone: Sparkles },
  { para: '/minha-area/dados', rotulo: 'Meus dados', icone: UserCog },
  { para: '/minha-area/tutoriais', rotulo: 'Tutoriais', icone: BookOpen },
];

export default function AreaLayout({
  titulo,
  descricao,
  acoes,
  tour,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  /** módulo do tour guiado desta tela */
  tour?: string;
  children: ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const { data: perfil } = useMeuPerfil();
  const { data: negocio } = useMeuNegocio();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1.5 bg-grad-hero" aria-hidden />
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0 lg:sticky lg:top-6 lg:self-start">
          <Link to="/" className="flex items-center justify-between gap-2">
            <LogoComponent variant="horizontal" size="sm" />
            <span className="text-xs text-muted-foreground hover:text-foreground">Ver o site →</span>
          </Link>

          <div className="mt-5 rounded-[var(--radius)] bg-grad-hero p-4 text-primary-foreground sombra-marca">
            <p className="text-base font-bold truncate">{perfil?.nome_social || perfil?.nome || 'Minha conta'}</p>
            <p className="text-xs opacity-85 truncate">{perfil?.email_principal || user.email}</p>
          </div>

          <nav className="mt-4 space-y-1 rounded-[var(--radius)] border border-border bg-card p-2">
            {ITENS.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end={item.fim}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-grad-marca text-primary-foreground font-semibold sombra-marca'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icone className="w-4 h-4" />
                {item.rotulo}
              </NavLink>
            ))}

            {(negocio || perfil?.acesso_diretorio) && (
              <NavLink
                to="/minha-area/negocio"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-grad-marca text-primary-foreground font-semibold sombra-marca'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Store className="w-4 h-4" />
                Meu negócio
              </NavLink>
            )}

            {isAdmin && (
              <Link
                to="/painel-conteudo"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-muted"
              >
                <UserCog className="w-4 h-4" />
                Painel da equipe
              </Link>
            )}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-3xl font-extrabold">{titulo}</h1>
              {descricao && <p className="text-muted-foreground mt-1">{descricao}</p>}
            </div>
            {acoes}
          </header>
          {children}
          {tour && <Tour modulo={tour} />}
        </main>
      </div>
    </div>
  );
}
