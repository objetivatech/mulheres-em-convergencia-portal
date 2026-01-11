# Automação de Eventos - Documentação

## Visão Geral

Este documento descreve o sistema de automação de eventos implementado na plataforma Mulheres em Convergência.

---

## 1. Gestão de Participantes

### Check-in com Atualização de Pipeline

Quando um participante faz check-in em um evento:
1. O campo `checked_in_at` é preenchido com a data/hora atual
2. O status da inscrição muda para `attended`
3. O deal no CRM é atualizado para o estágio **"participou"**
4. **Interação CRM registrada:** `event_check_in`

**Arquivo:** `src/hooks/useEvents.ts` → `useCheckIn()`

### Remoção de Participante

Para liberar vaga no evento:
1. O botão "Remover" (ícone UserMinus) está disponível na tabela de inscritos
2. Ao remover:
   - O deal associado no CRM é **deletado**
   - **Interação CRM registrada:** `event_registration_removed`
   - A inscrição é **removida**
   - O contador `current_participants` é **decrementado**
   - O lead/contato **NÃO é removido** (mantido para comunicação futura)

**Arquivo:** `src/hooks/useEvents.ts` → `useRemoveRegistration()`

---

## 2. Sistema de Confirmação de Presença

### Campos de Controle

Tabela `event_registrations` possui os seguintes campos de controle:

| Campo | Descrição |
|-------|-----------|
| `confirmation_token` | Token único para link de confirmação |
| `confirmation_email_1_sent_at` | Timestamp do 1º email (5 dias antes) |
| `confirmation_email_2_sent_at` | Timestamp do 2º email (3 dias antes) |
| `confirmation_email_3_sent_at` | Timestamp do 3º email (1 dia antes) |
| `presence_confirmed_at` | Quando a presença foi confirmada |
| `welcome_email_sent_at` | Quando o email de boas-vindas foi enviado |
| `reminder_2h_sent_at` | Quando o lembrete de 2h foi enviado |

### Fluxo de Emails

```
Inscrição no Evento
        ↓
   [5 dias antes] → Email 1: "Confirme sua presença" → Interação: email_confirmation_request
        ↓ (se não confirmou)
   [3 dias antes] → Email 2: "Aguardamos sua confirmação" → Interação: email_confirmation_request
        ↓ (se não confirmou)
   [1 dia antes] → Email 3: "Última chamada" → Interação: email_confirmation_request
        ↓
   [Ao confirmar] → Interação: event_presence_confirmed + Email de Boas-vindas (email_welcome) + Deal → "confirmado"
        ↓
   [2h antes] → Email lembrete → Interação: email_reminder_2h (apenas para confirmados)
        ↓
   [Check-in] → Interação: event_check_in + Deal → "participou"
```

---

## 3. Interações CRM Registradas

Todas as seguintes ações são automaticamente registradas na timeline do contato:

### Eventos

| Tipo de Interação | Quando é Registrada | Canal |
|-------------------|---------------------|-------|
| `event_registration` | Inscrição no evento | website |
| `event_presence_confirmed` | Confirmação via link no email | email |
| `event_check_in` | Check-in pelo admin | in_person |
| `event_registration_removed` | Remoção pelo admin | admin |

### Emails

| Tipo de Interação | Quando é Registrada | Descrição |
|-------------------|---------------------|-----------|
| `email_confirmation_request` | Envio de email de confirmação (1, 2 ou 3) | Inclui número do email |
| `email_welcome` | Após confirmar presença | Email de boas-vindas |
| `email_reminder_2h` | 2 horas antes do evento | Lembrete para confirmados |

### Outros Tipos Suportados

| Tipo | Descrição |
|------|-----------|
| `contact_form` | Formulário de contato |
| `newsletter_subscription` | Inscrição na newsletter |
| `business_contact` | Contato empresarial |
| `product_purchase_started` | Início de compra |
| `product_purchase_confirmed` | Pagamento confirmado |
| `event_payment_confirmed` | Pagamento de evento confirmado |
| `donation` | Doação registrada |

---

## 4. Edge Functions

### confirm-event-presence

**Propósito:** Processar confirmações de presença via link no email.

**Endpoint:** `POST /confirm-event-presence?token=<TOKEN>`

**Ações:**
1. Valida o token de confirmação
2. Atualiza `presence_confirmed_at` na inscrição
3. **Registra interação CRM:** `event_presence_confirmed`
4. Atualiza deal no CRM para estágio "confirmado"
5. Envia email de boas-vindas
6. **Registra interação CRM:** `email_welcome`

**Retorno:**
```json
{
  "success": true,
  "message": "Presença confirmada com sucesso!",
  "event_title": "Nome do Evento",
  "event_date": "2026-01-15T19:00:00Z"
}
```

### event-confirmation-scheduler

**Propósito:** Enviar emails de solicitação de confirmação em lote.

**Endpoint:** `POST /event-confirmation-scheduler`

**Deve ser executado:** Diariamente (cron job)

**Lógica:**
- **5 dias antes:** Envia email 1 + **Interação CRM:** `email_confirmation_request` (email_number: 1)
- **3 dias antes:** Envia email 2 + **Interação CRM:** `email_confirmation_request` (email_number: 2)
- **1 dia antes:** Envia email 3 + **Interação CRM:** `email_confirmation_request` (email_number: 3)

**Retorno:**
```json
{
  "success": true,
  "email1_sent": 10,
  "email2_sent": 5,
  "email3_sent": 2,
  "errors": 0
}
```

### event-email-scheduler

**Propósito:** Enviar lembretes e outros emails programados.

**Endpoint:** `POST /event-email-scheduler`

**Ações disponíveis:**
- `action: "reminder_tomorrow"` - Lembrete 1 dia antes
- `action: "reminder_2h"` - Lembrete 2 horas antes (apenas para confirmados) + **Interação CRM:** `email_reminder_2h`

**Deve ser executado:** A cada hora (para lembretes de 2h)

---

## 5. Página de Confirmação

**Rota:** `/confirmar-presenca?token=<TOKEN>`

**Arquivo:** `src/pages/EventConfirmPresencePage.tsx`

**Estados:**
1. **Carregando:** Spinner enquanto processa
2. **Sucesso:** Mostra mensagem de confirmação, detalhes do evento
3. **Já confirmado:** Informa que a presença já foi confirmada
4. **Erro:** Mostra mensagem de erro com link para contato

---

## 6. Configuração de Cron Jobs

Para ativar as automações, configure os seguintes cron jobs no Supabase:

### Confirmação de Presença (diário)
```bash
# Executar diariamente às 09:00 (Brasília)
curl -X POST https://<project>.supabase.co/functions/v1/event-confirmation-scheduler \
  -H "Authorization: Bearer <service_role_key>"
```

### Lembrete 2 Horas (a cada hora)
```bash
# Executar a cada hora
curl -X POST https://<project>.supabase.co/functions/v1/event-email-scheduler \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "reminder_2h"}'
```

---

## 7. Variáveis de Ambiente Necessárias

| Variável | Descrição |
|----------|-----------|
| `MAILRELAY_API_KEY` | Chave de API do Mailrelay |
| `MAILRELAY_HOST` | Host do Mailrelay (ex: app.mailrelay.com) |
| `ADMIN_EMAIL_FROM` | Email remetente (ex: contato@mulheresemconvergencia.com.br) |
| `PRODUCTION_DOMAIN` | Domínio de produção para links (ex: https://mulheresemconvergencia.com.br) |

---

## 8. Pipeline de Eventos no CRM

Estágios do deal de evento:

| Estágio | Quando | Interação Registrada |
|---------|--------|---------------------|
| `inscrito` | Ao criar inscrição | `event_registration` |
| `confirmado` | Ao confirmar presença via link | `event_presence_confirmed` |
| `participou` | Ao fazer check-in | `event_check_in` |

---

## 9. Fuso Horário

Todos os emails usam o fuso horário **America/Sao_Paulo** (Brasília) para formatação de datas e horários, garantindo consistência com a página do evento.

Função utilitária:
```typescript
const formatDateBrazil = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};
```

---

## 10. Timeline do Contato

Todas as interações são exibidas na timeline do contato em `/admin/crm/contatos`. A timeline mostra:

- **Ícone** específico para cada tipo de interação
- **Label** em português
- **Data e hora** da interação
- **Descrição** detalhada
- **Canal** de origem (email, website, admin, etc.)
- **Atividade associada** (nome do evento)

**Arquivo:** `src/components/admin/crm/ContactTimeline.tsx`
