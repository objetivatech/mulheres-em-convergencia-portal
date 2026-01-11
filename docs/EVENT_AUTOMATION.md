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

**Arquivo:** `src/hooks/useEvents.ts` → `useCheckIn()`

### Remoção de Participante

Para liberar vaga no evento:
1. O botão "Remover" (ícone UserMinus) está disponível na tabela de inscritos
2. Ao remover:
   - O deal associado no CRM é **deletado**
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
   [5 dias antes] → Email 1: "Confirme sua presença"
        ↓ (se não confirmou)
   [3 dias antes] → Email 2: "Aguardamos sua confirmação"
        ↓ (se não confirmou)
   [1 dia antes] → Email 3: "Última chamada"
        ↓
   [Ao confirmar] → Email de Boas-vindas + Deal → "confirmado"
        ↓
   [2h antes] → Email lembrete (apenas para confirmados)
        ↓
   [Check-in] → Deal → "participou"
```

---

## 3. Edge Functions

### confirm-event-presence

**Propósito:** Processar confirmações de presença via link no email.

**Endpoint:** `POST /confirm-event-presence?token=<TOKEN>`

**Ações:**
1. Valida o token de confirmação
2. Atualiza `presence_confirmed_at` na inscrição
3. Atualiza deal no CRM para estágio "confirmado"
4. Envia email de boas-vindas

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
- **5 dias antes:** Envia email 1 para quem não recebeu ainda
- **3 dias antes:** Envia email 2 para quem recebeu email 1 mas não confirmou
- **1 dia antes:** Envia email 3 para quem recebeu email 2 mas não confirmou

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
- `action: "reminder_2h"` - Lembrete 2 horas antes (apenas para confirmados)

**Deve ser executado:** A cada hora (para lembretes de 2h)

---

## 4. Página de Confirmação

**Rota:** `/confirmar-presenca?token=<TOKEN>`

**Arquivo:** `src/pages/EventConfirmPresencePage.tsx`

**Estados:**
1. **Carregando:** Spinner enquanto processa
2. **Sucesso:** Mostra mensagem de confirmação, detalhes do evento
3. **Já confirmado:** Informa que a presença já foi confirmada
4. **Erro:** Mostra mensagem de erro com link para contato

---

## 5. Configuração de Cron Jobs

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

## 6. Variáveis de Ambiente Necessárias

| Variável | Descrição |
|----------|-----------|
| `MAILRELAY_API_KEY` | Chave de API do Mailrelay |
| `MAILRELAY_HOST` | Host do Mailrelay (ex: app.mailrelay.com) |
| `ADMIN_EMAIL_FROM` | Email remetente (ex: contato@mulheresemconvergencia.com.br) |
| `PRODUCTION_DOMAIN` | Domínio de produção para links (ex: https://mulheresemconvergencia.com.br) |

---

## 7. Pipeline de Eventos no CRM

Estágios do deal de evento:

| Estágio | Quando |
|---------|--------|
| `inscrito` | Ao criar inscrição |
| `confirmado` | Ao confirmar presença via link |
| `participou` | Ao fazer check-in |

---

## 8. Fuso Horário

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
