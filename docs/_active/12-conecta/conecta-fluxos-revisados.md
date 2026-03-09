# CONECTA+ - Fluxos Revisados

## Visão Geral

O módulo CONECTA+ é o sistema de networking do portal MeC. Este documento descreve todos os fluxos implementados.

---

## 1. Convites

**Fluxo:**
1. Membro cria convite → insere em `conecta_invitations` com `name`, `email`, código único, e opcionalmente `meeting_id`
2. Edge Function `send-conecta-email` (tipo `invitation`) envia email via Mailrelay ao convidado
3. Convidado acessa portal via link com código → aceita convite
4. Edge Function `send-conecta-email` (tipo `guest_registered`) notifica o membro que convidou

**Armazenamento:** N/A (sem upload)

---

## 2. Indicações (Referrals)

**Fluxo:**
1. Membro seleciona destinatário + preenche dados do lead (nome, telefone, email, notas)
2. Seleciona temperatura: Frio (❄️ azul), Morno (🔥 amarelo), Quente (🔥🔥 vermelho)
3. Insere em `conecta_referrals` com campo `temperature`
4. Edge Function `send-conecta-email` (tipo `new_referral`) notifica o destinatário
5. Badge colorido na listagem identifica a temperatura

---

## 3. Depoimentos (Testimonials)

**Fluxo:**
1. Membro escreve depoimento para outro membro
2. Insere em `conecta_testimonials`
3. Edge Function `send-conecta-email` (tipo `new_testimonial`) notifica o membro

---

## 4. Negócios (Business Deals)

**Fluxo:**
1. Membro registra negócio fechado com valor e descrição
2. Opcionalmente indica quem referiu (`referred_by`)
3. Edge Function `send-conecta-email` (tipo `deal_from_referral`) notifica quem indicou

---

## 5. Reuniões 1-a-1

**Fluxo:**
1. Membro registra reunião com outro membro ou convidado externo
2. Upload de foto → **Cloudflare R2** (pasta `conecta/one-on-one/`)
3. Insere em `conecta_one_on_ones`

---

## 6. Perfil Conecta+ com Pitch

**Campos do perfil:**
- Info Básica: empresa, cargo, bio
- Contato: telefone, email de contato, LinkedIn, Instagram, website
- Pitch: `area_of_expertise`, `skills_tags`, `pitch_what_i_do`, `pitch_ideal_client`, `pitch_how_to_refer`

**Gerador de Pitch:**
- Edge Function `generate-conecta-pitch` usa dados do perfil para gerar pitch
- Usa Perplexity AI quando API key disponível, senão gera pitch local a partir dos dados
- Resultado editável antes de salvar

**Uploads:** Banner → **Cloudflare R2** (pasta `conecta/banners/`)

---

## 7. Encontros + Eventos Sincronizados

**Encontros manuais:** Tabela `conecta_meetings` com presença via `conecta_attendances`

**Eventos sincronizados:** Eventos da tabela `events` com `conecta_sync = true` aparecem na timeline do Conecta+.
- Inscrição/desinscrição direta via `event_registrations`
- Dados pré-preenchidos do perfil (nome, email, CPF, telefone)
- Badge "Portal" distingue eventos sincronizados
- Badge "Presença Confirmada" exibe status de check-in

**Lista de convidados:** Componente `MeetingGuestsList` exibe convidados vinculados a cada encontro via `meeting_id` em `conecta_invitations`. Visível apenas para membros/facilitadores/admin.

---

## 8. Conselho de Administração 24/7 (Helpdesk)

**Tabelas:** `conecta_helpdesk_posts`, `conecta_helpdesk_replies`

**Fluxo:**
1. Membro publica desafio de negócio (título, descrição, categoria, prioridade)
2. Categorias: Financeiro, Marketing, Vendas, Operações, Jurídico, RH, Tecnologia, Geral
3. Status: Aberto → Em Discussão (automático ao receber resposta) → Resolvido
4. Membros respondem; autor pode marcar resposta como "solução"
5. Vista Kanban (3 colunas) + Vista Lista com filtros
6. Trigger atualiza `reply_count` automaticamente

---

## 9. Sistema de Notificações

**Tabela:** `conecta_notifications`

**Tipos:**
- `new_referral` — Nova indicação recebida
- `new_testimonial` — Novo depoimento recebido
- `deal_from_referral` — Negócio fechado via indicação sua
- `guest_registered` — Convidado(a) se cadastrou

**Frontend:**
- Ícone de sino no header com badge de contagem (vermelho)
- Dropdown com lista de notificações
- Marcar como lida individualmente ou todas de uma vez
- Real-time via Supabase Realtime (INSERT listener)

**Email:** Cada notificação também dispara email via `send-conecta-email` (Mailrelay)

---

## 10. Pontuação e Ranking

**Triggers automáticos:** Inserções em `conecta_one_on_ones`, `conecta_testimonials`, `conecta_business_deals`, `conecta_referrals`, `conecta_attendances` → pontos + feed de atividades.

**Ranks:** Iniciante → Bronze → Prata → Ouro → Diamante

---

## 11. Integração com Eventos do Portal

### Sincronização Dashboard ↔ Eventos

Eventos com `conecta_sync = true` aparecem automaticamente:
- **Dashboard:** Card "Próximos Encontros" unifica `conecta_meetings` + `events` sincronizados
- **Página Encontros:** Lista completa com badge "Portal" para eventos externos
- Inscrições usam tabela única `event_registrations`

### Criação de Conta Automática

Ao se inscrever em evento via `/eventos`:
1. Sistema verifica se email já existe em `auth.users`
2. Se não existe: cria usuário com senha temporária
3. Cria `profile` com dados do formulário
4. Cria `conecta_profile` com `conecta_role = 'convidado'`
5. Email de confirmação inclui credenciais de acesso

### Controle de Presença Sincronizado

- Admin marca check-in via CRM (`checked_in_at` em `event_registrations`)
- Conecta+ exibe badge "Presença Confirmada" em tempo real
- Trigger `trg_update_guest_attendance` atualiza `first_event_attended_at` no primeiro check-in

### Controle de Acesso Único para Convidados (APENAS EVENTOS ONLINE)

**Regra de negócio:**
- Convidados podem participar de **apenas 1 evento online**
- Após check-in confirmado em evento online, novos eventos online são bloqueados
- **Eventos presenciais NÃO são bloqueados** — convidados podem participar livremente
- Membros pagantes têm acesso ilimitado a todos os formatos

**Implementação:**
- Campo `conecta_profiles.first_event_attended_at` marca primeiro check-in em evento online
- Trigger `update_guest_first_attendance()` verifica `events.format = 'online'` antes de atualizar
- Edge Function `create-event-registration` só aplica bloqueio se `event.format === 'online'`
- Erro `GUEST_EVENT_LIMIT_REACHED` retorna mensagem mencionando "eventos online"

**Fluxo de bloqueio:**
1. Convidado tenta se inscrever em novo evento
2. Sistema verifica `conecta_role = 'convidado'` E `first_event_attended_at IS NOT NULL`
3. Se ambos verdadeiros → retorna erro 403 com mensagem:
   > "Você já participou de um evento como convidada. Para participar de mais eventos, torne-se membro!"

---

## Edge Functions

| Função | Propósito |
|--------|-----------|
| `send-conecta-email` | 5 tipos de email via Mailrelay (identidade MeC) |
| `generate-conecta-pitch` | Gerador de pitch com IA (Perplexity) ou fallback local |
| `create-event-registration` | Inscrição em eventos + criação de conta + controle de acesso |

---

## Armazenamento

Todos os uploads usam **Cloudflare R2** via hook `useR2Storage`:
- `conecta/banners/` — Banners de perfil
- `conecta/one-on-one/` — Fotos de reuniões 1-a-1

---

## Modelo de Dados: Campos-Chave

### conecta_profiles
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `conecta_role` | text | 'convidado', 'membro', 'facilitadora', 'admin' |
| `first_event_attended_at` | timestamptz | Data do primeiro check-in (controle de acesso) |
| `points` | int | Pontuação total |
| `rank` | text | Rank atual |

### event_registrations
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | uuid | Link com conta do portal (pode ser null) |
| `checked_in_at` | timestamptz | Momento do check-in |
| `status` | text | 'pending', 'confirmed', 'cancelled', 'attended' |
