# Sistema de Renovação de 31 Dias para Perfis de Negócios

## Visão Geral

Este documento descreve o sistema de renovação automática de 31 dias implementado para os perfis de negócios no Portal Mulheres em Convergência. O sistema garante que os perfis de empresas permaneçam ativos por exatos 31 dias após cada pagamento confirmado, independentemente do ciclo de cobrança escolhido (mensal ou anual).

## Funcionalidades Principais

### 1. Renovação Automática de 31 Dias

**Regra Fundamental**: Todos os perfis de negócios têm validade de exatamente **31 dias** a partir da confirmação de cada pagamento, independentemente do plano contratado.

- **Pagamento Mensal**: Perfil ativo por 31 dias, renovação automática a cada confirmação de pagamento
- **Pagamento Anual**: Perfil ativo por 31 dias, renovação automática a cada 31 dias durante todo o período pago

### 2. Período de Graciosidade

- **Garantia**: Uma vez confirmado o pagamento, o perfil permanece ativo por 31 dias completos
- **Cancelamento**: Se o cliente cancelar durante o período de 31 dias, o perfil continua ativo até o fim do período pago
- **Não-renovação**: Apenas após o término dos 31 dias o perfil se torna inativo

## Implementação Técnica

### Estrutura do Banco de Dados

#### Campos Adicionados na Tabela `businesses`

```sql
-- Campos para controle de renovação
ALTER TABLE businesses 
ADD COLUMN subscription_renewal_date DATE,      -- Data da próxima renovação (31 dias)
ADD COLUMN last_payment_date DATE,             -- Data do último pagamento confirmado  
ADD COLUMN grace_period_end DATE;              -- Data final do período de graciosidade
```

### Funções do Banco de Dados

#### 1. `renew_business_subscription(business_uuid)`

Renova uma assinatura de negócio por mais 31 dias:

```sql
-- Calcula nova data de renovação (31 dias a partir de hoje)
-- Atualiza campos de controle de renovação
-- Ativa o perfil do negócio
-- Retorna success/failure
```

#### 2. `deactivate_expired_businesses()`

Processo automático para desativar perfis expirados:

```sql  
-- Verifica perfis com renewal_date < hoje
-- Desativa perfis expirados
-- Retorna quantidade de perfis desativados
```

#### 3. `process_subscription_payment(user_id, payment_id, amount)`

Processa pagamentos e renova automaticamente todos os negócios do usuário:

```sql
-- Ativa assinatura se estava pendente
-- Renova TODOS os negócios do usuário por 31 dias
-- Registra log de atividade
-- Retorna resultado da operação
```

### Edge Functions

#### 1. `asaas-webhook` (Modificada)

**Localização**: `supabase/functions/asaas-webhook/index.ts`

**Modificações**:
- Integrada com `process_subscription_payment()` 
- Remove lógica de expiração fixa
- Implementa renovação de 31 dias automática

#### 2. `renew-business-subscriptions` (Nova)

**Localização**: `supabase/functions/renew-business-subscriptions/index.ts`

**Funcionalidades**:
- Execução via cron job (recomendado: diário)
- Desativa perfis expirados automaticamente
- Verifica e corrige inconsistências de renovação
- Processa assinaturas ativas para garantir renovação adequada

### Processo de Pagamento e Renovação

#### Fluxo Completo

1. **Pagamento Confirmado** (via webhook Asaas)
   - Webhook recebe confirmação `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`
   - Localiza assinatura do usuário
   - Chama `process_subscription_payment()`

2. **Renovação Automática**
   - Busca todos os negócios do usuário
   - Para cada negócio, executa `renew_business_subscription()`
   - Define nova data de renovação: `CURRENT_DATE + 31 dias`
   - Ativa perfil do negócio

3. **Controle de Expiração** 
   - Cron job diário executa `renew-business-subscriptions`
   - Verifica perfis com `renewal_date < hoje`
   - Desativa perfis expirados

#### Exemplo de Timeline

**Cenário: Pagamento Anual em 01/01/2024**

```
01/01/2024: Pagamento confirmado → Perfil ativo até 01/02/2024
01/02/2024: Renovação automática → Perfil ativo até 01/03/2024  
01/03/2024: Renovação automática → Perfil ativo até 01/04/2024
...continua por 12 meses...
```

**Cenário: Cancelamento em 15/01/2024**

```
01/01/2024: Pagamento confirmado → Perfil ativo até 01/02/2024
15/01/2024: Cliente cancela → Perfil CONTINUA ativo até 01/02/2024
01/02/2024: Sem renovação → Perfil desativado
```

## Configuração e Monitoramento

### Cron Job Recomendado

```sql
-- Executar diariamente às 02:00
SELECT cron.schedule(
  'renew-business-subscriptions-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
      url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/renew-business-subscriptions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### Monitoramento de Logs

#### Logs de Atividade do Usuário
- `subscription_payment_processed`: Registra cada renovação
- `business_renewed`: Registra renovação individual de negócio

#### Logs da Edge Function
- Quantidade de negócios renovados
- Erros de processamento
- Estatísticas de execução

### Verificação Manual

```sql
-- Verificar status de renovação de um negócio
SELECT 
  name,
  subscription_active,
  subscription_renewal_date,
  last_payment_date,
  grace_period_end,
  CASE 
    WHEN subscription_renewal_date > CURRENT_DATE THEN 'Ativo'
    ELSE 'Expirado'
  END as status
FROM businesses 
WHERE id = 'business-uuid';

-- Verificar próximas expirações  
SELECT 
  b.name,
  b.subscription_renewal_date,
  p.full_name,
  p.email
FROM businesses b
JOIN profiles p ON p.id = b.owner_id  
WHERE b.subscription_active = true
  AND b.subscription_renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY b.subscription_renewal_date;
```

## Segurança e Backup

### Validações Implementadas
- Apenas usuários autenticados podem ter negócios renovados
- Logs detalhados de todas as operações de renovação
- Transações atômicas para evitar inconsistências

### Procedimentos de Backup
- Backup diário da tabela `user_activity_log` para auditoria
- Retenção de logs por 12 meses (função `cleanup_old_activity_logs`)

## Testes e Validação

### Cenários de Teste

1. **Pagamento Mensal**
   - Confirmar renovação automática de 31 dias
   - Validar desativação após não-renovação

2. **Pagamento Anual**  
   - Confirmar renovações mensais de 31 dias durante 12 meses
   - Validar comportamento após cancelamento

3. **Múltiplos Negócios**
   - Usuário com vários negócios 
   - Todos devem ser renovados simultaneamente

4. **Edge Cases**
   - Pagamentos duplicados
   - Cancelamentos durante período de graciosidade
   - Falhas na renovação automática

### Comandos para Teste

```sql
-- Simular pagamento e renovação
SELECT process_subscription_payment(
  'user-uuid'::uuid,
  'test-payment-123',
  35.00
);

-- Verificar resultado
SELECT * FROM businesses WHERE owner_id = 'user-uuid';

-- Simular expiração (apenas para teste)
UPDATE businesses 
SET subscription_renewal_date = CURRENT_DATE - INTERVAL '1 day'
WHERE owner_id = 'user-uuid';

-- Executar limpeza
SELECT deactivate_expired_businesses();
```

## Próximos Passos

1. **Implementação de Alertas**
   - Notificar usuários 7 dias antes da expiração
   - Alertas para administradores sobre falhas de renovação

2. **Dashboard de Monitoramento** 
   - Painel administrativo com estatísticas de renovação
   - Relatórios de receita e churn

3. **Otimizações de Performance**
   - Índices otimizados para consultas de renovação
   - Cache de status de assinatura

---

*Documentação atualizada em: Janeiro 2024*
*Versão: 1.0*