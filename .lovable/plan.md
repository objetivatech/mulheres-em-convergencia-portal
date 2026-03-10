
# Plano: Revisão Completa do CONECTA+ e Novos Recursos

## Status de Implementação

### ✅ Rodada 1: Correções Urgentes + Quick Wins (CONCLUÍDA)

- Fix do hook de convites (`name`/`email` corrigidos)
- Uploads migrados para R2 (banner + fotos 1-a-1)
- Edge Function `send-conecta-email` com 5 tipos de email via Mailrelay
- Temperatura nas indicações (cold/warm/hot com seletor visual)
- Coluna `meeting_id` em `conecta_invitations`

### ✅ Rodada 2: Funcionalidades Core (CONCLUÍDA)

#### Etapa 3: Lista de Convidados por Encontro
- Hook `useMeetingGuests` busca convites vinculados a cada encontro
- Componente `MeetingGuestsList` com lista expansível de convidadas
- Visível apenas para membros/facilitadores/admin (`isMemberOrAbove`)
- Nome do convidado como link para perfil se cadastrado

#### Etapa 4: Sincronização Encontros ↔ Eventos do Portal
- Coluna `conecta_sync` (boolean) adicionada à tabela `events`
- Eventos marcados com `conecta_sync=true` aparecem na timeline do Conecta+
- Inscrição/desinscrição direta com dados pré-preenchidos do perfil
- Badge "Portal" distingue eventos sincronizados dos encontros manuais

#### Etapa 5: Perfil Enriquecido com Pitch
- Novos campos: `area_of_expertise`, `skills_tags`, `pitch_what_i_do`, `pitch_ideal_client`, `pitch_how_to_refer`, `contact_email`
- Formulário organizado em 3 seções: Info Básica, Contato & Redes, Elevator Pitch
- Sistema de tags com adição/remoção dinâmica
- Edge Function `generate-conecta-pitch` com Perplexity AI (fallback sem API key)
- Visualização rica do pitch no modo leitura

### ✅ Rodada 3: Notificações + Helpdesk + Docs (CONCLUÍDA)

#### Etapa 8: Sistema de Notificações
- Tabela `conecta_notifications` com RLS e real-time
- Sino no header com badge de contagem (vermelho)
- Dropdown com lista de notificações e marcar como lida
- Real-time via Supabase Realtime (INSERT listener)

#### Etapa 6: Conselho de Administração 24/7 (Helpdesk)
- Tabelas `conecta_helpdesk_posts` e `conecta_helpdesk_replies` com RLS
- Visualização Kanban com 3 colunas (Aberto → Em Discussão → Resolvido)
- Vista de lista alternativa com filtros por categoria
- Thread de discussão com respostas e marcação de solução
- Trigger automático: `reply_count` + mudança de status para "Em Discussão"
- 8 categorias: Financeiro, Marketing, Vendas, Operações, Jurídico, RH, Tecnologia, Geral
- Rota: `/conecta/helpdesk`

#### Etapa 9: Documentação
- `conecta-fluxos-revisados.md` com todos os fluxos detalhados
- `conecta-access-levels.md` atualizado com Conselho 24/7 e Notificações

---

### ✅ Rodada 4 - Sprint 1: Fundamentos e Correções (CONCLUÍDA)

#### Item 1: Image Crop Tool + Dimensões Recomendadas
- Componente `ImageCropUploader` com `react-image-crop`
- Presets de dimensões para 7 contextos (blog, perfil, negócio, etc.)
- Texto informativo de dimensão ideal em cada campo
- Modal de recorte com aspect ratio fixo
- Blog `ImageUploader` refatorado para usar novo componente
- Documentação: `docs/_active/06-funcionalidades/image-crop-tool.md`

#### Item 2: Revisão dos Contadores e Gamificação do CONECTA+
- **Descoberta:** Funções de trigger existiam mas triggers NÃO estavam criados
- Triggers criados para: one_on_ones, testimonials, business_deals, referrals, attendances
- Novo trigger para respostas no Conselho 24/7 (+5 pts)
- Função `conecta_calculate_monthly_points` atualizada com Conselho 24/7
- `ScoringRulesCard.tsx` atualizado com regra do Conselho 24/7
- Documentação: `docs/_active/12-conecta/conecta-gamificacao.md`

#### Item 3: Arquivamento de Eventos no Admin
- Tabs "Ativos" e "Arquivados" na gestão de eventos
- Ativos ordenados por data ASC (próximos primeiro)
- Arquivados ordenados por data DESC (recentes primeiro)
- Botão "Arquivar" muda status para `completed`

---

### ✅ Rodada 5 - Sprint 2: Funcionalidades CONECTA+ (CONCLUÍDA)

#### Item 4: Card de Negócio no Perfil CONECTA+
- Componente `BusinessProfileCard` busca negócios com `subscription_active = true`
- Exibe nome, logo, categoria, descrição e link para `/guia/{slug}`
- Integrado no perfil (`ConectaPerfil.tsx`) em modo visualização
- `useConectaMembers` atualizado para filtrar apenas negócios com assinatura ativa

#### Item 5: Pontuação Conselho 24/7 (concluído no Sprint 1)

#### Item 7: Registro de Parcerias entre Membros
- Tabela `conecta_partnerships` com RLS e constraint de parceiros diferentes
- Trigger `trg_conecta_partnership_insert` → +15 pts para ambas
- Função `conecta_calculate_monthly_points` atualizada com parcerias
- Hook `useConectaPartnerships.ts` com CRUD
- Página `/conecta/parcerias` com formulário e listagem
- Sidebar atualizado com item "Parcerias"
- `ScoringRulesCard.tsx` atualizado com regra de parcerias
- Documentação: `docs/_active/12-conecta/conecta-parcerias.md`

---

### ✅ Sprint 3: Integrações e Automações (CONCLUÍDA)

- [x] **Check-in presencial via QR Code** (item 8)
  - Página pública `/evento-checkin/:eventId` com busca por CPF
  - Botão "QR Check-in" no admin para eventos presenciais/híbridos
  - Trigger de gamificação: +10 pts para membros CONECTA+ ao fazer check-in
  - Dependência `qrcode.react` instalada
  - Documentação: `docs/_active/06-funcionalidades/evento-checkin-qrcode.md`

- [x] **Integração CONECTA+ / MeC Academy** (item 9)
  - `useConectaContents.ts` agora faz UNION de `conecta_contents` com `academy_lessons`
  - Convidados veem apenas conteúdos gratuitos/free preview
  - Badge "Academy" diferencia conteúdos do MeC Academy
  - Link redireciona para `/academy/curso/:slug`

- [x] **Aniversariantes do mês** (item 10)
  - Página `/conecta/aniversariantes` com agrupamento por mês
  - Mês atual em destaque (primeira posição, borda primária)
  - Data de aniversário exibida sem ano (DD/mmm) no perfil público
  - Edge Function `conecta-birthday-notify` para envio mensal via Mailrelay
  - Item "Aniversariantes" no sidebar com ícone Cake
  - Documentação: `docs/_active/12-conecta/conecta-aniversariantes.md`

---

## 🔲 Próximos Sprints

### Sprint 4: Performance (item 6)
- [ ] Otimização PageSpeed (imagens, fontes, scripts, preconnects)

---

## Arquitetura CONECTA+

### Tabelas (prefixo `conecta_`):
- conecta_profiles, conecta_teams, conecta_team_members
- conecta_meetings, conecta_attendances, conecta_one_on_ones
- conecta_testimonials, conecta_business_deals, conecta_referrals
- conecta_invitations, conecta_contents, conecta_activity_feed
- conecta_monthly_points, conecta_points_history
- conecta_notifications, conecta_helpdesk_posts, conecta_helpdesk_replies

### Edge Functions:
- `send-conecta-email` — Emails via Mailrelay (convite, indicação, depoimento, negócio, cadastro)
- `generate-conecta-pitch` — Gerador de pitch com IA (Perplexity)

### Níveis de Acesso:
- **Admin**: role `admin`
- **Membro**: role `business_owner`
- **Convidado**: `community_member`
