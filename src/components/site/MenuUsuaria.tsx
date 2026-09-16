/**
 * Menu da usuária logada no cabeçalho do site.
 * Mostra apenas os atalhos que a pessoa realmente tem direito de abrir:
 * papéis vêm de `papeis` e liberações de `concessoes_acesso` (via v_meu_perfil).
 */
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, CreditCard, GraduationCap, LayoutDashboard, LogOut, Settings,
  Sparkles, Store, UserCog, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useMeuPerfil, useMeuNegocio } from '@/hooks/useMinhaArea';

function iniciais(nome?: string | null, email?: string | null) {
  const base = (nome || email || '?').trim();
  const partes = base.split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export type ItemMenu = {
  para: string;
  rotulo: string;
  icone: typeof Users;
  liberado: boolean;
  alternativa?: { para: string; rotulo: string };
};

/** Lista de atalhos conforme papéis e liberações vigentes. */
export function useItensDaUsuaria(): ItemMenu[] {
  const { isAdmin, isAmbassador } = useAuth();
  const { data: perfil } = useMeuPerfil();
  const { data: negocio } = useMeuNegocio();

  const itens: ItemMenu[] = [
    { para: '/minha-area', rotulo: 'Minha área', icone: LayoutDashboard, liberado: true },
    { para: '/minha-area/planos', rotulo: 'Meus planos', icone: CreditCard, liberado: true },
    { para: '/minha-area/encontros', rotulo: 'Meus encontros', icone: CalendarDays, liberado: true },
    {
      para: '/minha-area/academy',
      rotulo: 'Academy',
      icone: GraduationCap,
      liberado: !!perfil?.acesso_academy,
      alternativa: { para: '/academy', rotulo: 'Conhecer a Academy' },
    },
    {
      para: '/minha-area/conecta',
      rotulo: 'Conecta+',
      icone: Users,
      liberado: !!perfil?.acesso_conecta,
      alternativa: { para: '/planos', rotulo: 'Conhecer o Conecta+' },
    },
  ];

  if (isAmbassador || perfil?.acesso_embaixadora) {
    itens.push({ para: '/minha-area/embaixadora', rotulo: 'Embaixadoras', icone: Sparkles, liberado: true });
  }

  if (negocio) {
    itens.push({
      para: `/painel-conteudo/negocios/${(negocio as any).id}`,
      rotulo: 'Meu negócio',
      icone: Store,
      liberado: true,
    });
  }

  itens.push({ para: '/minha-area/dados', rotulo: 'Meus dados', icone: UserCog, liberado: true });

  if (isAdmin) {
    itens.push({ para: '/painel-conteudo', rotulo: 'Painel da equipe', icone: Settings, liberado: true });
  }

  return itens;
}

export default function MenuUsuaria() {
  const { user, signOut } = useAuth();
  const { data: perfil } = useMeuPerfil();
  const itens = useItensDaUsuaria();
  const navegar = useNavigate();

  if (!user) return null;

  const nome = perfil?.nome_social || perfil?.nome || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 pl-1 pr-2">
          <Avatar className="h-7 w-7">
            {perfil?.foto_url && <AvatarImage src={perfil.foto_url} alt="" />}
            <AvatarFallback className="text-xs">{iniciais(nome, user.email)}</AvatarFallback>
          </Avatar>
          <span className="max-w-[10rem] truncate text-sm">{nome}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 bg-popover">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {perfil?.email_principal || user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {itens.map((item) =>
          item.liberado ? (
            <DropdownMenuItem key={item.para} asChild>
              <Link to={item.para} className="flex items-center gap-2">
                <item.icone className="h-4 w-4" />
                {item.rotulo}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.para} asChild>
              <Link to={item.alternativa?.para ?? '/planos'} className="flex items-center gap-2 text-muted-foreground">
                <item.icone className="h-4 w-4" />
                {item.alternativa?.rotulo ?? item.rotulo}
              </Link>
            </DropdownMenuItem>
          )
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navegar('/');
          }}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
