import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemMenu } from '@/hooks/useMenuSite';

const externo = (url: string) => /^https?:\/\//.test(url);

export function LinkMenu({ item, className, onClick, children }: { item: ItemMenu; className?: string; onClick?: () => void; children?: React.ReactNode }) {
  const conteudo = children ?? item.rotulo;
  if (externo(item.url) || item.nova_aba) {
    return <a href={item.url} className={className} onClick={onClick} target={item.nova_aba ? '_blank' : undefined} rel="noopener noreferrer">{conteudo}</a>;
  }
  if (item.url === '#') return <span className={className}>{conteudo}</span>;
  return <Link to={item.url} className={className} onClick={onClick}>{conteudo}</Link>;
}

/** Desktop: dropdown ao passar o mouse / focar, com sub-submenu à direita. */
export function MenuDesktop({ itens }: { itens: ItemMenu[] }) {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {itens.map((item) =>
        item.filhos?.length ? (
          <div key={item.id} className="relative group">
            <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
              {item.rotulo} <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute left-0 top-full z-50 hidden min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-md group-hover:block group-focus-within:block">
              {item.url !== '#' && <LinkMenu item={item} className="block rounded px-3 py-2 text-sm hover:bg-muted">Ver {item.rotulo}</LinkMenu>}
              {item.filhos.map((f) =>
                f.filhos?.length ? (
                  <div key={f.id} className="relative group/sub">
                    <LinkMenu item={f} className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-muted">
                      {f.rotulo} <ChevronRight className="w-3 h-3" />
                    </LinkMenu>
                    <div className="absolute left-full top-0 hidden min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-md group-hover/sub:block group-focus-within/sub:block">
                      {f.filhos.map((n) => <LinkMenu key={n.id} item={n} className="block rounded px-3 py-2 text-sm hover:bg-muted" />)}
                    </div>
                  </div>
                ) : (
                  <LinkMenu key={f.id} item={f} className="block rounded px-3 py-2 text-sm hover:bg-muted" />
                )
              )}
            </div>
          </div>
        ) : externo(item.url) || item.nova_aba ? (
          <LinkMenu key={item.id} item={item} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground" />
        ) : (
          <NavLink
            key={item.id}
            to={item.url}
            end={item.url === '/'}
            className={({ isActive }) => cn('px-3 py-2 rounded-md text-sm transition-colors', isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground')}
          >
            {item.rotulo}
          </NavLink>
        )
      )}
    </nav>
  );
}

/** Celular: sanfona. */
export function MenuMobile({ itens, nivel = 0, onNavegar }: { itens: ItemMenu[]; nivel?: number; onNavegar: () => void }) {
  return (
    <>
      {itens.map((item) => <ItemMobile key={item.id} item={item} nivel={nivel} onNavegar={onNavegar} />)}
    </>
  );
}

function ItemMobile({ item, nivel, onNavegar }: { item: ItemMenu; nivel: number; onNavegar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const pad = { paddingLeft: nivel * 16 };
  if (!item.filhos?.length) {
    return <LinkMenu item={item} onClick={onNavegar} className="block py-2 text-sm text-muted-foreground hover:text-foreground"><span style={pad}>{item.rotulo}</span></LinkMenu>;
  }
  return (
    <div>
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex w-full items-center justify-between py-2 text-sm text-muted-foreground" style={pad}>
        {item.rotulo} <ChevronDown className={cn('w-4 h-4 transition-transform', aberto && 'rotate-180')} />
      </button>
      {aberto && (
        <div>
          {item.url !== '#' && <LinkMenu item={item} onClick={onNavegar} className="block py-2 text-sm text-muted-foreground"><span style={{ paddingLeft: (nivel + 1) * 16 }}>Ver {item.rotulo}</span></LinkMenu>}
          <MenuMobile itens={item.filhos} nivel={nivel + 1} onNavegar={onNavegar} />
        </div>
      )}
    </div>
  );
}
