# 28 — Histórico financeiro do Asaas

Traz para o portal novo todas as cobranças passadas que pertencem ao Portal MeC,
preservando datas, valores e situação originais. A conta do Asaas é compartilhada
com a Escola MeC, então a importação é seletiva.

---

## Parte 1 — Técnica

**Função:** `supabase/functions/importar-historico-asaas/index.ts`
**Acesso:** `requireAdminOrCron` (JWT de administradora, service role ou `x-cron-secret`).
**Config:** `[functions.importar-historico-asaas] verify_jwt = false` (validação no código).

### Fluxo

1. `GET /v3/subscriptions` (paginado). Uma assinatura é do portal quando
   `externalReference` começa com `plano:` **ou** a descrição casa com
   `TEXTO_PORTAL` e não casa com `TEXTO_FORA`.
2. Para cada assinatura do portal: `GET /v3/subscriptions/{id}/payments`.
3. `GET /v3/payments` (toda a conta) e filtro `ehDoPortal()`:
   referência `plano:|evento:|pessoa:`, assinatura do portal, ou descrição
   compatível. Deduplicação por `payment.id` em um `Map`.
4. Classificação por produto: `plano:<slug>` → `planos.id`; senão casamento do
   nome do plano dentro da descrição.
5. Identificação da pessoa: `GET /v3/customers/{id}` (com cache) → CPF em
   `pessoas.cpf` → e-mail em `pessoa_contatos`. Sem correspondência e com
   `criarPessoas` ativo, cria `pessoas` + contato de e-mail.
6. `upsert` em `public.pagamentos` com `onConflict: 'provedor,cobranca_externa_id'`,
   gravando `criado_em` = `dateCreated` do Asaas e `confirmado_em` = `paymentDate`.

### Mapa de situação

| Status Asaas | `pagamento_situacao` |
|---|---|
| RECEIVED, CONFIRMED, RECEIVED_IN_CASH | `confirmado` |
| REFUNDED, REFUND_REQUESTED, CHARGEBACK_* | `estornado` |
| DELETED, CANCELED | `cancelado` |
| PENDING, OVERDUE, demais | `pendente` |

### Travas

- Não chama `conceder_por_pagamento` nem toca em `concessoes_acesso`.
- Não chama nenhuma função de e-mail.
- Idempotente: repetir a importação atualiza as mesmas linhas.
- Paginação com trava em 5.000 registros por listagem.

### Parâmetros do corpo

```json
{ "simular": true, "criarPessoas": false }
```

`simular` conta sem gravar. `criarPessoas: false` registra o pagamento sem
pessoa vinculada quando não há correspondência.

### Resposta

```json
{
  "assinaturasNoAsaas": 17,
  "assinaturasDoPortal": 16,
  "cobrancasDoPortal": 71,
  "gravados": 71,
  "semPessoaIdentificada": 0,
  "totalConfirmadoCentavos": 246988,
  "falhas": []
}
```

---

## Parte 2 — Operacional

1. Painel da equipe → **Automações**.
2. Botão **Importar histórico financeiro**.
3. O aviso de conclusão informa quantas cobranças entraram e o total confirmado.
4. Conferir em **Painel → Financeiro**: os totais passam a incluir todo o
   histórico desde 2025.

Quando rodar de novo: a importação pode ser repetida sem risco — ela atualiza
as mesmas cobranças em vez de duplicar. Use quando quiser atualizar faturas que
mudaram de situação no Asaas (pagas, estornadas, canceladas).

Se aparecer "Sua sessão expirou": saia e entre novamente no portal.

**O que esta rotina não faz:** não libera acessos e não envia e-mail nenhum para
as associadas. Liberação de acesso continua acontecendo só pelo aviso de
pagamento em tempo real ou pelo botão "Buscar pagamentos no Asaas".

---

## Parte 3 — Manual simples

O que o botão faz, em palavras comuns:

Sua conta do Asaas é usada por dois negócios: a Escola e o Portal. O botão
**Importar histórico financeiro** entra no Asaas, separa as cobranças que são do
Portal (assinaturas dos planos, ingressos de encontros) e copia o histórico delas
para dentro do site.

Depois disso, a tela de Financeiro passa a mostrar quanto o Portal arrecadou mês
a mês desde o começo, e cada associada passa a ter o extrato de pagamentos dela.

Três garantias importantes:

- **Ninguém recebe e-mail.** Nenhuma associada é avisada de cobranças antigas.
- **Nada de acesso muda.** Quem tem acesso continua com acesso; quem não tem,
  continua sem.
- **Pode clicar mais de uma vez.** Não duplica nada.

As cobranças da Escola continuam normalmente no Asaas — elas só não aparecem no
site.
