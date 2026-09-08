import { ReactNode, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', rotulo: 'Início' },
  { to: '/diretorio', rotulo: 'Diretório' },
  { to: '/convergindo', rotulo: 'Convergindo' },
  { to: '/academy', rotulo: 'Academy' },
  { to: '/eventos', rotulo: 'Eventos' },
  { to: '/sobre', rotulo: 'Sobre' },
];

const INSTITUCIONAIS = [
  { to: '/sobre', rotulo: 'Sobre' },
  { to: '/contato', rotulo: 'Contato' },
  { to: '/termos-de-uso', rotulo: 'Termos de uso' },
  { to: '/politica-de-privacidade', rotulo: 'Política de privacidade' },
  { to: '/politica-de-cookies', rotulo: 'Política de cookies' },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Mulheres em Convergência — início" className="shrink-0">
            <LogoComponent variant="horizontal" size="md" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm transition-colors',
                    isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {item.rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/entrar">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/planos">Fazer parte</Link></Button>
          </div>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {aberto && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setAberto(false)}
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.rotulo}
                </Link>
              ))}
              <div className="flex gap-2 pt-3">
                <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/entrar">Entrar</Link></Button>
                <Button asChild size="sm" className="flex-1"><Link to="/planos">Fazer parte</Link></Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <p className="font-semibold">Mulheres em Convergência</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Rede de mulheres empreendedoras: conexão, formação e visibilidade para o seu negócio.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Navegar</p>
            <ul className="space-y-2">
              {NAV.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="text-sm text-muted-foreground hover:text-primary">{i.rotulo}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Institucional</p>
            <ul className="space-y-2">
              {INSTITUCIONAIS.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="text-sm text-muted-foreground hover:text-primary">{i.rotulo}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mulheres em Convergência. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default SiteLayout;
