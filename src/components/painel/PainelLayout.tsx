import { ReactNode } from 'react';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { Store, Newspaper, FileText, LayoutTemplate, Home, Tags, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSouEditora } from '@/hooks/usePainelConteudo';
import { cn } from '@/lib/utils';

const ITENS = [
  { para: '/painel-conteudo', rotulo: 'Visão geral', icone: Home, fim: true },
  { para: '/painel-conteudo/negocios', rotulo: 'Negócios', icone: Store },
  { para: '/painel-conteudo/blog', rotulo: 'Blog', icone: Newspaper },
  { para: '/painel-conteudo/categorias', rotulo: 'Categorias e autoras', icone: Tags },
  { para: '/painel-conteudo/paginas', rotulo: 'Páginas', icone: FileText },
  { para: '/painel-conteudo/home', rotulo: 'Página inicial', icone: LayoutTemplate },
  { para: '/painel-conteudo/comunicados', rotulo: 'Comunicados', icone: Megaphone },
];

export default function PainelLayout({
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
  const { user, loading } = useAuth();
  const { data: permissao, isLoading } = useSouEditora();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/entrar" replace />;

  if (!permissao?.admin && !permissao?.editora) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Esta área é da equipe</h1>
          <p className="text-muted-foreground">
            Sua conta não tem permissão para editar o conteúdo do site. Fale com a administração se
            você deveria ter acesso.
          </p>
          <Link to="/" className="text-primary underline underline-offset-4">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-60 shrink-0">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Ver o site
          </Link>
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
