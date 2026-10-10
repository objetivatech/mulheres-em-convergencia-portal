import { ReactNode, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LogoComponent from '@/components/layout/LogoComponent';
import { useAuth } from '@/hooks/useAuth';
import MenuUsuaria, { useItensDaUsuaria } from '@/components/site/MenuUsuaria';
import TextoSite from '@/components/site/TextoSite';
import { useTexto } from '@/hooks/useTextosSite';
import { useMenuSite, montarArvore } from '@/hooks/useMenuSite';
import { MenuDesktop, MenuMobile, LinkMenu } from '@/components/site/MenuDinamico';

// Nomes editáveis no painel (Textos do site > Menu do site).
const NAV = [
  { to: '/', rotulo: 'Início', chave: 'menu.inicio' },
  { to: '/diretorio', rotulo: 'Diretório', chave: 'menu.diretorio' },
  { to: '/convergindo', rotulo: 'Convergindo', chave: 'menu.convergindo' },
  { to: '/academy', rotulo: 'Academy', chave: 'menu.academy' },
  { to: '/eventos', rotulo: 'Eventos', chave: 'menu.eventos' },
  { to: '/sobre', rotulo: 'Sobre', chave: 'menu.sobre' },
];

function RotuloMenu({ chave, padrao }: { chave: string; padrao: string }) {
  return <>{useTexto(chave, padrao)}</>;
}

const INSTITUCIONAIS = [
  { to: '/sobre', rotulo: 'Sobre' },
  { to: '/contato', rotulo: 'Contato' },
  { to: '/termos-de-uso', rotulo: 'Termos de uso' },
  { to: '/politica-de-privacidade', rotulo: 'Política de privacidade' },
  { to: '/politica-de-cookies', rotulo: 'Política de cookies' },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { user, loading, signOut } = useAuth();
  const itensUsuaria = useItensDaUsuaria();
  const { data: dadosPrincipal } = useMenuSite('principal');
  const { data: dadosInst } = useMenuSite('institucional');
  const menuPrincipal = dadosPrincipal?.length ? montarArvore(dadosPrincipal) : null;
  const menuInst = dadosInst?.length ? montarArvore(dadosInst) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
          <Link to="/" aria-label="Mulheres em Convergência — início" className="shrink-0">
            <LogoComponent variant="horizontal" size="md" />
          </Link>

          {menuPrincipal ? <MenuDesktop itens={menuPrincipal} /> : (
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
                <RotuloMenu chave={item.chave} padrao={item.rotulo} />
              </NavLink>
            ))}
          </nav>
          )}

          <div className="hidden lg:flex items-center gap-2">
            {loading ? null : user ? (
              <MenuUsuaria />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/entrar"><TextoSite chave="topo.botao_entrar" padrao="Entrar" /></Link></Button>
                <Button asChild size="sm" className="bg-grad-marca sombra-marca font-semibold hover:opacity-90"><Link to="/planos"><TextoSite chave="topo.botao_associar" padrao="Fazer parte" /></Link></Button>
              </>
            )}
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
              {menuPrincipal ? <MenuMobile itens={menuPrincipal} onNavegar={() => setAberto(false)} /> : NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setAberto(false)}
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RotuloMenu chave={item.chave} padrao={item.rotulo} />
                </Link>
              ))}
              {user ? (
                <div className="pt-3 border-t border-border mt-2 flex flex-col">
                  {itensUsuaria.map((item) => (
                    <Link
                      key={item.para}
                      to={item.liberado ? item.para : item.alternativa?.para ?? '/planos'}
                      onClick={() => setAberto(false)}
                      className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {item.liberado ? item.rotulo : item.alternativa?.rotulo ?? item.rotulo}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={async () => { setAberto(false); await signOut(); }}
                    className="py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-3">
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/entrar"><TextoSite chave="topo.botao_entrar" padrao="Entrar" /></Link></Button>
                  <Button asChild size="sm" className="flex-1 bg-grad-marca"><Link to="/planos"><TextoSite chave="topo.botao_associar" padrao="Fazer parte" /></Link></Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-lg font-bold texto-grad-marca">Mulheres em Convergência</p>
            <TextoSite
              as="p"
              multilinha
              chave="rodape.sobre"
              padrao="Rede de mulheres empreendedoras: conexão, formação e visibilidade para o seu negócio."
              className="text-sm text-background/70 max-w-xs"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">Navegar</p>
            <ul className="space-y-2">
              {menuPrincipal ? menuPrincipal.map((i) => (
                <li key={i.id}><LinkMenu item={i} className="text-sm text-background/70 hover:text-background" /></li>
              )) : NAV.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="text-sm text-background/70 hover:text-background"><RotuloMenu chave={i.chave} padrao={i.rotulo} /></Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">Institucional</p>
            <ul className="space-y-2">
              {menuInst ? menuInst.map((i) => (
                <li key={i.id}><LinkMenu item={i} className="text-sm text-background/70 hover:text-background" /></li>
              )) : INSTITUCIONAIS.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="text-sm text-background/70 hover:text-background">{i.rotulo}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10">
          <p className="container mx-auto px-4 py-4 text-xs text-background/60">
            © {new Date().getFullYear()} Mulheres em Convergência. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default SiteLayout;
