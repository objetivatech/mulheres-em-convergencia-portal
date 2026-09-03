# 04 — Núcleo de Acesso: operação (documento operacional)

> Como operar o módulo no dia a dia: aplicar, testar, implantar functions,
> diagnosticar e reprocessar. Documento técnico conceitual: `02-nucleo-acesso.md`.
> Manual para leigo: `05-nucleo-acesso-manual.md`.

## 1. Aplicação inicial (feita em 03/09/2026)

1. SQL Editor do projeto novo (`tysvpeprhokdijquprkd`) → executar
   `reboot/sql/0001_nucleo_acesso.sql` inteiro. Idempotente.
2. Executar `reboot/tests/0001_aceitacao_nucleo_acesso.sql` inteiro.
   Esperado: 7 notices "TESTE n OK" + 1 "BÔNUS OK" e nenhum erro.

## 2. Implantação das edge functions (projeto novo)

Functions: `asaas-webhook` e `asaas-webhook-reprocessar`
(código em `reboot/functions/`).

1. Segredos (Dashboard → Edge Functions → Secrets):
   - `ASAAS_WEBHOOK_TOKEN` — o mesmo token configurado no painel do Asaas.
   - `ASAAS_API_KEY` — necessário nas fases seguintes.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` já
     existem por padrão em todo projeto.
2. Implantar via CLI apontando para o projeto novo:
   ```bash
   supabase functions deploy asaas-webhook --project-ref tysvpeprhokdijquprkd
   supabase functions deploy asaas-webhook-reprocessar --project-ref tysvpeprhokdijquprkd
   ```
3. **Não apontar o webhook do Asaas para o projeto novo até a Fase 7.**
   O webhook de produção continua indo para o projeto antigo.

## 3. Teste manual da function (antes do corte)

```bash
curl -X POST \
  "https://tysvpeprhokdijquprkd.supabase.co/functions/v1/asaas-webhook" \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: <ASAAS_WEBHOOK_TOKEN>" \
  -d '{
    "id": "evt_teste_manual_001",
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_teste_manual_001",
      "value": 97.00,
      "customerCpfCnpj": "<CPF de uma pessoa já cadastrada>",
      "description": "Assinatura mensal — teste",
      "paymentDate": "2026-09-03"
    }
  }'
```

Esperado: `{"ok":true,"pessoaId":"...","pagamentoId":"...","concessaoId":"..."}`.
Repetir a mesma chamada: `{"ok":true,"jaProcessado":true}` — prova de idempotência.

## 4. Diagnóstico rápido

| Sintoma | Onde olhar |
|---|---|
| Pagamento chegou mas ninguém tem acesso | `webhooks_recebidos` → coluna `erro`; botão reprocessar |
| Pagamento registrado sem pessoa | `pagamentos.pessoa_id is null` → conciliar pelo CPF da carga |
| Pessoa diz que pagou e não tem acesso | `situacao_acesso(pessoa, tipo)` + últimos pagamentos dela |
| Evento repetido | normal: Asaas reenvia; idempotência garante 1 pagamento/1 concessão |

Consultas úteis (SQL Editor):

```sql
-- pagamentos sem pessoa identificada (fila de conciliação)
select id, cobranca_externa_id, valor_centavos, confirmado_em, dados_brutos->>'customerCpfCnpj' as cpf
from public.pagamentos
where pessoa_id is null and situacao = 'confirmado'
order by confirmado_em desc;

-- webhooks com erro
select id, tipo_evento, recebido_em, erro
from public.webhooks_recebidos
where erro is not null
order by recebido_em desc;

-- situação de uma pessoa
select * from public.situacao_acesso('<uuid da pessoa>', 'diretorio');
```

## 5. Reprocessar um evento

Chamar `asaas-webhook-reprocessar` com JWT de uma administradora:

```bash
curl -X POST \
  "https://tysvpeprhokdijquprkd.supabase.co/functions/v1/asaas-webhook-reprocessar" \
  -H "Authorization: Bearer <jwt da admin>" \
  -H "Content-Type: application/json" \
  -d '{"webhookId": "<uuid em webhooks_recebidos>"}'
```

Como todas as peças são idempotentes, reprocessar nunca duplica.

## 6. Concessão manual (cortesia / administrativo)

```sql
insert into public.concessoes_acesso (pessoa_id, tipo, origem, fim_em, motivo)
values ('<uuid>', 'diretorio', 'cortesia', null, 'Motivo legível para auditoria');
```

Revogar (nunca apaga histórico):

```sql
update public.concessoes_acesso
set revogado_em = now(), revogado_motivo = 'Motivo'
where id = '<uuid da concessão>';
```
