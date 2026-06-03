## Contexto

A infraestrutura de lotes já existe parcialmente:

- Tabela `event_ticket_batches` (nome, preço, quantidade, `starts_at`, `ends_at`, `active`, `sold_count`, `display_order`) com RLS pública para eventos publicados.
- Trigger `sync_batch_sold_count` que ajusta `sold_count` quando `event_registrations.paid` muda.
- Coluna `event_registrations.batch_id` já existente.
- Painel admin `EventBatchesPanel` em `/admin/crm/eventos` (aba "Lotes") para criar/editar/remover lotes.
- Hooks `useEventBatches`, `useUpsertBatch`, `useDeleteBatch` em `useEvents.ts`.

**O que está faltando** (motivo do problema): a página pública `EventDetailPage.tsx` e a edge function `create-event-payment` ainda usam `event.price` diretamente — os lotes nunca são selecionados nem cobrados no fluxo do usuário final. Também não há cálculo automático do lote ativo (por data/quantidade) nem rótulo visível para o público.

Nada precisa mudar no schema; só fazer o frontend e o backend respeitarem os lotes.

## Escopo

### 1. Helper de seleção de lote ativo

Criar `src/lib/eventBatches.ts` com função pura `pickActiveBatch(batches, now)` que retorna o lote vendável:

- `active = true`
- janela atual: `starts_at IS NULL OR starts_at <= now` e `ends_at IS NULL OR ends_at >= now`
- ainda tem estoque: `quantity IS NULL OR sold_count < quantity`
- ordenado por `display_order ASC, price ASC`; pega o primeiro
- Também expor `getBatchStatus(batch, now)` → `'upcoming' | 'active' | 'ended' | 'sold_out' | 'inactive'` para UI.

### 2. EventDetailPage (público)

- Buscar lotes via `useEventBatches(event.id)`.
- Se existir ao menos um lote, **substituir** o preço base por:
  - Bloco "Lotes" listando todos os lotes (nome, preço, status, datas) — lote ativo destacado, futuros como "Em breve", encerrados/esgotados desabilitados.
  - Lote ativo selecionado automaticamente; usuário pode escolher manualmente entre lotes ativos quando houver mais de um simultâneo (caso raro, mas suportado).
- Se nenhum lote estiver vendável → desabilitar botão de inscrição com mensagem "Vendas encerradas / esgotado".
- Se o evento não tiver nenhum lote configurado → manter comportamento atual (`event.price`).
- Cupom continua aplicado sobre o valor do lote selecionado (já existente, só trocar a fonte do `amount`).
- Enviar `batch_id` no payload para `create-event-payment`.

### 3. Edge function `create-event-payment`

- Aceitar `batch_id` opcional no body.
- Carregar o lote do banco, **revalidar server-side** (status ativo, janela válida, estoque disponível) — nunca confiar no valor enviado pelo cliente.
- Usar `batch.price` como `event.price` na composição do `finalAmount` (cupom continua revalidado em cima desse valor).
- Persistir `batch_id` no `event_registrations` (coluna já existe).
- Em caso de lote inválido/esgotado, devolver erro 400 claro (`"Lote indisponível"`) para o frontend exibir.

### 4. Eventos gratuitos vs. pagos

- Se o evento tem lotes mas o lote ativo tem `price = 0` → tratar como gratuito (pula Asaas, mesma rota de inscrição grátis já existente). Atualizar `useEvents`/registro grátis para também aceitar `batch_id`.
- **Quero que seja possivel também criar um lote gratuito nos eventos, que possa ser oferecido junto com lotes pagos, por exemplo: até a data X a inscrição é gratuita (lote 01). Depois disso, passa para o lote 02 com valor de ingresso.**

### 5. Admin

Nenhuma mudança no painel admin de lotes (já cobre criação/edição/exclusão e janela de datas/quantidade). Adicionar apenas pequena indicação na listagem de eventos quando o evento tem lotes configurados (badge "Com lotes") — opcional, baixo esforço.

### 6. Documentação

Atualizar `docs/_active/07-crm/eventos-publicos.md` com seção "Lotes de ingresso": como criar, como o sistema escolhe o lote ativo, comportamento de esgotamento, interação com cupons.

## Detalhes técnicos

```text
EventDetailPage
  ├── useEventBatches(eventId)
  │     └── pickActiveBatch() → currentBatch
  ├── Bloco "Lotes" (lista visual)
  ├── Cupom usa currentBatch.price
  └── submit → create-event-payment { batch_id, coupon_code }

create-event-payment
  ├── valida event
  ├── se batch_id: SELECT batch; checa active/janela/estoque
  ├── basePrice = batch?.price ?? event.price
  ├── valida cupom em cima de basePrice
  ├── cria registration com batch_id, payment_amount=finalAmount
  └── trigger sync_batch_sold_count incrementa quando webhook marcar paid=true
```

Não é necessária migration: schema atual cobre tudo (inclusive `sold_count` automático via trigger existente).

## Arquivos afetados

- `src/lib/eventBatches.ts` (novo)
- `src/pages/EventDetailPage.tsx` (UI de lotes + envio de `batch_id`)
- `supabase/functions/create-event-payment/index.ts` (revalidação e uso de `batch.price`)
- `src/hooks/useEvents.ts` (inscrição gratuita aceitar `batch_id`, se aplicável)
- `docs/_active/07-crm/eventos-publicos.md` (documentação)

## Fora de escopo

- Mudanças no admin além do badge opcional.
- Novas migrations.
- Mudanças no fluxo de cupons (mantido como hoje, só passa a usar o valor do lote como base).
- Webhook Asaas (já consome `paid` que dispara o trigger de `sold_count`).