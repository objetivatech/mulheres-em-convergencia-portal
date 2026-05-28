# Changelog — 2026-05-27

## Correções

### Gestão de Roles (Admin)
- **Corrigido**: erro ao tentar remover role `community_member` de usuário com roles dependentes
- Botão de remoção de `community_member` agora fica desabilitado na UI quando o usuário possui outras roles
- `business_owner` agora exibe label "(CONECTA+ Membro)" para identificação clara
- Mensagens de erro do trigger `validate_role_consistency` são exibidas de forma amigável no toast

## Remoções

### Page Builder PUCK
- Removido o Page Builder baseado em PUCK (`@measured/puck`) do painel admin
- Removidas rotas: `/admin/paginas`, `/admin/construtor-paginas/novo`, `/admin/construtor-paginas/:id`
- Removidos componentes: `PageBuilder.tsx`, `PagesManagement.tsx`, `PageBuilderLink.tsx`
- `PageRenderer.tsx` e blocks **preservados** pois são usados por Sobre/Planos/Contato (migração lazy)

## Novas Funcionalidades

### Editor de Páginas TipTap
- Novo editor rico baseado em TipTap substituindo o PUCK removido
- Suporte a: headings, bold/italic, listas, links, imagens (upload R2), tabelas, blockquotes, vídeos YouTube/Vimeo, blocos Callout e CTA
- Migração automática de conteúdo PUCK → TipTap JSON no primeiro save
- Renderização segura via `TipTapRenderer` (sem `dangerouslySetInnerHTML`)
- Admin: listagem em `/admin/paginas`, editor em `/admin/paginas/:id`
- Rota pública `/pagina/:slug` restaurada
- Páginas com toggle público/interno e campos de SEO
