# CONECTA+ - Fluxos Completos de Usuário

## Visão Geral

Este documento descreve detalhadamente todos os fluxos de usuário do módulo CONECTA+, incluindo rotas, regras de acesso, ações disponíveis e integrações.

---

## 1. Níveis de Acesso

| Nível | Role no Portal | `conecta_role` | Acesso |
|-------|---------------|----------------|--------|
| Visitante | Nenhum (anônimo) | — | Apenas página pública de eventos |
| Convidado | `community_member` | `convidado` | 1 evento online + funcionalidades limitadas |
| Membro | `business_owner` | `membro` | Acesso completo + eventos ilimitados |
| Facilitadora | `business_owner` | `facilitadora` | Membro + gestão de encontros + check-in |
| Admin | `admin` | `admin` | Acesso total + painel administrativo |

### Regra de Acesso para Eventos

> **IMPORTANTE:** A restrição de "apenas 1 evento" para convidados aplica-se **exclusivamente a eventos ONLINE**. Convidados podem participar de eventos presenciais sem limitação.

**Lógica de bloqueio:**
1. O campo `conecta_profiles.first_event_attended_at` é preenchido APENAS quando check-in é confirmado em evento com `format = 'online'`
2. Na inscrição, o sistema verifica: `conecta_role = 'convidado'` AND `first_event_attended_at IS NOT NULL` AND `event.format = 'online'`
3. Se todas as condições forem verdadeiras → bloqueio com mensagem para se tornar membro

---

## 2. Fluxo do Convidado

### 2.1 Entrada via Inscrição em Evento Público

```
Visitante acessa /eventos/:slug
        ↓
Preenche formulário (nome, email, telefone, CPF)
        ↓
Edge Function: create-event-registration
        ↓
   ┌─────────────────────┐
   │ Email já existe?    │
   └─────────┬───────────┘
        ┌────┴────┐
       SIM       NÃO
        │         │
   Usa conta    Cria conta auth.users
   existente    + profiles
        │       + conecta_profiles (role=convidado)
        │       + user_roles (community_member)
        │         │
        └────┬────┘
             ↓
   Verifica se evento é ONLINE
        ↓
   ┌───────────────────────────────┐
   │ Convidado + first_event + ON │
   └──────────────┬────────────────┘
          ┌───────┴───────┐
         SIM             NÃO
          │               │
    Erro 403:           Cria event_registration
    GUEST_EVENT_        + CRM lead + interaction
    LIMIT_REACHED       + deal no pipeline
          │               │
          ↓               ↓
    Mensagem:        Email confirmação
    "Torne-se        (com credenciais se novo)
     membro!"
```

### 2.2 Entrada via Convite de Membro

```
Membro cria convite em /conecta
        ↓
Insere em conecta_invitations (name, email, meeting_id?)
        ↓
Edge Function: send-conecta-email (type: invitation)
        ↓
Convidado recebe email com link + código
        ↓
Convidado acessa portal → cria conta se necessário
        ↓
Aceita convite → conecta_profiles (role=convidado)
        ↓
Edge Function: send-conecta-email (type: guest_registered)
Notifica membro que convidou
```

### 2.3 Funcionalidades Disponíveis para Convidado

| Funcionalidade | Disponível? | Observação |
|---------------|-------------|------------|
| Ver Dashboard | ✅ | Versão simplificada |
| Ver Encontros | ✅ | Apenas timeline |
| Inscrever em Evento Online | ⚠️ | Apenas 1 (após check-in, bloqueado) |
| Inscrever em Evento Presencial | ✅ | Sem limitação |
| Enviar Depoimentos | ❌ | Somente membros |
| Enviar Indicações | ❌ | Somente membros |
| Registrar Negócios | ❌ | Somente membros |
| Registrar 1-a-1 | ❌ | Somente membros |
| Helpdesk (Conselho 24/7) | ❌ | Somente membros |
| Perfil Completo | ⚠️ | Visualização limitada |

### 2.4 Caminho para se Tornar Membro

1. Convidado assina plano via página de planos
2. Sistema atualiza `conecta_role` de `convidado` para `membro`
3. Adiciona role `business_owner` em `user_roles`
4. Acesso desbloqueado para todas as funcionalidades
5. `first_event_attended_at` permanece como histórico

---

## 3. Fluxo do Membro

### 3.1 Acesso

- Login em `/login` → redirect para `/conecta`
- Verificação: `useConectaAccess` checa role `business_owner` ou `admin`
- Se não tem `conecta_profiles`, é criado automaticamente com `conecta_role = 'membro'`

### 3.2 Funcionalidades Completas

#### Indicações (Referrals)
1. Acessa `/conecta` → seção Indicações
2. Seleciona membro destinatário
3. Preenche dados do lead: nome, telefone, email, notas
4. Define temperatura: ❄️ Frio | 🔥 Morno | 🔥🔥 Quente
5. Salva em `conecta_referrals`
6. Email enviado ao destinatário via `send-conecta-email`
7. Notificação in-app criada em `conecta_notifications`
8. Pontos atribuídos automaticamente via trigger

#### Depoimentos (Testimonials)
1. Seleciona membro para escrever depoimento
2. Preenche texto do depoimento
3. Salva em `conecta_testimonials`
4. Email + notificação enviados
5. Pontos atribuídos

#### Negócios (Business Deals)
1. Registra negócio fechado (valor, descrição)
2. Opcionalmente indica quem referiu (`referred_by`)
3. Salva em `conecta_business_deals`
4. Se referiu, email enviado ao referidor
5. Pontos atribuídos

#### Reuniões 1-a-1
1. Registra reunião com membro ou convidado externo
2. Define tipo: `membro` ou `convidado`
3. Upload de foto → Cloudflare R2 (`conecta/one-on-one/`)
4. Salva em `conecta_one_on_ones`
5. Pontos atribuídos

#### Convites
1. Cria convite com nome e email do convidado
2. Opcionalmente vincula a encontro (`meeting_id`)
3. Email enviado via Mailrelay
4. Quando aceito → notificação ao membro

#### Helpdesk (Conselho 24/7)
1. Acessa `/conecta/helpdesk`
2. Publica desafio: título, descrição, categoria, prioridade
3. Categorias: Financeiro, Marketing, Vendas, Operações, Jurídico, RH, Tecnologia, Geral
4. Membros respondem na thread
5. Autor marca resposta como "solução"
6. Status automático: Aberto → Em Discussão → Resolvido

#### Perfil com Pitch
1. Acessa `/conecta/perfil`
2. Edita informações básicas, contato, redes sociais
3. Preenche pitch: O que eu faço / Cliente ideal / Como me indicar
4. Gera pitch com IA (Perplexity) via botão
5. Visualiza bloco de pontuação com stats detalhadas

---

## 4. Fluxo do Facilitador

### Gestão de Encontros
1. Acessa `/conecta/encontros`
2. Cria encontro: data, título, local, tipo
3. Gerencia lista de presença
4. Realiza check-in de participantes
5. Visualiza convidados vinculados ao encontro

### Check-in e Controle de Acesso
1. Admin/Facilitador marca check-in em `event_registrations.checked_in_at`
2. Trigger `trg_update_guest_attendance` dispara:
   - Verifica se evento é `format = 'online'`
   - Se sim, atualiza `first_event_attended_at` para convidados
3. Badge "Presença Confirmada" aparece no frontend

---

## 5. Mapa de Rotas

| Rota | Componente | Acesso Mínimo | Descrição |
|------|-----------|---------------|-----------|
| `/conecta` | `ConectaDashboard` | Membro | Dashboard principal com indicadores |
| `/conecta/encontros` | `ConectaEncontros` | Membro | Timeline de encontros + eventos sync |
| `/conecta/perfil` | `ConectaPerfil` | Membro | Perfil pessoal + pitch + pontuação |
| `/conecta/perfil/:id` | `ConectaPerfilPublico` | Membro | Perfil de outro membro |
| `/conecta/helpdesk` | `ConectaHelpdesk` | Membro | Conselho de Administração 24/7 |
| `/conecta/ranking` | `ConectaRanking` | Membro | Ranking mensal de pontuação |
| `/eventos/:slug` | `EventDetailPage` | Público | Página pública do evento (inscrição) |

### Proteção de Rotas

```tsx
// useConectaAccess verifica:
// 1. Usuário autenticado
// 2. Role 'business_owner' ou 'admin' em user_roles
// 3. conecta_profiles existe (cria se não)
```

---

## 6. Fluxo de Convites (Detalhado)

```
1. MEMBRO acessa Dashboard → "Convidar"
   ├── Preenche: Nome, Email do convidado
   ├── Opcionalmente vincula a um encontro (meeting_id)
   └── Clica "Enviar Convite"

2. SISTEMA
   ├── Insere em conecta_invitations (status='pending', code=UUID)
   ├── Chama Edge Function send-conecta-email
   │   ├── Tipo: 'invitation'
   │   ├── Template: link do portal + código do convite
   │   └── Envia via Mailrelay API
   └── Pontos atribuídos ao membro

3. CONVIDADO recebe email
   ├── Clica no link → /conecta?invite=CÓDIGO
   ├── Se não tem conta → cria via formulário
   ├── Sistema cria:
   │   ├── auth.users (conta)
   │   ├── profiles (dados pessoais)
   │   ├── conecta_profiles (role=convidado)
   │   └── user_roles (community_member)
   └── Marca convite como status='accepted'

4. MEMBRO recebe notificação
   ├── Email via send-conecta-email (type: guest_registered)
   └── Notificação in-app em conecta_notifications
```

---

## 7. Fluxo de Eventos (Detalhado)

### 7.1 Eventos Sincronizados (Portal ↔ CONECTA+)

```
Admin cria evento em /admin/crm → aba Eventos
        ↓
Marca conecta_sync = true
        ↓
Evento aparece automaticamente em:
  - Dashboard CONECTA+ (card "Próximos Encontros")
  - Página /conecta/encontros (com badge "Portal")
        ↓
Membro clica "Inscrever-se"
        ↓
Dados pré-preenchidos do perfil (nome, email, CPF, telefone)
        ↓
Cria event_registration via Edge Function
```

### 7.2 Inscrição em Evento Público

```
Visitante acessa /eventos/:slug
        ↓
Preenche formulário de inscrição
        ↓
Edge Function: create-event-registration
        ↓
1. Verifica: evento existe? publicado? tem vagas?
2. Verifica: email já inscrito? (idempotente: retorna sucesso)
3. Se evento ONLINE: verifica bloqueio de convidado
4. Cria/reutiliza conta de usuário
5. Cria event_registration
6. Atualiza current_participants
7. CRM: cria/atualiza lead + interaction + deal
8. Gera confirmation_token
9. Envia email de confirmação (com credenciais se novo)
```

### 7.3 Check-in e Bloqueio

```
Admin marca check-in (checked_in_at ≠ NULL)
        ↓
Trigger trg_update_guest_attendance dispara
        ↓
   ┌─────────────────────────────┐
   │ Evento é format='online'?  │
   └──────────────┬──────────────┘
          ┌───────┴───────┐
         SIM             NÃO
          │               │
   Usuário é convidado?  Nada acontece
   first_event IS NULL?  (presencial OK)
          │
         SIM
          │
   Atualiza first_event_attended_at
          │
   Próxima inscrição em evento ONLINE → BLOQUEADO
```

---

## 8. Sistema de Pontuação

### Ações e Pontos

| Ação | Pontos | Trigger |
|------|--------|---------|
| Registrar reunião 1-a-1 | +10 | INSERT em conecta_one_on_ones |
| Enviar depoimento | +5 | INSERT em conecta_testimonials |
| Enviar indicação | +8 | INSERT em conecta_referrals |
| Registrar negócio | +15 | INSERT em conecta_business_deals |
| Presença em encontro | +5 | INSERT em conecta_attendances |

### Ranks

| Rank | Pontos Mínimos |
|------|---------------|
| Iniciante | 0 |
| Bronze | 50 |
| Prata | 150 |
| Ouro | 350 |
| Diamante | 700 |

### Ranking Mensal

- Tabela `conecta_monthly_points` agrega pontos por mês
- Ranking ordenado por pontos desc
- Exibido em `/conecta/ranking` e no card de pontuação do perfil

---

## 9. Integração com Mailrelay (Segmentos)

### Sincronização de Roles como Segmentos

Ao sincronizar contatos para o Mailrelay, as roles do portal são mapeadas como **grupos** (segmentos):

| Role Portal | Grupo Mailrelay |
|------------|----------------|
| `admin` | [Role] Administradoras |
| `business_owner` | [Role] Empresárias (Membros) |
| `subscriber` | [Role] Assinantes |
| `ambassador` | [Role] Embaixadoras |
| `student` | [Role] Alunas |
| `community_member` | [Role] Comunidade |
| `blog_editor` | [Role] Editoras do Blog |

### Fluxo de Sincronização

```
Action: sync_to_mailrelay (automático)
        ↓
1. Coleta emails de todas as fontes (profiles, events, CRM)
2. Busca/cria grupos no Mailrelay para cada role
3. Para cada subscriber:
   a. Busca user_id pelo email
   b. Busca roles do user_id
   c. Mapeia roles → group_ids do Mailrelay
   d. Cria/atualiza subscriber com group_ids
        ↓
Action: sync_segments (manual/dedicado)
        ↓
1. Busca todos os user_roles com emails
2. Para cada usuário, atualiza grupos no Mailrelay
```

### Benefícios

- Campanhas segmentadas por tipo de usuário
- Ex: enviar promoção apenas para `community_member` (potenciais membros)
- Ex: newsletter exclusiva para `business_owner` (membros ativos)

---

## 10. Notificações

### Tipos de Notificação

| Tipo | Gatilho | Destinatário |
|------|---------|-------------|
| `new_referral` | Nova indicação recebida | Membro indicado |
| `new_testimonial` | Novo depoimento recebido | Membro elogiado |
| `deal_from_referral` | Negócio via indicação | Membro que indicou |
| `guest_registered` | Convidado se cadastrou | Membro que convidou |

### Canal Duplo

1. **In-app:** Ícone sino no header com badge vermelho + dropdown
2. **Email:** Via Edge Function `send-conecta-email` + Mailrelay

### Real-time

- Supabase Realtime listener em `conecta_notifications` (INSERT)
- Badge atualizado automaticamente sem refresh

---

## 11. Armazenamento de Arquivos

| Tipo | Destino | Pasta |
|------|---------|-------|
| Banner do perfil | Cloudflare R2 | `conecta/banners/` |
| Foto de reunião 1-a-1 | Cloudflare R2 | `conecta/one-on-one/` |
| Banner de evento | Cloudflare R2 | `events/` |

---

## Diagrama de Estados do Convidado (Revisado)

```
┌─────────────────┐
│   VISITANTE     │
│   (anônimo)     │
└────────┬────────┘
         │ Inscrição em evento OU convite
         ↓
┌─────────────────┐
│   CONVIDADO     │
│ first_event: ∅  │  ← Pode se inscrever em qualquer evento
└────────┬────────┘
         │ Check-in em evento ONLINE
         ↓
┌─────────────────┐
│   CONVIDADO     │
│ first_event: ✓  │  ← BLOQUEADO para novos eventos ONLINE
│                 │  ← Eventos presenciais continuam OK
└────────┬────────┘
         │ Assina plano
         ↓
┌─────────────────┐
│    MEMBRO       │
│ first_event: ✓  │  ← Acesso ilimitado a tudo
└─────────────────┘
```
