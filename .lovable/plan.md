# Aplicação de Cupons no Formulário de Inscrição em Eventos

## Diagnóstico

Hoje existe a ferramenta `/admin/crm/cupons` que cria registros em `event_coupons`, e o backend já expõe os RPCs `validate_coupon` e `apply_coupon` (usados no hook `useEventCoupons`). O que falta é o **ponto de uso público**: o formulário em `src/pages/EventDetailPage.tsx` chama `create-event-payment` sem nenhum campo de cupom, e a edge function ignora qualquer desconto. Resultado: cupons são criados mas nunca aplicáveis.

## Caminho correto (a ser implementado)

O cupom deve ser aplicado **no próprio formulário de inscrição do evento** (página pública `/eventos/:slug`), antes do redirecionamento para o checkout Asaas. Fluxo:

```text
[Usuário preenche dados]
        ↓
[Digita código + clica "Aplicar"]
        ↓
[Frontend chama validate_coupon RPC] → mostra desconto e valor final
        ↓
[Submit] → create-event-payment recebe coupon_id + valor com desconto
        ↓
[Edge function cria cobrança Asaas no valor com desconto]
        ↓
[apply_coupon registra uso em coupon_usage e incrementa current_uses]
```

## Mudanças

### 1. Frontend — `src/pages/EventDetailPage.tsx`
- Novo bloco "Cupom de desconto" visível apenas quando `!event.free && event.price > 0`.
- Campo `Input` para o código + botão "Aplicar" + botão "Remover".
- Estado local: `couponCode`, `appliedCoupon` (id, discount, final_amount, discount_type, discount_value), `couponError`.
- Ao clicar "Aplicar": chamar `useValidateCoupon` (já existente) com `code`, `eventId=event.id`, `email`, `amount=event.price`. Exibir badge verde com desconto aplicado e novo total, ou mensagem de erro PT-BR.
- Exibir resumo: "Valor original: R$ X • Desconto: -R$ Y • Total: R$ Z".
- No submit, enviar `coupon_id` e `discount_amount` no payload para `create-event-payment`.

### 2. Edge function — `supabase/functions/create-event-payment/index.ts`
- Aceitar `coupon_id` e `discount_amount` opcionais no body.
- Se presentes: revalidar o cupom server-side via `validate_coupon` RPC (segurança — nunca confiar no valor enviado pelo cliente), recalcular `final_amount`.
- Usar `final_amount` (em vez de `event.price`) no `paymentPayload.value` enviado ao Asaas.
- Salvar `coupon_id` e `discount_amount` em `event_registrations.metadata` (ou colunas dedicadas se já existirem — verificar schema).
- Após criar a cobrança Asaas com sucesso, chamar `apply_coupon` RPC para registrar uso em `coupon_usage` e incrementar `current_uses`.
- Em caso de rollback (falha no Asaas), não chamar `apply_coupon`.

### 3. Documentação
- Atualizar `docs/_active/07-crm/eventos-publicos.md` adicionando seção "Cupons de desconto" explicando o fluxo público + admin.

## Escopo / fora de escopo

- ✅ Apenas eventos pagos (`event.free === false && event.price > 0`).
- ✅ Mantém compatibilidade: inscrições sem cupom continuam funcionando idênticas.
- ❌ Não altera a UI de criação de cupons em `/admin/crm/cupons` (já funcional).
- ❌ Não altera o webhook Asaas — `apply_coupon` é chamado no momento da criação da cobrança (consistente com `current_uses` representando reservas/uso pendente; isso já é o comportamento do RPC existente).

## Verificação

- Criar cupom 10% no admin, abrir evento pago, aplicar código → ver desconto refletido no resumo.
- Confirmar que o checkout Asaas abre com o valor descontado.
- Conferir `coupon_usage` populado e `current_uses` incrementado.
- Testar códigos inválidos, expirados, e abaixo do `min_purchase` (mensagens corretas).
