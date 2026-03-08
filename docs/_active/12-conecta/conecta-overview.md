# CONECTA+ - Documentação Completa

## Visão Geral

O **CONECTA+** é o módulo de networking integrado ao portal Mulheres em Convergência (MeC). Permite que empreendedoras registrem reuniões 1-a-1, troquem depoimentos, registrem negócios e indicações, participem de encontros em grupo e compitam em um ranking mensal gamificado.

---

## Níveis de Acesso

| Nível | Quem são | Acesso |
|-------|----------|--------|
| **Admin** | Admins MeC (`is_admin = true`) | Total + painel admin (`/admin/conecta`) |
| **Membro** | Assinantes de planos ativos | Completo: reuniões, negócios, convites, ranking |
| **Convidado** | Qualquer usuário logado | Limitado: perfil, encontros (visualizar), conteúdos |

O nível é determinado automaticamente pelo hook `useConectaAccess.ts` baseado no status do usuário no portal.

---

## Banco de Dados

15 tabelas com prefixo `conecta_` no mesmo Supabase do portal:

| Tabela | Descrição |
|--------|-----------|
| `conecta_profiles` | Perfil CONECTA+ (empresa, cargo, bio, redes, rank, pontos) |
| `conecta_teams` | Grupos (nome, cor, descrição) |
| `conecta_team_members` | Membros de grupo (user_id, team_id, is_facilitator) |
| `conecta_meetings` | Encontros (título, data, hora, local, team_id) |
| `conecta_attendances` | Presenças em encontros |
| `conecta_one_on_ones` | Reuniões 1-a-1 (membro/convidado, foto, notas) |
| `conecta_testimonials` | Depoimentos entre membros |
| `conecta_referrals` | Indicações (leads compartilhados) |
| `conecta_business_deals` | Negócios fechados com valor |
| `conecta_invitations` | Convites com código único |
| `conecta_contents` | Conteúdos (vídeo, documento, artigo, link) |
| `conecta_activity_feed` | Log de atividades (real-time) |
| `conecta_monthly_points` | Pontuação mensal por mês |
| `conecta_points_history` | Histórico de mudanças de pontos |
| `conecta_ranking` | Ranking consolidado |

### Enums
- `conecta_role`: admin, facilitadora, membro, convidado
- `conecta_rank`: iniciante, bronze, prata, ouro, diamante

### RLS
Todas as tabelas possuem Row-Level Security com políticas baseadas em `auth.uid()` e funções `SECURITY DEFINER`.

---

## Sistema de Pontuação

| Atividade | Pontos |
|-----------|--------|
| Reunião 1-a-1 | 25 |
| Presença em encontro | 20 |
| Indicação | 20 |
| Depoimento | 15 |
| Convidado com presença | 15 |
| Negócio fechado | 5 por R$100 |

### Ranks
| Rank | Pontos necessários |
|------|-------------------|
| Iniciante | 0-49 |
| Bronze | 50-199 |
| Prata | 200-499 |
| Ouro | 500-999 |
| Diamante | 1000+ |

---

## Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/conecta` | Dashboard | Todos |
| `/conecta/perfil` | Perfil CONECTA+ | Todos |
| `/conecta/membros` | Diretório de membros | Todos |
| `/conecta/grupos` | Grupos | Todos |
| `/conecta/encontros` | Agenda de encontros | Todos |
| `/conecta/reunioes` | Reuniões 1-a-1 | Membros+ |
| `/conecta/depoimentos` | Depoimentos | Membros+ |
| `/conecta/negocios` | Negócios | Membros+ |
| `/conecta/indicacoes` | Indicações | Membros+ |
| `/conecta/ranking` | Ranking mensal | Todos |
| `/conecta/estatisticas` | Estatísticas pessoais | Todos |
| `/conecta/convites` | Convites | Membros+ |
| `/conecta/conteudos` | Conteúdos | Todos |
| `/admin/conecta` | Painel Admin | Admins |

---

## Arquivos Principais

### Componentes (`src/components/conecta/`)
- `ConectaLayout.tsx` — Layout com sidebar + header
- `ConectaSidebar.tsx` — Menu lateral com navegação por nível
- `ConectaHeader.tsx` — Header com badge de nível e perfil
- `ConectaMemberSelect.tsx` — Seletor de membros reutilizável
- `ConectaActivityFeed.tsx` — Feed de atividades em tempo real
- `RankBadge.tsx` — Badge de classificação (5 tiers)
- `ScoringRulesCard.tsx` — Card com regras de pontuação

### Páginas (`src/pages/conecta/`)
- `ConectaDashboard.tsx` — Dashboard com stats, feed, próximos encontros
- `ConectaPerfil.tsx` — Perfil com edição completa
- `ConectaMembros.tsx` — Diretório com busca e filtros
- `ConectaEncontros.tsx` — Agenda com confirmação de presença
- `ConectaReunioes.tsx` — Registro de reuniões 1-a-1
- `ConectaDepoimentos.tsx` — Enviar/receber depoimentos
- `ConectaNegocios.tsx` — Registrar negócios fechados
- `ConectaIndicacoes.tsx` — Compartilhar leads
- `ConectaRanking.tsx` — Ranking com pódio Top 3
- `ConectaEstatisticas.tsx` — Gráficos (recharts)
- `ConectaConvites.tsx` — Criar e gerenciar convites
- `ConectaConteudos.tsx` — Biblioteca de materiais

### Admin (`src/pages/admin/`)
- `AdminConecta.tsx` — Painel administrativo com visão geral

### Hooks (`src/hooks/`)
- `useConectaAccess.ts` — Controle de acesso (admin/membro/convidado)
- `useConectaStats.ts` — Estatísticas pessoais
- `useConectaActivityFeed.ts` — Feed com real-time subscriptions
- `useConectaMembers.ts` — Lista e filtro de membros
- `useConectaProfile.ts` — CRUD de perfil
- `useConectaMeetings.ts` — Encontros e presenças
- `useConectaOneOnOnes.ts` — Reuniões 1-a-1
- `useConectaTestimonials.ts` — Depoimentos
- `useConectaBusinessDeals.ts` — Negócios
- `useConectaReferrals.ts` — Indicações
- `useConectaRanking.ts` — Ranking mensal
- `useConectaInvitations.ts` — Convites
- `useConectaContents.ts` — Conteúdos
- `useConectaAdmin.ts` — Dados do painel admin

---

## Integrações com o Portal

1. **Menu do usuário** (`Header.tsx`): Link "🔗 CONECTA+" no dropdown
2. **Supabase Storage**: Bucket `conecta` para fotos de reuniões e banners
3. **Real-time**: Subscriptions no `conecta_activity_feed` para atualizações instantâneas
4. **Recharts**: Gráficos de barra e pizza nas estatísticas
