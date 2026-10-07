# Liberação de acessos pelo Asaas

## Técnico
Regra única em `supabase/functions/_shared/acessos-asaas.ts`, usada por `asaas-webhook` (tempo real) e `diagnostico-asaas` acao `regularizar`.
1. Identificação: CPF → `pessoa:<uuid>` → pagamento anterior do cliente → e-mail → API Asaas `/customers/{id}` (cria pessoa por CPF se necessário).
2. Plano: `plano:slug` → `pagamentos.plano_id` → descrição → valor ±15% → fallback 4 módulos.
3. Efeitos: `conceder_por_pagamento` por módulo (idempotente) + papéis `assinante`/`dona_negocio`. Embaixadora nunca por plano.
`visao_associada(uuid)` — security definer, barrada por `e_admin()`.

## Operação (equipe)
- Pagou e não liberou: Painel → Automações → **Conciliar acessos das assinantes**. Pode clicar quantas vezes quiser; não duplica.
- Dúvida sobre uma associada: Pessoas → Abrir ficha → **Ver como associada**. Mostra cada área (liberada/bloqueada, até quando) e o que pode estar travando.

## Manual simples (associada)
Assinou um plano? As áreas abrem sozinhas após o pagamento ser confirmado. Entre no site com o mesmo e-mail ou CPF usado no pagamento.
