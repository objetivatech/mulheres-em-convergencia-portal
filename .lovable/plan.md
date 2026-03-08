
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

## Arquitetura CONECTA+

### Tabelas (prefixo `conecta_`):
- conecta_profiles, conecta_teams, conecta_team_members
- conecta_meetings, conecta_attendances, conecta_one_on_ones
- conecta_testimonials, conecta_business_deals, conecta_referrals
- conecta_invitations, conecta_contents, conecta_activity_feed
- conecta_monthly_points, conecta_points_history

### Edge Functions:
- `send-conecta-email` — Emails via Mailrelay (convite, indicação, depoimento, negócio, cadastro)
- `generate-conecta-pitch` — Gerador de pitch com IA (Perplexity)

### Níveis de Acesso:
- **Admin**: role `admin`
- **Membro**: role `business_owner`
- **Convidado**: `community_member`
