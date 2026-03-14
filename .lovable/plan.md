

# Plano de Correções: Sincronização Asaas, Desativação de Inadimplentes e Consistência entre Módulos

---

## Diagnóstico Detalhado

### Dados Reais Encontrados na Auditoria

**ENCANDEIE** (caso citado):
- `subscription_active = true` (visível no diretório)
- `subscription_expires_at = 2026-02-13` (expirou há 1 mês!)
- `subscription_renewal_date = NULL`
- `user_subscriptions.status = active`
- `user_subscriptions.expires_at = 2026-02-13`
- Roles do usuário: `business_owner, subscriber, community_member, ambassador, blog_editor`

### Problema 1 (CRÍTICO): Nenhum cron job de desativação/sincronização
Existem apenas 3 cron jobs no banco: `conecta-birthday-monthly`, `event-reminder-3d`, `event-reminder-1d`. **Não existe nenhum cron job para:**
- `renew-business-subscriptions` (que chama `deactivate_expired_businesses`)
- `sync-subscription-status`

Resultado: negócios inadimplentes nunca são desativados automaticamente.

### Problema 2: `deactivate_expired_businesses` não pega NULL
A função SQL verifica `subscription_renewal_date < CURRENT_DATE`, mas ENCANDEIE tem `subscription_renewal_date = NULL`, então o WHERE nunca corresponde. A função também deveria verificar `subscription_expires_at`.

### Problema 3: sync-subscription-status só processa pendentes
No modo normal (sem `force: true`), a função só busca assinaturas `pending` (linha 127). Assinaturas `active` que ficaram OVERDUE no Asaas nunca são verificadas automaticamente.

### Problema 4: Negócios desativados mas role `business_owner` nunca é removida
O webhook e a sync function nunca removem a role `business_owner` quando a assinatura é cancelada/expirada. O usuário mantém a tag "Associada" indefinidamente, mesmo inadimplente.

### Problema 5: Modal admin mostra dados inconsistentes
O modal compara `subscription` com `subscription_active` do negócio, mas não cruza datas de expiração. Se a assinatura existe no banco como `active` mas está expirada, o modal mostra dados contraditórios.

---

## Plano de Correções

### 1. SQL Migration: Corrigir `deactivate_expired_businesses`

Reescrever para cobrir todos os cenários de expiração:
```sql
-- Desativa negócios onde:
-- a) subscription_renewal_date não é NULL E está no passado
-- b) subscription_expires_at não é NULL E está no passado (e renewal_date é NULL)
-- c) NÃO são cortesia
-- Exclui negócios is_complimentary = true
```

### 2. SQL Migration: Criar função `sync_and_deactivate_businesses`

Nova função que combina verificação Asaas + desativação local + remoção de roles:
- Chama `deactivate_expired_businesses` para desativar negócios expirados
- Após desativar, verifica se o `owner_id` ainda possui algum negócio ativo
- Se não possuir, remove a role `business_owner` do `user_roles`
- Registra cada ação no CRM (`crm_interactions`)

### 3. Edge Function: Reescrever `sync-subscription-status`

Mudanças:
- **Modo padrão**: processar TODAS as assinaturas (não só `pending`) — remover o filtro da linha 127
- **Deactivação**: quando Asaas retornar OVERDUE/CANCELED, além de atualizar `user_subscriptions`, também:
  - Setar `businesses.subscription_active = false` para o `owner_id`
  - Remover role `business_owner` se não houver mais nenhum negócio ativo
  - Registrar no CRM
- **Verificação de expiração local**: mesmo sem consultar Asaas, verificar se `expires_at` já passou e desativar
- **Tolerância**: manter grace period de 5 dias após expiração antes de desativar (evitar desativação por atraso de 1 dia no Asaas)

### 4. Cron Jobs: Criar automações diárias

Dois cron jobs novos:
- `sync-subscriptions-daily`: executa `sync-subscription-status` com `{ force: true }` diariamente às 03:00 UTC
- `deactivate-expired-daily`: executa `renew-business-subscriptions` diariamente às 04:00 UTC (que já chama `deactivate_expired_businesses`)

### 5. Webhook: Adicionar tratamento de PAYMENT_OVERDUE

O `asaas-webhook` não processa eventos `PAYMENT_OVERDUE`. Adicionar handler para:
- Registrar no CRM que o pagamento está atrasado
- Enviar notificação por email ao usuário (via MailRelay)
- Após 2 ocorrências de OVERDUE consecutivas, iniciar processo de desativação

### 6. Frontend: Corrigir modal de detalhes do negócio

No `AdminBusinessManagement.tsx`:
- Exibir alerta quando `subscription_expires_at` está no passado mas `subscription_active = true` (inconsistência)
- Adicionar botão "Desativar manualmente" para forçar desativação
- Mostrar dias desde a expiração quando aplicável
- Na query de listagem, incluir assinaturas `cancelled` e `expired` (não só `active/pending`) para contexto completo

### 7. Gestão de Roles: Sincronização automática

Criar trigger ou função que, ao atualizar `businesses.subscription_active` para `false`:
- Verifica se o `owner_id` possui outros negócios ativos
- Se não, remove `business_owner` de `user_roles`
- Registra no activity log

### 8. Documentação

Atualizar/criar:
- `docs/_active/02-assinaturas/sync-asaas.md` — mecânica completa de sincronização
- `docs/_active/02-assinaturas/desativacao-inadimplentes.md` — fluxo de desativação
- Atualizar `docs/_active/02-assinaturas/subscriptions.md` com os cron jobs e a mecânica de roles

---

## Resumo de Impacto

| Componente | Problema | Correção |
|---|---|---|
| `deactivate_expired_businesses` | Ignora `renewal_date = NULL` | Verificar também `subscription_expires_at` |
| `sync-subscription-status` | Só processa `pending` | Processar todas as assinaturas |
| `sync-subscription-status` | Não desativa negócios | Desativar negócios + remover roles |
| Cron jobs | Nenhum existe | Criar 2 cron jobs diários |
| `asaas-webhook` | Ignora PAYMENT_OVERDUE | Processar e alertar |
| `user_roles` | `business_owner` nunca removida | Remover ao desativar último negócio |
| Modal admin | Dados inconsistentes | Alertas visuais + ação manual |
| Documentação | Desatualizada | Atualizar 3 documentos |

## Ordem de Execução

1. SQL Migration (funções corrigidas)
2. Cron jobs (ativação imediata)
3. Edge Function `sync-subscription-status` (reescrita)
4. Webhook `asaas-webhook` (PAYMENT_OVERDUE)
5. Frontend admin
6. Documentação

