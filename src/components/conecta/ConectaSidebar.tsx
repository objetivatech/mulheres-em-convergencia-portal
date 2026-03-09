import { 
  LayoutDashboard, Users, Calendar, Handshake, MessageSquareHeart,
  TrendingUp, Trophy, BarChart3, Share2, BookOpen, Send, UserCircle,
  Settings, Lightbulb, Network
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { cn } from '@/lib/utils';

const memberItems = [
  { title: 'Dashboard', url: '/conecta', icon: LayoutDashboard },
  { title: 'Meu Perfil', url: '/conecta/perfil', icon: UserCircle },
  { title: 'Membros', url: '/conecta/membros', icon: Users },
  { title: 'Grupos', url: '/conecta/grupos', icon: Network },
];

const activityItems = [
  { title: 'Encontros', url: '/conecta/encontros', icon: Calendar },
  { title: 'Reuniões 1-a-1', url: '/conecta/reunioes', icon: Handshake },
  { title: 'Depoimentos', url: '/conecta/depoimentos', icon: MessageSquareHeart },
  { title: 'Negócios', url: '/conecta/negocios', icon: TrendingUp },
  { title: 'Indicações', url: '/conecta/indicacoes', icon: Share2 },
  { title: 'Conselho 24/7', url: '/conecta/helpdesk', icon: Lightbulb },
];

const communityItems = [
  { title: 'Ranking', url: '/conecta/ranking', icon: Trophy },
  { title: 'Estatísticas', url: '/conecta/estatisticas', icon: BarChart3 },
  { title: 'Convites', url: '/conecta/convites', icon: Send },
  { title: 'Conteúdos', url: '/conecta/conteudos', icon: BookOpen },
];

const adminItems = [
  { title: 'Admin CONECTA+', url: '/admin/conecta', icon: Settings },
];

export function ConectaSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { accessLevel, isMemberOrAbove } = useConectaAccess();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo area */}
        <div className={cn("p-4 border-b border-border", collapsed && "p-2")}>
          {collapsed ? (
            <span className="text-lg font-bold text-primary">C+</span>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-primary">CONECTA+</h2>
              <p className="text-xs text-muted-foreground">Rede de Networking</p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/conecta'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Activities - members only */}
        {isMemberOrAbove && (
          <SidebarGroup>
            <SidebarGroupLabel>Atividades</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {activityItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Community */}
        <SidebarGroup>
          <SidebarGroupLabel>Comunidade</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {accessLevel === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
