# 25 — Conferência de pagamentos, acessos e segurança

Atualizado: 16/09/2026 · Banco novo `tysvpeprhokdijquprkd` (MeC-v6)

## 1. Situação conferida no banco novo

| Item | Quantidade |
|---|---|
| Pessoas | 42 |
| Administradoras | 2 |
| Planos ativos | 9 |
| Eventos | 28 |
| Liberações de acesso | 6 (4 importadas, 2 cortesia) |
| Pagamentos registrados | 0 |
| Avisos do Asaas recebidos | 0 |

Leitura: o portal novo ainda **não recebeu nenhum aviso de pagamento do Asaas**.
Enquanto `webhooks_recebidos` estiver zerado, nenhuma renovação libera acesso sozinha.

## 2. Como verificar a conexão com o Asaas

Painel de conteúdo → **Automações** → botão **Verificar conexão com o Asaas**.

A verificação consulta a conta do Asaas e mostra:
- o endereço que o portal novo espera receber:
  `https://tysvpeprhokdijquprkd.supabase.co/functions/v1/asaas-webhook`;
- todos os endereços de aviso cadastrados no Asaas e se estão ligados.

Se o resultado disser que o Asaas **ainda não aponta para o portal novo**, corrija no
painel do Asaas (Integrações → Webhooks): endereço acima, token igual ao
`ASAAS_WEBHOOK_TOKEN`, eventos de cobrança (criada, confirmada, recebida, vencida, estornada).

## 3. Teste de ponta a ponta recomendado

1. Entrar no portal com uma conta de teste.
2. Comprar o plano mais barato (ou um evento pago) e pagar por PIX.
3. Conferir em **Automações**: o aviso aparece em "Últimos avisos do Asaas" como processado.
4. Conferir em **Minha área → Planos**: o acesso aparece vigente.

Se o aviso não chegar, o problema é o endereço/token no Asaas, não o portal.

## 4. Correções aplicadas nesta rodada

- **Verificação de administradora nas funções**: o utilitário compartilhado ainda
  procurava papéis no formato do banco antigo, o que barrava ações administrativas
  (envio de arquivos, campanhas). Agora usa `pessoas` + `papeis` do banco novo.
- **Resumos protegidos**: linha do tempo, financeiro mensal e resumo de embaixadoras
  passaram a filtrar por dentro — administradora vê tudo, associada vê apenas o seu.
  Antes, qualquer conta autenticada conseguiria ler o financeiro geral.
- **Nova função `diagnostico-asaas`** (somente administradora), usada pelo botão acima.

## 5. Reversão

- `reboot/sql/0007_ajustes_seguranca.sql` só redefine views; reaplicar o trecho
  equivalente de `0006_area_associada_admin.sql` volta ao comportamento anterior.
- A função de diagnóstico é apenas de leitura e pode ser removida sem efeito.
