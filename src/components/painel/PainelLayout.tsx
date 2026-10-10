import { ReactNode, useState } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  Store, Newspaper, FileText, LayoutTemplate, Home, Tags, Megaphone, Ticket,
  Users, Wallet, Workflow, Zap, GraduationCap, Network, Heart, Image as ImageIcon, Type, BookOpen,
  ChevronDown, Menu as MenuIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSouEditora } from '@/hooks/usePainelConteudo';
import Tour from '@/components/tour/Tour';
import { cn } from '@/lib/utils';
import LogoComponent from '@/components/layout/LogoComponent';

type Item = { para: string; rotulo: string; icone: any; fim?: boolean };
const GRUPOS: { titulo: string; itens: Item[] }[] = [
  { titulo: 'Site', itens: [
    { para: '/painel-conteudo/home', rotulo: 'Página inicial', icone: LayoutTemplate },
    { para: '/painel-conteudo/menus', rotulo: 'Menus do site', icone: MenuIcon },
    { para: '/painel-conteudo/textos', rotulo: 'Editor de páginas', icone: Type },
    { para: '/painel-conteudo/paginas', rotulo: 'Páginas', icone: FileText },
    { para: '/painel-conteudo/institucional', rotulo: 'Parceiros e linha do tempo', icone: ImageIcon },
    { para: '/painel-conteudo/imagens', rotulo: 'Imagens', icone: ImageIcon },
  ] },
  { titulo: 'Conteúdo', itens: [
    { para: '/painel-conteudo/blog', rotulo: 'Blog', icone: Newspaper },
    { para: '/painel-conteudo/categorias', rotulo: 'Categorias e autoras', icone: Tags },
    { para: '/painel-conteudo/academy', rotulo: 'Academy', icone: GraduationCap },
  ] },
  { titulo: 'Comunidade', itens: [
    { para: '/painel-conteudo/pessoas', rotulo: 'Pessoas', icone: Users },
    { para: '/painel-conteudo/negocios', rotulo: 'Negócios', icone: Store },
    { para: '/painel-conteudo/conecta', rotulo: 'Conecta+', icone: Network },
    { para: '/painel-conteudo/embaixadoras', rotulo: 'Embaixadoras', icone: Heart },
  ] },
  { titulo: 'Vendas', itens: [
    { para: '/painel-conteudo/planos-eventos', rotulo: 'Planos, encontros e acessos', icone: Ticket },
    { para: '/painel-conteudo/financeiro', rotulo: 'Financeiro', icone: Wallet },
    { para: '/painel-conteudo/automacoes', rotulo: 'Automações', icone: Zap },
  ] },
  { titulo: 'Comunicação', itens: [
    { para: '/painel-conteudo/relacionamento', rotulo: 'Relacionamento', icone: Workflow },
    { para: '/painel-conteudo/comunicados', rotulo: 'Comunicados', icone: Megaphone },
    { para: '/painel-conteudo/newsletter', rotulo: 'Newsletter', icone: Megaphone },
  ] },
];

const classeLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors',
    isActive ? 'bg-grad-marca text-primary-foreground font-semibold sombra-marca' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

function Grupo({ titulo, itens }: { titulo: string; itens: Item[] }) {
  const { pathname } = useLocation();
  const contemAtual = itens.some((i) => pathname.startsWith(i.para));
  const [aberto, setAberto] = useState(contemAtual);
  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        aria-expanded={aberto}
      >
        {titulo}
        <ChevronDown className={cn('w-4 h-4 transition-transform', aberto && 'rotate-180')} />
      </button>
      {aberto && (
        <div className="space-y-1 pl-1">
          {itens.map((item) => (
            <NavLink key={item.para} to={item.para} className={classeLink}>
              <item.icone className="w-4 h-4" />
              {item.rotulo}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}



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
    <div className="min-h-screen bg-background">
      <div className="h-1.5 bg-grad-hero" aria-hidden />
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0 lg:sticky lg:top-6 lg:self-start">
          <Link to="/" className="flex items-center justify-between gap-2">
            <LogoComponent variant="horizontal" size="sm" />
            <span className="text-xs text-muted-foreground hover:text-foreground">Ver o site →</span>
          </Link>
          <nav className="mt-4 space-y-1 rounded-[var(--radius)] border border-border bg-card p-2" data-tour="painel-menu">
            <NavLink to="/painel-conteudo" end className={classeLink}>
              <Home className="w-4 h-4" /> Visão geral
            </NavLink>
            {GRUPOS.map((g) => <Grupo key={g.titulo} titulo={g.titulo} itens={g.itens} />)}
            <NavLink to="/painel-conteudo/tutoriais" className={classeLink}>
              <BookOpen className="w-4 h-4" /> Tutoriais
            </NavLink>
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
          <Tour modulo="painel-equipe" />
        </main>
      </div>
    </div>
  );
}
