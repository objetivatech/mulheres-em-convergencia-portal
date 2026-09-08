import { ReactNode } from 'react';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { Home, CreditCard, CalendarDays, GraduationCap, Users, Sparkles, UserCog, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMeuPerfil, useMeuNegocio } from '@/hooks/useMinhaArea';
import { cn } from '@/lib/utils';

const ITENS = [
  { para: '/minha-area', rotulo: 'Visão geral', icone: Home, fim: true },
  { para: '/minha-area/planos', rotulo: 'Meus planos', icone: CreditCard },
  { para: '/minha-area/encontros', rotulo: 'Meus encontros', icone: CalendarDays },
  { para: '/minha-area/academy', rotulo: 'Academy', icone: GraduationCap },
  { para: '/minha-area/conecta', rotulo: 'Conecta+', icone: Users },
  { para: '/minha-area/embaixadora', rotulo: 'Embaixadoras', icone: Sparkles },
  { para: '/minha-area/dados', rotulo: 'Meus dados', icone: UserCog },
];

export default function AreaLayout({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
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
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-60 shrink-0">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Ver o site
          </Link>

          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium truncate">{perfil?.nome_social || perfil?.nome || 'Minha conta'}</p>
            <p className="text-xs text-muted-foreground truncate">{perfil?.email_principal || user.email}</p>
          </div>

          <nav className="mt-4 space-y-1">
            {ITENS.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end={item.fim}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icone className="w-4 h-4" />
                {item.rotulo}
              </NavLink>
            ))}

            {negocio && (
              <Link
                to={`/painel-conteudo/negocios/${negocio.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Store className="w-4 h-4" />
                Meu negócio
              </Link>
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
          <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
              {descricao && <p className="text-muted-foreground mt-1">{descricao}</p>}
            </div>
            {acoes}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
