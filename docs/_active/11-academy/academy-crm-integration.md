# MeC Academy - Integração CRM

## Pontos de Integração Automática

### 1. Cadastro como Aluno Gratuito

**Trigger**: Clique em "Quero ser aluno(a) gratuito(a)"

| Ação | Detalhes |
|---|---|
| Lead | `findOrCreateLead` (source: `academy`, source_detail: `cadastro_gratuito`) |
| Interação | `academy_free_signup` |
| Role | `student` adicionada via `enroll_as_free_student` RPC |

### 2. Assinatura Academy Paga (R$29,90/mês)

**Trigger**: Edge Function `create-academy-subscription`

| Ação | Detalhes |
|---|---|
| Lead | Criado/encontrado por email/CPF (source: `academy`, source_detail: `assinatura_paga`) |
| Interação | `academy_subscription` |
| Deal | Pipeline `planos`, stage `interesse`, value `29.90`, product_type `academy` |
| Role | `student` via `enroll_as_free_student` RPC |

### 3. Confirmação de Pagamento (Webhook)

**Trigger**: `asaas-webhook` com externalReference `academy_*`

| Ação | Detalhes |
|---|---|
| Subscription | Status atualizado para `active` |
| Deal | Atualizado para stage `won` |
| Interação | `academy_payment_confirmed` |
| Role | `student` garantida |

### 4. Cancelamento/Expiração de Assinatura

**Trigger**: Webhook `SUBSCRIPTION_DELETED` ou `SUBSCRIPTION_EXPIRED`

| Ação | Detalhes |
|---|---|
| Subscription | Status → `cancelled` ou `expired` |
| Interação | `academy_subscription_cancelled` |
| Role | `student` mantida (acesso a conteúdo gratuito continua) |

## Pipelines CRM

As assinaturas Academy são registradas no pipeline **Planos** com `product_type: 'academy'`. Os estágios seguem o fluxo padrão do pipeline:

```
interesse → contato → negociação → won/lost
```

## Benefícios nos Planos Existentes

Todos os planos de assinatura (Iniciante, Intermediário, Impulso) incluem o benefício **"Acesso ao MeC Academy"**, garantindo acesso total aos conteúdos para associadas e embaixadoras.
