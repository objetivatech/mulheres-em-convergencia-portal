

# Plano: CONECTA+ - Ambiente de Networking Integrado ao Portal MeC

## Analise do Gente Networking Platform

Apos analise profunda do projeto de referencia, identifiquei **12 modulos principais** que compoe a plataforma:

### Funcionalidades do Gente Networking (referencia)

| Modulo | Descricao | Equivalente CONECTA+ |
|--------|-----------|---------------------|
| Dashboard | Cards de estatisticas pessoais, feed de atividades, proximos encontros | Dashboard CONECTA+ |
| Membros | Diretorio filtravel por grupo/segmento/rank, perfil modal, exportacao PDF/Excel | Diretorio de participantes |
| Gente em Acao | Registro de reunioes 1-a-1 (com membro ou convidado), upload de foto | Encontros 1-a-1 |
| Depoimentos | Enviar/receber testemunhos entre membros | Depoimentos |
| Negocios | Registrar negocios fechados com valor, indicacoes cruzadas | Negocios realizados |
| Indicacoes | Compartilhar leads (nome, telefone, email) entre membros | Indicacoes |
| Equipes/Grupos | Visualizar grupos com facilitadores e membros | Grupos CONECTA+ |
| Encontros | Agenda de encontros com confirmacao de presenca, gestao admin | Encontros do grupo |
| Ranking | Ranking mensal por pontuacao, filtro por grupo/mes, podio Top 3 | Ranking CONECTA+ |
| Estatisticas | Graficos pessoais e da comunidade (recharts) | Estatisticas |
| Convites | Gerar codigos de convite, compartilhar link, rastrear aceites | Convites |
| Conteudos | Biblioteca de materiais (video, documento, artigo, link) | Conteudos |
| Admin Dashboard | Visao geral: membros, negocios, atividades recentes, metricas convites | Painel Admin CONECTA+ |
| Perfil | Edicao de perfil com avatar, banner, redes sociais, bio, aniversario | Perfil CONECTA+ |

### Estrutura de banco de dados do Gente Networking

```text
Tabelas:
- profiles (com points, rank, slug, company, position, bio, socials, birthday)
- user_roles (admin | facilitador | membro | convidado)
- teams (nome, cor, descricao)
- team_members (user_id, team_id, is_facilitator)
- meetings (titulo, data, hora, local, team_id)
- attendances (user_id, meeting_id)
- gente_em_acao (reunioes 1-a-1: membro/convidado, foto, notas)
- testimonials (from_user, to_user, content)
- referrals (from_user, to_user, contact_name/phone/email)
- business_deals (valor, cliente, data, closed_by, referred_by)
- invitations (code, status, invited_by, accepted_by)
- contents (titulo, tipo, url, thumbnail)
- activity_feed (log de todas as acoes)
- monthly_points (pontuacao mensal por grupo)
- points_history (historico de mudancas de pontos)

Enums:
- app_role: admin, facilitador, membro, convidado
- member_rank: iniciante, bronze, prata, ouro, diamante

Funcoes RPC:
- calculate_user_points, get_monthly_ranking, get_rank_from_points
- has_role, is_guest, are_same_team, is_team_facilitator
- accept_invitation, add_activity_feed
- recalculate_all_monthly_points, update_user_points_and_rank
```

---

## Arquitetura CONECTA+ no Portal MeC

### Principio fundamental

O CONECTA+ sera um **modulo interno do portal MeC**, nao um app separado. Todas as rotas ficarao sob o prefixo `/conecta` e usarao o **mesmo banco de dados Supabase** do portal, com tabelas prefixadas `conecta_`.

### Mapeamento de niveis de acesso

| Gente Networking | CONECTA+ MeC | Quem sao |
|-----------------|--------------|----------|
| Admin | Admin | Usuarios com role `admin` no MeC |
| Membro | Membro | Assinantes dos planos da pagina `/planos` (role `subscriber` ou assinatura ativa) |
| Convidado | Convidado | Alunos do Academy (`student`), demais usuarios logados |

O nivel de acesso sera determinado automaticamente pela role existente no MeC + status de assinatura de planos.

---

## Implementacao - Fases

### Fase 1: Infraestrutura de Banco de Dados

Criar as seguintes tabelas com prefixo `conecta_`:

```text
conecta_teams          -- Grupos (nome, cor, descricao)
conecta_team_members   -- Membros de grupo (user_id, team_id, is_facilitator)
conecta_meetings       -- Encontros (titulo, data, hora, local, team_id)
conecta_attendances    -- Presencas (user_id, meeting_id)
conecta_one_on_ones    -- Reunioes 1-a-1 (equivalente gente_em_acao)
conecta_testimonials   -- Depoimentos (from_user, to_user, content)
conecta_referrals      -- Indicacoes (from/to user, contact info)
conecta_business_deals -- Negocios (valor, cliente, referencia)
conecta_invitations    -- Convites (code, status, invited_by)
conecta_contents       -- Conteudos (titulo, tipo, url)
conecta_activity_feed  -- Feed de atividades
conecta_monthly_points -- Pontuacao mensal
conecta_points_history -- Historico de pontos
```

Enums:
- `conecta_role`: `admin`, `facilitadora`, `membro`, `convidado`
- `conecta_rank`: `iniciante`, `bronze`, `prata`, `ouro`, `diamante`

RLS policies usando `has_role()` existente + funcoes especificas CONECTA+.

Funcoes RPC para calculo de pontos, ranking, aceitacao de convites.

### Fase 2: Layout e Navegacao

Criar um layout dedicado `ConectaLayout` com:
- Sidebar com menu CONECTA+ (baseado no Sidebar do Gente)
- Header compacto com logo CONECTA+ e identidade MeC
- Controle de acesso por nivel (admin/membro/convidado)
- Rota protegida: qualquer usuario logado pode acessar `/conecta`, mas ve conteudo limitado conforme nivel

Adicionar link "CONECTA+" no menu do usuario logado no Header do portal.

### Fase 3: Paginas do Modulo (sob `/conecta/`)

```text
/conecta                    -- Dashboard (cards, feed, proximos encontros)
/conecta/perfil             -- Perfil CONECTA+ (empresa, bio, redes sociais)
/conecta/membros            -- Diretorio de membros por grupo
/conecta/membro/:slug       -- Perfil publico do membro
/conecta/grupos             -- Visualizacao de grupos
/conecta/encontros          -- Agenda com confirmacao de presenca
/conecta/reunioes           -- Reunioes 1-a-1 (Gente em Acao)
/conecta/depoimentos        -- Enviar/receber depoimentos
/conecta/negocios           -- Registrar negocios fechados
/conecta/indicacoes         -- Compartilhar leads
/conecta/ranking            -- Ranking mensal com podio
/conecta/estatisticas       -- Graficos pessoais e comunidade
/conecta/convites           -- Gerar e gerenciar convites
/conecta/conteudos          -- Biblioteca de materiais
```

### Fase 4: Painel Admin CONECTA+

Adicionar em `/admin/conecta`:
- Dashboard administrativo (total membros, negocios, atividades, convites)
- Gestao de grupos (criar, editar, adicionar membros)
- Gestao de encontros (criar, deletar, gerenciar presencas)
- Gestao de pessoas (promover/rebaixar roles CONECTA+)
- Metricas de convites por membro
- Relatorios com graficos (recharts)

### Fase 5: Integracao com Portal

- Link no menu do usuario (Header/Dropdown) para acessar CONECTA+
- Secao na homepage do portal (opcional) mencionando o CONECTA+
- Documentacao em `docs/_active/`

---

## Arquivos a Criar/Modificar

### Novos componentes e paginas (~25 arquivos):

```text
src/components/conecta/
  ConectaLayout.tsx          -- Layout com sidebar + header
  ConectaSidebar.tsx         -- Menu lateral
  ConectaHeader.tsx          -- Header do ambiente
  MemberSelect.tsx           -- Seletor de membros
  RankBadge.tsx              -- Badge de classificacao
  ActivityFeed.tsx           -- Feed de atividades
  ScoringRulesCard.tsx       -- Regras de pontuacao
  MonthlyPointsSummary.tsx   -- Resumo de pontos mensal

src/pages/conecta/
  ConectaDashboard.tsx       -- Dashboard principal
  ConectaPerfil.tsx          -- Perfil do membro
  ConectaMembros.tsx         -- Diretorio de membros
  ConectaGrupos.tsx          -- Visualizacao de grupos
  ConectaEncontros.tsx       -- Agenda de encontros
  ConectaReunioes.tsx        -- Reunioes 1-a-1
  ConectaDepoimentos.tsx     -- Depoimentos
  ConectaNegocios.tsx        -- Negocios realizados
  ConectaIndicacoes.tsx      -- Indicacoes
  ConectaRanking.tsx         -- Ranking mensal
  ConectaEstatisticas.tsx    -- Estatisticas e graficos
  ConectaConvites.tsx        -- Convites
  ConectaConteudos.tsx       -- Biblioteca de conteudos

src/pages/admin/
  AdminConecta.tsx           -- Painel admin CONECTA+

src/hooks/
  useConectaAdmin.ts         -- Hooks admin (gestao grupos, pessoas)
  useConectaMembers.ts       -- Lista membros, perfil
  useConectaMeetings.ts      -- Encontros e presencas
  useConectaActivities.ts    -- Feed, gente em acao, depoimentos, negocios, indicacoes
  useConectaRanking.ts       -- Ranking e pontuacao
  useConectaInvitations.ts   -- Convites
  useConectaStats.ts         -- Estatisticas pessoais e comunidade
```

### Arquivos a modificar:

```text
src/App.tsx                  -- Adicionar rotas /conecta/* e /admin/conecta
src/components/layout/Header.tsx -- Adicionar link CONECTA+ no menu do usuario
```

### Documentacao:

```text
docs/_active/12-conecta/conecta-overview.md
docs/_active/12-conecta/conecta-database.md
docs/_active/12-conecta/conecta-access-levels.md
```

---

## Detalhes de Acesso

```text
Determinacao automatica do nivel CONECTA+:

1. Admin MeC (has_role 'admin')
   -> conecta_role = 'admin'
   -> Acesso total: todas as paginas + painel admin

2. Assinante de Plano ativo (subscription_plans via business_subscriptions)
   -> conecta_role = 'membro'
   -> Acesso completo: membros, reunioes, negocios, convites, ranking, etc.

3. Aluno Academy (has_role 'student') ou qualquer usuario logado
   -> conecta_role = 'convidado'
   -> Acesso limitado: perfil, encontros (apenas visualizar), conteudos
   -> Dashboard com mensagem incentivando upgrade para membro
```

---

## Ordem de Implementacao Sugerida

Dado o volume, recomendo implementar em **etapas incrementais**:

1. **Etapa 1**: Banco de dados (migracao com todas as tabelas, enums, RLS, funcoes RPC)
2. **Etapa 2**: Layout CONECTA+ (ConectaLayout, Sidebar, Header) + rota basica + link no menu
3. **Etapa 3**: Dashboard + Perfil + Diretorio de membros
4. **Etapa 4**: Encontros + Reunioes 1-a-1 + Presencas
5. **Etapa 5**: Depoimentos + Negocios + Indicacoes
6. **Etapa 6**: Ranking + Estatisticas + Pontuacao
7. **Etapa 7**: Convites + Conteudos
8. **Etapa 8**: Painel Admin CONECTA+
9. **Etapa 9**: Documentacao

Cada etapa pode ser implementada e testada isoladamente.

