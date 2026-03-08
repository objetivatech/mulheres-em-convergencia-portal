
# Plano: Revisão Completa do CONECTA+ e Novos Recursos

## Status de Implementação

### ✅ Rodada 1: Correções Urgentes + Quick Wins (CONCLUÍDA)

#### Etapa 1: Correções Urgentes
- **Fix do hook de convites**: `useConectaInvitations.ts` corrigido para usar `name`/`email` (campos reais da tabela) em vez de `guest_name`/`guest_email`
- **ConectaConvites.tsx**: atualizado para exibir `inv.name`/`inv.email`
- **Migração de uploads para R2**:
  - `ConectaPerfil.tsx`: banner upload migrado de `supabase.storage` para `useR2Storage` (pasta `conecta/banners`)
  - `ConectaReunioes.tsx`: foto 1-a-1 migrado para `useR2Storage` (pasta `conecta/one-on-one`)

#### Etapa 2: Sistema de Emails via Mailrelay
- **Edge Function `send-conecta-email`** criada com 5 ações:
  - `invitation` — email ao convidado com código
  - `new_referral` — email ao membro destinatário com temperatura do lead
  - `new_testimonial` — email ao membro que recebeu depoimento
  - `deal_from_referral` — email a quem indicou com valor do negócio
  - `guest_registered` — email ao membro quando convidado se cadastra
- Templates com identidade visual MeC (cores `#7c3aed`, logo, gradientes)
- Hooks `useConectaInvitations`, `useConectaReferrals`, `useConectaTestimonials`, `useConectaBusinessDeals` atualizados para enviar emails

#### Etapa 7: Temperatura nas Indicações
- Coluna `temperature` adicionada em `conecta_referrals` (cold/warm/hot, default 'warm')
- Coluna `meeting_id` adicionada em `conecta_invitations` (FK → conecta_meetings)
- Seletor visual de temperatura com 3 botões coloridos (❄️ Frio/🔥 Morno/🔥🔥 Quente)
- Badge colorido de temperatura exibido em cada indicação
- Hook `useConectaReferrals` aceita e persiste o campo `temperature`

---

### 🔲 Rodada 2: Funcionalidades Core (PENDENTE)

#### Etapa 3: Lista de Convidados por Encontro
- Componente `MeetingGuestsList` com convidados agrupados por encontro
- Acesso restrito para membros/facilitadores/admin
- Nome do convidado como link para perfil público

#### Etapa 4: Sincronização Encontros ↔ Eventos do Portal
- Campo `conecta_sync` na tabela `events`
- Listar eventos do portal na interface Conecta+
- Inscrição/desinscrição direta com dados pré-preenchidos

#### Etapa 5: Perfil Enriquecido com Pitch
- Novos campos: area_of_expertise, skills_tags, pitch_what_i_do, pitch_ideal_client, pitch_how_to_refer, contact_email
- Edge Function `generate-conecta-pitch` com IA

---

### 🔲 Rodada 3: Notificações + Helpdesk + Docs (PENDENTE)

#### Etapa 8: Sistema de Notificações
- Tabela `conecta_notifications`
- Sino no header com badge de contagem
- Emails + preferências de notificação

#### Etapa 6: Conselho de Administração 24/7 (Helpdesk)
- Tabelas `conecta_helpdesk_posts` e `conecta_helpdesk_replies`
- Kanban com 3 colunas + vista de lista
- Pontuação por responder posts

#### Etapa 9: Documentação
- `conecta-fluxos-revisados.md`
- Atualizar `conecta-access-levels.md`

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
