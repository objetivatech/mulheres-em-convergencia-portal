# Pasta `reboot/` — código destinado ao projeto NOVO

Nada aqui é aplicado nem implantado automaticamente. O conteúdo desta pasta
tem como destino o projeto Supabase novo (`tysvpeprhokdijquprkd`) e é aplicado
manualmente enquanto o portal atual segue no ar.

> Atenção: **não mover** para `supabase/migrations/` nem `supabase/functions/`.
> Essas pastas apontam para o projeto antigo, que está em produção.

## Como aplicar (Etapa B)

1. **Migration** — abrir o SQL Editor do projeto novo e executar
   `reboot/sql/0001_nucleo_acesso.sql` inteiro. É idempotente: pode rodar de novo.
2. **Segredos** do projeto novo (Edge Functions → Secrets):
   - `ASAAS_WEBHOOK_TOKEN` — o mesmo token configurado no painel do Asaas
   - `ASAAS_API_KEY` — usado nas fases seguintes
3. **Edge functions** — implantar `asaas-webhook` e `asaas-webhook-reprocessar`
   no projeto novo (Supabase CLI ou painel). O webhook do Asaas só é apontado
   para lá na Fase 7 (corte); até então roda em paralelo, em modo de teste.

## Peças do webhook

| Arquivo | Responsabilidade |
|---|---|
| `asaas-webhook/index.ts` | receber, validar token, registrar de forma idempotente, devolver 200 |
| `asaas-webhook/identificar-pessoa.ts` | CPF → referência → cliente Asaas → e-mail |
| `asaas-webhook/registrar-pagamento.ts` | grava o fato financeiro |
| `asaas-webhook/conceder-acesso.ts` | cria a concessão pelo tipo de cobrança |
| `asaas-webhook/efeitos.ts` | comissão, e-mail, CRM — falha aqui não afeta o acesso |
| `asaas-webhook-reprocessar/index.ts` | rodar de novo um evento recebido (admin) |

## O que a migration cria

`pessoas`, `pessoa_contatos`, `papeis`, `pagamentos`, `concessoes_acesso`,
`webhooks_recebidos`, mais as funções `pessoa_atual`, `tem_papel`, `e_admin`,
`acesso_vigente`, `tenho_acesso`, `situacao_acesso`, `conceder_por_pagamento`
e a visão `v_acesso_operacao`.

Toda tabela nasce com `GRANT` + RLS. `webhooks_recebidos` não é legível por
cliente algum — só por `service_role`.
