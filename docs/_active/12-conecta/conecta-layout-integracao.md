# CONECTA+ - Integração com Layout do Portal

## Data: 2026-03-11

## Mudança
O CONECTA+ agora usa o `Layout` principal do portal (Header + Footer), mantendo a sidebar como navegação interna.

### Antes
- Layout isolado: `ConectaSidebar` + `ConectaHeader` próprio
- Sem Header/Footer do portal

### Depois
- `ConectaLayout` envolve o conteúdo com `<Layout>` (Header + Footer do portal)
- `ConectaSidebar` mantida como navegação lateral interna
- `ConectaHeader` removido do layout (Header do portal já cobre essa função)
- `SidebarProvider` usa `className="min-h-0 flex-1"` para não sobrepor o Footer
- Barra mobile com `SidebarTrigger` + badge de nível para navegação em dispositivos móveis

### Arquivo alterado
- `src/components/conecta/ConectaLayout.tsx`

## Responsividade CONECTA+
- Aniversariantes: grid `grid-cols-1 sm:grid-cols-2`
- Main content: `min-w-0` para evitar overflow
- Mobile: barra superior com `SidebarTrigger` visível apenas em `md:hidden`
