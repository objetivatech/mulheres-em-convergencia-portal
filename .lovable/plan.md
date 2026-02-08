
# Módulo de Embaixadoras - Plano de Implementação Completo

## Análise do Sistema Atual

### Estruturas Existentes Encontradas
Após análise do codebase, identifiquei que **já existem várias estruturas preparadas** para o módulo de embaixadoras:

| Elemento | Status | Observação |
|----------|--------|------------|
| Tabela `ambassadors` | ✅ Existe | Com `referral_code`, `commission_rate` (15%), `total_earnings`, `total_sales`, `link_clicks` |
| Tabela `transactions` | ✅ Existe | Com `ambassador_id`, `commission_amount` |
| Role `ambassador` | ✅ Existe | No enum `app_role` e em `user_roles` |
| Função `get_ambassador_by_referral` | ✅ Existe | RPC para buscar embaixadora pelo código |
| Função `track_referral_click` | ✅ Existe | RPC para rastrear cliques |
| Dashboard placeholder | ✅ Existe | Em `UserDashboard.tsx` com links "Coming soon" |
| Integração CRM | ✅ Existe | Pipeline de vendas e leads configurados |
| Integração Asaas | ✅ Existe | Webhook completo processando pagamentos |

### O Que Precisa Ser Implementado
1. **Rastreamento de referral** nos fluxos de assinatura
2. **Dashboard funcional** para embaixadoras
3. **Landing Page** de cadastro com código de embaixadora
4. **Sistema de comissões** com ciclo mensal
5. **Relatórios administrativos** para gestão
6. **Documentação e FAQ** para embaixadoras

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO COMPLETO DE INDICAÇÃO                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Embaixadora │ -> │ Link Único   │ -> │ Visitante    │ -> │ Landing Page │
│  gera link   │    │ c/ código    │    │ clica        │    │ de Indicação │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                         ┌──────────────────────────────────────────┘
                         ▼
              ┌──────────────────────┐
              │ Cookie de Rastreio   │
              │ (30 dias, 1º clique) │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐    ┌──────────────────────┐
              │ Cadastro + Assinatura│ -> │ Pagamento Asaas      │
              │ (com referral_code)  │    │ (externalReference)  │
              └──────────────────────┘    └──────────────────────┘
                                                    │
                         ┌──────────────────────────┘
                         ▼
              ┌──────────────────────┐    ┌──────────────────────┐
              │ Webhook Confirma     │ -> │ Comissão Calculada   │
              │ Pagamento            │    │ (15% sobre valor)    │
              └──────────────────────┘    └──────────────────────┘
                                                    │
                         ┌──────────────────────────┘
                         ▼
              ┌──────────────────────┐    ┌──────────────────────┐
              │ ambassador_referrals │ -> │ ambassador_payouts   │
              │ (registro vendas)    │    │ (ciclo mensal)       │
              └──────────────────────┘    └──────────────────────┘
```

---

## FASE 1: Banco de Dados (Novas Tabelas)

### 1.1 Tabela `ambassador_referral_clicks`
Registro de cliques nos links de indicação:

```sql
CREATE TABLE ambassador_referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Tabela `ambassador_referrals`
Registro de indicações convertidas:

```sql
CREATE TABLE ambassador_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  sale_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  commission_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid, cancelled
  payment_confirmed_at TIMESTAMPTZ,
  payout_id UUID REFERENCES ambassador_payouts(id),
  payout_eligible_date DATE, -- dia 20 do mês para pagamento dia 10 seguinte
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Tabela `ambassador_payouts`
Registro de pagamentos de comissões:

```sql
CREATE TABLE ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE,
  reference_period TEXT NOT NULL, -- '2026-01' (YYYY-MM)
  total_sales INTEGER NOT NULL DEFAULT 0,
  gross_amount NUMERIC(10,2) NOT NULL,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  payment_method TEXT, -- pix, bank_transfer
  payment_details JSONB, -- dados de pagamento
  scheduled_date DATE NOT NULL, -- dia 10 do mês seguinte
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Atualização da Tabela `ambassadors`
Adicionar campos úteis:

```sql
ALTER TABLE ambassadors 
ADD COLUMN pix_key TEXT,
ADD COLUMN bank_data JSONB,
ADD COLUMN payment_preference TEXT DEFAULT 'pix',
ADD COLUMN minimum_payout NUMERIC(10,2) DEFAULT 50.00,
ADD COLUMN pending_commission NUMERIC(10,2) DEFAULT 0,
ADD COLUMN next_payout_date DATE;
```

### 1.5 Adicionar `referral_code` em `user_subscriptions`
Para rastrear origem:

```sql
ALTER TABLE user_subscriptions 
ADD COLUMN referral_code TEXT,
ADD COLUMN ambassador_id UUID REFERENCES ambassadors(id);
```

---

## FASE 2: Rastreamento e Atribuição

### 2.1 Hook `useReferralTracking`
Gerenciamento de cookies e atribuição:

```typescript
// src/hooks/useReferralTracking.ts
export const useReferralTracking = () => {
  const COOKIE_NAME = 'mec_referral';
  const COOKIE_DAYS = 30;
  
  // Salvar código no cookie (first-click attribution)
  const setReferralCode = (code: string) => {
    if (getReferralCode()) return; // Já existe, não sobrescreve
    const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
    document.cookie = `${COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/`;
  };
  
  // Recuperar código do cookie
  const getReferralCode = (): string | null => {
    const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
  };
  
  // Limpar após conversão
  const clearReferralCode = () => {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  };
  
  // Rastrear clique
  const trackClick = async (code: string) => {
    await supabase.rpc('track_referral_click', { referral_code: code });
    setReferralCode(code);
  };
  
  return { setReferralCode, getReferralCode, clearReferralCode, trackClick };
};
```

### 2.2 Atualização do `create-subscription`
Adicionar suporte a referral:

```typescript
// Receber referral_code no body
const { referral_code } = body;

// Buscar embaixadora pelo código
let ambassadorId = null;
if (referral_code) {
  const { data: ambassador } = await supabaseServiceClient
    .rpc('get_ambassador_by_referral', { referral_code });
  
  if (ambassador && ambassador.active) {
    ambassadorId = ambassador.id;
  }
}

// Ao criar assinatura, incluir referral
await supabaseServiceClient
  .from('user_subscriptions')
  .update({
    referral_code,
    ambassador_id: ambassadorId
  })
  .eq('id', subscriptionId);
```

### 2.3 Atualização do `asaas-webhook`
Processar comissão ao confirmar pagamento:

```typescript
// Após confirmar pagamento de assinatura
if (subscription.ambassador_id) {
  const commissionRate = 0.15; // 15%
  const commissionAmount = payment.value * commissionRate;
  
  // Calcular data de elegibilidade (vendas até dia 20 = pago dia 10 seguinte)
  const paymentDate = new Date();
  const cutoffDay = 20;
  let eligibleDate;
  
  if (paymentDate.getDate() <= cutoffDay) {
    // Pago no mês seguinte
    eligibleDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 10);
  } else {
    // Pago em dois meses
    eligibleDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 2, 10);
  }
  
  // Criar registro de referral
  await supabaseClient
    .from('ambassador_referrals')
    .insert({
      ambassador_id: subscription.ambassador_id,
      referred_user_id: subscription.user_id,
      subscription_id: subscription.id,
      plan_name: plan.display_name,
      sale_amount: payment.value,
      commission_rate: commissionRate * 100,
      commission_amount: commissionAmount,
      status: 'confirmed',
      payment_confirmed_at: new Date().toISOString(),
      payout_eligible_date: eligibleDate.toISOString().split('T')[0]
    });
  
  // Atualizar totais da embaixadora
  await supabaseClient.rpc('update_ambassador_totals', {
    p_ambassador_id: subscription.ambassador_id,
    p_sale_amount: payment.value,
    p_commission_amount: commissionAmount
  });
}
```

---

## FASE 3: Landing Page de Indicação

### 3.1 Página `/convite/[codigo]`
Rota dinâmica para links de indicação:

**Componentes:**
- Hero com benefícios de ser assinante
- Seção de vantagens do Mulheres em Convergência
- Depoimentos de associadas
- Tabela de planos
- Formulário de cadastro integrado
- Badge "Indicada por [Nome da Embaixadora]"

**Funcionalidades:**
- Detectar código de referral da URL
- Chamar `track_referral_click` ao carregar
- Salvar código em cookie (30 dias)
- Pré-selecionar plano se informado na URL
- Fluxo de cadastro + assinatura integrado

### 3.2 Página `/planos` Atualizada
Verificar cookie de referral e incluir na assinatura:

```typescript
// Em Planos.tsx
const { getReferralCode } = useReferralTracking();

const handleSubscribe = async (...) => {
  const referralCode = getReferralCode();
  
  await supabase.functions.invoke('create-subscription', {
    body: {
      plan_id,
      billing_cycle,
      referral_code: referralCode, // NOVO
      ...
    }
  });
};
```

---

## FASE 4: Dashboard da Embaixadora

### 4.1 Estrutura de Páginas

```
/embaixadora                    # Dashboard principal
/embaixadora/indicacoes         # Lista de indicadas
/embaixadora/comissoes          # Histórico de comissões
/embaixadora/pagamentos         # Histórico e previsão de pagamentos
/embaixadora/materiais          # Links e materiais promocionais
/embaixadora/configuracoes      # Dados de pagamento
/embaixadora/faq                # Perguntas frequentes
```

### 4.2 Dashboard Principal (`/embaixadora`)

**Cards de Resumo:**
- Total de Indicadas (convertidas)
- Comissões do Mês Atual
- Próximo Pagamento (valor e data)
- Total Ganhos (histórico)

**Gráficos:**
- Indicações por mês (últimos 6 meses)
- Comissões por mês (últimos 6 meses)

**Link de Indicação:**
- Campo com link único copiável
- Botões de compartilhamento (WhatsApp, Email, Instagram)
- QR Code para download

**Últimas Indicações:**
- Lista das 5 últimas conversões

### 4.3 Página de Indicações (`/embaixadora/indicacoes`)

**Tabela com:**
- Nome da indicada
- Data de cadastro
- Plano assinado
- Valor da venda
- Comissão gerada
- Status (pendente, confirmada, paga)

**Filtros:**
- Por período
- Por status
- Por plano

### 4.4 Página de Comissões (`/embaixadora/comissoes`)

**Resumo do Ciclo Atual:**
- Período: "01/02/2026 - 20/02/2026"
- Vendas realizadas: X
- Total bruto: R$ X.XXX,XX
- Comissão (15%): R$ XXX,XX
- Previsão de pagamento: 10/03/2026

**Histórico:**
- Lista de ciclos anteriores
- Valor, data de pagamento, status

### 4.5 Página de Pagamentos (`/embaixadora/pagamentos`)

**Próximo Pagamento:**
- Valor previsto
- Data programada
- Vendas incluídas

**Histórico de Pagamentos:**
- Data
- Período de referência
- Valor
- Método de pagamento
- Status

### 4.6 Configurações (`/embaixadora/configuracoes`)

**Formulário:**
- Chave PIX (preferencial)
- Dados bancários (alternativo)
- Valor mínimo para saque (padrão R$ 50,00)

---

## FASE 5: Painel Administrativo

### 5.1 Nova Seção `/admin/embaixadoras`

**Visão Geral:**
- Total de embaixadoras ativas
- Total de vendas via indicação
- Total de comissões pagas
- Comissões pendentes

**Lista de Embaixadoras:**
- Nome
- Código de referral
- Indicações totais
- Comissões totais
- Status (ativa/inativa)
- Ações (ver detalhes, editar, desativar)

### 5.2 Detalhes da Embaixadora

**Informações:**
- Dados pessoais
- Histórico de indicações
- Histórico de pagamentos
- Editar comissão (se diferente de 15%)

### 5.3 Gestão de Pagamentos

**Ciclo Mensal:**
- Listar comissões pendentes agrupadas por embaixadora
- Botão para processar pagamentos em lote
- Marcar como pago individualmente

**Relatórios:**
- Exportar CSV de comissões por período
- Relatório de vendas por embaixadora

---

## FASE 6: FAQ e Materiais

### 6.1 Página FAQ (`/embaixadora/faq`)

**Seções:**
1. **Como funciona o programa?**
   - Explicação do modelo de comissões
   - Ciclo de pagamento

2. **Como gerar meu link de indicação?**
   - Passo a passo com capturas de tela

3. **Como acompanhar minhas indicações?**
   - Onde ver vendas e status

4. **Quando recebo minhas comissões?**
   - Regra do dia 20/10
   - Valor mínimo para saque

5. **Dicas para aumentar conversões**
   - Melhores práticas de divulgação
   - Como apresentar os benefícios

### 6.2 Materiais Promocionais

**Disponibilizar:**
- Banners em diferentes tamanhos
- Textos prontos para WhatsApp
- Templates para Instagram Stories
- Apresentação em PDF
- QR Code personalizado

---

## FASE 7: Integrações Existentes

### 7.1 CRM
- Registrar interação `referral_signup` ao criar assinatura via indicação
- Criar lead com `source: 'embaixadora'` e `source_detail: [nome da embaixadora]`
- Atualizar milestone `became_ambassador_referral`

### 7.2 Relatórios Admin
- Adicionar filtro "Via Embaixadora" na lista de usuários
- Adicionar coluna "Indicada por" onde aplicável
- Dashboard de métricas de embaixadoras

---

## Cronograma de Implementação

| Fase | Descrição | Prioridade | Estimativa |
|------|-----------|------------|------------|
| 1 | Migração de banco de dados | Alta | 1 iteração |
| 2 | Rastreamento e atribuição | Alta | 1-2 iterações |
| 3 | Landing Page de indicação | Alta | 1 iteração |
| 4 | Dashboard da embaixadora | Alta | 2-3 iterações |
| 5 | Painel administrativo | Média | 1-2 iterações |
| 6 | FAQ e materiais | Média | 1 iteração |
| 7 | Integrações CRM | Média | 1 iteração |

---

## Melhorias Sugeridas

### 1. Níveis de Comissão
Implementar sistema de níveis baseado em performance:
- Bronze (0-5 vendas): 15%
- Prata (6-15 vendas): 17%
- Ouro (16+ vendas): 20%

### 2. Comissão Recorrente
Opção de comissão recorrente para renovações:
- 15% na primeira venda
- 5% nas renovações (durante 12 meses)

### 3. Indicação de Indicação (2º Nível)
Comissão de 3% sobre vendas de embaixadoras indicadas pela embaixadora original.

### 4. Dashboard em Tempo Real
WebSocket para atualização instantânea quando uma indicada converte.

### 5. Notificações
- Email/WhatsApp quando indicada se cadastra
- Email/WhatsApp quando pagamento é processado
- Resumo semanal de performance

### 6. Gamificação
- Badges por metas alcançadas
- Ranking mensal de embaixadoras
- Prêmios por performance

---

## Documentação a Ser Criada

1. `docs/_active/10-embaixadoras/README.md` - Visão geral do módulo
2. `docs/_active/10-embaixadoras/arquitetura.md` - Estrutura técnica
3. `docs/_active/10-embaixadoras/fluxo-comissoes.md` - Regras de comissão
4. `docs/_active/10-embaixadoras/guia-admin.md` - Gestão de embaixadoras
5. `docs/_active/10-embaixadoras/guia-embaixadora.md` - Manual para embaixadoras

---

## Considerações de Segurança

1. **RLS Policies**: Embaixadoras só veem seus próprios dados
2. **Validação de Códigos**: Códigos únicos e não previsíveis
3. **Auditoria**: Log de todas as ações administrativas
4. **Anti-fraude**: Detecção de auto-indicação e padrões suspeitos

---

## Próximos Passos

Confirme se deseja que eu inicie a implementação começando pela **Fase 1 (Banco de Dados)** e **Fase 2 (Rastreamento)**, que são a base para todo o módulo funcionar corretamente.
