
# Plano: CONECTA+ - Ambiente de Networking Integrado ao Portal MeC

## Status de Implementação

### ✅ Etapa 1: Banco de Dados (CONCLUÍDA)
- 15 tabelas criadas com prefixo `conecta_`
- Enums: `conecta_role`, `conecta_rank`
- RLS policies para todas as tabelas
- Funções RPC: pontuação, ranking, convites, feed
- Triggers automáticos para feed + pontos
- Índices de performance

### ✅ Etapa 2: Layout e Navegação (CONCLUÍDA)
- `ConectaLayout` com sidebar + header
- `ConectaSidebar` com menu por nível de acesso
- `ConectaHeader` com badge de nível
- `useConectaAccess` hook para controle de acesso
- Rotas `/conecta/*` registradas no App.tsx
- Link "CONECTA+" no menu do usuário (Header)
- Dashboard básico com cards e ações rápidas
- Páginas placeholder para todos os módulos

### ✅ Etapa 3: Dashboard + Perfil + Membros (CONCLUÍDA)
- Dashboard completo com stats reais, feed de atividades em tempo real, próximos encontros, sistema de pontuação com ranks
- Perfil CONECTA+ com edição de empresa, cargo, bio, redes sociais, banner, aniversário
- Diretório de membros com busca, filtros por grupo/rank, modal de perfil completo
- Componentes: RankBadge, ConectaActivityFeed, ScoringRulesCard
- Hooks: useConectaStats, useConectaActivityFeed, useConectaMembers, useConectaProfile
### ✅ Etapa 4: Encontros + Reuniões 1-a-1 + Presenças (CONCLUÍDA)
- Encontros: lista com próximos/anteriores, confirmação de presença, criação (admin), lista de confirmadas
- Reuniões 1-a-1: registro com tipo membro/convidada, seleção de membro, upload de foto com compressão, notas
- Hooks: useConectaMeetings, useConectaOneOnOnes
- Componentes: ConectaMemberSelect, ConectaEncontros, ConectaReunioes
### ✅ Etapa 5: Depoimentos + Negócios + Indicações (CONCLUÍDA)
- Depoimentos: enviar/receber entre membros, listagem com abas
- Negócios: registro com valor, cliente, membro indicador
- Indicações: compartilhar leads com dados de contato
### ✅ Etapa 6: Ranking + Estatísticas + Pontuação (CONCLUÍDA)
- Ranking mensal com pódio Top 3, filtro por mês, destaque do usuário
- Estatísticas pessoais com gráficos de barra e pizza (recharts)
### ✅ Etapa 7: Convites + Conteúdos (CONCLUÍDA)
- Convites: criação com código único, listagem com status, copiar código
- Conteúdos: biblioteca com tipos (vídeo, documento, artigo, link), thumbnails
### ✅ Etapa 8: Painel Admin CONECTA+ (CONCLUÍDA)
- Dashboard admin com visão geral (membros, encontros, negócios, indicações, convites)
- Listagem de grupos com contagem de membros
- Feed de atividades recentes da comunidade
### ✅ Etapa 9: Documentação (CONCLUÍDA)
- conecta-overview.md: visão geral completa
- conecta-database.md: esquema detalhado do banco
- conecta-access-levels.md: níveis de acesso e permissões

---

# Plano: Integração de Roles, Newsletter Opt-in e Remodelação do Meu Painel

## Status de Implementação

### ✅ Etapa 1: Triggers de Atribuição Automática de Roles (CONCLUÍDA)
- Trigger `assign_default_role`: atribui `community_member` a todo novo usuário (via profiles INSERT)
- Trigger `sync_newsletter_subscriber_role`: sincroniza role `subscriber` com `newsletter_subscribed`
- Migração retroativa: todos usuários existentes receberam `community_member` e `subscriber` conforme aplicável
- RPC `get_user_roles(_user_id)`: retorna array de roles para uso no frontend

### ✅ Etapa 6: Validação de Consistência de Roles (CONCLUÍDA)
- Trigger `validate_role_consistency`: garante `community_member` ao inserir roles dependentes
- Impede remoção de `community_member` se existem roles dependentes (business_owner, ambassador, student, blog_editor, admin)

### ✅ Etapa 2: Unificar useRoles/useAuth/useConectaAccess (CONCLUÍDA)
- Novo hook centralizado `useUserRoles.ts` com cache React Query (5 min) usando RPC `get_user_roles`
- `useRoles.hasRole()` agora usa `useUserRoles` internamente (antes só verificava admin/blog_editor)
- `useConectaAccess` usa `has_role('business_owner')` ao invés de `user_subscriptions` para determinar nível "membro"

### 🔲 Etapa 3: Newsletter Opt-in nos Formulários de Cadastro
### 🔲 Etapa 4: Tabela de Dados Socioeconômicos
### 🔲 Etapa 5: Remodelar "Meu Painel" com Abas e Perfil Completo
### 🔲 Etapa 7: Documentação Completa

---

## Arquitetura Original (CONECTA+)

### Tabelas do banco (prefixo `conecta_`):
- conecta_profiles, conecta_teams, conecta_team_members
- conecta_meetings, conecta_attendances, conecta_one_on_ones
- conecta_testimonials, conecta_business_deals, conecta_referrals
- conecta_invitations, conecta_contents, conecta_activity_feed
- conecta_monthly_points, conecta_points_history

### Níveis de Acesso CONECTA+:
- **Admin**: role `admin` na tabela `user_roles`
- **Membro**: role `business_owner` (Associada)
- **Convidado**: Qualquer usuário logado (community_member)

### Rotas:
- `/conecta` - Dashboard
- `/conecta/perfil|membros|grupos|encontros|reunioes|depoimentos|negocios|indicacoes|ranking|estatisticas|convites|conteudos`
- `/admin/conecta` - Painel administrativo

## Matriz de Roles × Acessos

| Funcionalidade | community_member | subscriber | ambassador | business_owner | student | admin |
|---|---|---|---|---|---|---|
| Portal básico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Newsletter | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Painel Embaixadora | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Diretório de Negócios | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (membro) | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (convidado) | ✅ | ✅ | ✅ | - | ✅ | - |
| MeC Academy | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Admin completo | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
