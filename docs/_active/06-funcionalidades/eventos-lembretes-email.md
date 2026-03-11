# Lembretes de Email para Eventos

## Visão Geral

O sistema envia lembretes automáticos por e-mail para participantes de eventos em três momentos:
- **3 dias antes** do evento
- **1 dia antes** (amanhã)
- **2 horas antes** do evento

## Edge Function

**Arquivo**: `supabase/functions/event-email-scheduler/index.ts`

### Actions

| Action | Parâmetro | Descrição |
|--------|-----------|-----------|
| `reminder_3d` | `{ action: 'reminder_3d' }` | Lembretes para eventos em 3 dias |
| `reminder_tomorrow` | `{ action: 'reminder_tomorrow' }` (default) | Lembretes para eventos amanhã |
| `reminder_2h` | `{ action: 'reminder_2h' }` | Lembretes para eventos em 2 horas |

### Campos de Controle

Na tabela `event_registrations`:
- `reminder_3d_sent_at` — timestamp do envio do lembrete de 3 dias
- `reminder_1d_sent_at` — timestamp do envio do lembrete de 1 dia
- `reminder_2h_sent_at` — timestamp do envio do lembrete de 2 horas

### Regras
- Lembretes de 3 dias e 1 dia são enviados para **todos** os inscritos (`confirmed` ou `pending`)
- Lembrete de 2 horas é enviado apenas para participantes com **presença confirmada** (`presence_confirmed_at IS NOT NULL`)
- Cada lembrete é enviado uma única vez (verificado pelo campo `*_sent_at`)
- Cada envio registra uma interação no CRM (`crm_interactions`)

## Templates

Os templates seguem a identidade visual MeC:
- Gradiente roxo/dourado no cabeçalho
- Logo MeC centralizada
- Bloco de informações do evento (data, horário, formato, local)
- Botão CTA para acesso ao evento (quando `location_url` disponível)
- Mensagens diferenciadas por tipo de lembrete (antecipação → urgência)

## Cron Jobs Necessários

Para ativar os lembretes automáticos, executar no SQL Editor do Supabase:

```sql
-- Lembrete de 3 dias (diário às 8h)
SELECT cron.schedule(
  'event-reminder-3d',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/event-email-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{"action": "reminder_3d"}'::jsonb
  );
  $$
);

-- Lembrete de 1 dia (diário às 8h)
SELECT cron.schedule(
  'event-reminder-1d',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/event-email-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{"action": "reminder_tomorrow"}'::jsonb
  );
  $$
);
```

> O lembrete de 2 horas já deve estar configurado. Caso não esteja, adicionar cron a cada hora.
