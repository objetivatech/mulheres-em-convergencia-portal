# Métricas e KPIs do CRM

## Visão Geral

O CRM fornece métricas em tempo real para acompanhar o desempenho das atividades e o impacto social do projeto.

## Dashboard Principal (`/admin/crm`)

### KPIs Principais

| Métrica | Descrição | Cálculo |
|---------|-----------|---------|
| **Total Leads** | Contatos não convertidos | COUNT(crm_leads WHERE status != 'converted') |
| **Taxa Conversão** | Leads → Usuários | converted / total_leads * 100 |
| **Deals Ativos** | Negócios em andamento | COUNT(crm_deals WHERE stage NOT IN ('won', 'lost')) |
| **Valor Pipeline** | Soma dos deals ativos | SUM(crm_deals.value WHERE stage NOT IN ('won', 'lost')) |
| **Ticket Médio** | Valor médio por deal | AVG(crm_deals.value WHERE won = true) |

### Métricas por Período

| Métrica | 7 dias | 30 dias | 90 dias |
|---------|--------|---------|---------|
| Novos leads | ✓ | ✓ | ✓ |
| Leads convertidos | ✓ | ✓ | ✓ |
| Deals fechados | ✓ | ✓ | ✓ |
| Receita gerada | ✓ | ✓ | ✓ |

## Métricas de Aquisição

### CAC (Custo de Aquisição de Cliente)

```sql
SELECT 
  period,
  marketing_spend / new_customers AS cac
FROM (
  SELECT 
    DATE_TRUNC('month', created_at) AS period,
    COUNT(*) AS new_customers
  FROM crm_leads
  WHERE status = 'converted'
  GROUP BY 1
)
```

**Interpretação:**
- CAC baixo = aquisição eficiente
- Acompanhe tendência mensal
- Compare com LTV

### Fontes de Aquisição

| Fonte | Métrica |
|-------|---------|
| Website | Leads via formulários |
| Eventos | Inscrições convertidas |
| Indicação | Leads por referral |
| Redes Sociais | Leads via social |

## Métricas de Conversão

### Funil de Vendas

```
Lead → Qualificado → Proposta → Negociação → Ganho
100%     60%          40%         25%        15%
```

**Cálculo por estágio:**
```sql
SELECT 
  stage,
  COUNT(*) as total,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM crm_deals
GROUP BY stage
```

### Taxa de Conversão por Origem

| Origem | Leads | Convertidos | Taxa |
|--------|-------|-------------|------|
| Website | 100 | 15 | 15% |
| Evento | 50 | 20 | 40% |
| Indicação | 30 | 12 | 40% |

## Métricas de Retenção

### LTV (Lifetime Value)

```sql
SELECT 
  AVG(total_value) as ltv
FROM (
  SELECT 
    cpf,
    SUM(amount) as total_value
  FROM donations
  WHERE status = 'confirmed'
  GROUP BY cpf
)
```

### Churn Rate

```sql
SELECT 
  period,
  lost_customers / total_customers_start * 100 as churn_rate
FROM (
  SELECT 
    DATE_TRUNC('month', updated_at) as period,
    COUNT(*) FILTER (WHERE status = 'lost') as lost_customers,
    COUNT(*) as total_customers_start
  FROM crm_leads
  GROUP BY 1
)
```

### Taxa de Reengajamento

Contatos inativos que voltaram a interagir:

```sql
SELECT 
  COUNT(*) FILTER (WHERE reengaged) / COUNT(*) * 100 as reengagement_rate
FROM (
  SELECT 
    cpf,
    MAX(created_at) > NOW() - INTERVAL '30 days' as reengaged
  FROM crm_interactions
  GROUP BY cpf
  HAVING MIN(created_at) < NOW() - INTERVAL '90 days'
)
```

## Métricas de Eventos

| Métrica | Descrição |
|---------|-----------|
| Total Eventos | Eventos realizados no período |
| Inscrições | Total de inscrições |
| Taxa Comparecimento | checked_in / confirmed * 100 |
| Receita Eventos | Soma dos pagamentos |
| Ticket Médio | Receita / Inscrições pagas |

### Por Tipo de Evento

```sql
SELECT 
  type,
  COUNT(DISTINCT e.id) as eventos,
  COUNT(r.id) as inscricoes,
  SUM(CASE WHEN r.checked_in_at IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(COUNT(r.id), 0) as taxa_comparecimento
FROM events e
LEFT JOIN event_registrations r ON r.event_id = e.id
GROUP BY type
```

## Métricas Financeiras

### Doações

| Métrica | Cálculo |
|---------|---------|
| Total Arrecadado | SUM(donations.amount) |
| Doação Média | AVG(donations.amount) |
| Doadores Únicos | COUNT(DISTINCT cpf) |
| Recorrentes | COUNT WHERE frequency = 'recorrente' |

### Por Centro de Custo

```sql
SELECT 
  cc.name as centro_custo,
  SUM(d.amount) as total_doacoes,
  SUM(e.price * r.payment_amount) as receita_eventos,
  SUM(s.sponsorship_value) as patrocinios
FROM cost_centers cc
LEFT JOIN donations d ON d.cost_center_id = cc.id
LEFT JOIN events e ON e.cost_center_id = cc.id
LEFT JOIN event_registrations r ON r.event_id = e.id
LEFT JOIN sponsors s ON s.cost_center_id = cc.id
GROUP BY cc.id, cc.name
```

## Métricas de Impacto Social

### Empreendedoras Atendidas

```sql
SELECT 
  COUNT(DISTINCT cpf) as empreendedoras,
  COUNT(*) as total_atividades,
  COUNT(*) FILTER (WHERE activity_paid) as atividades_pagas,
  COUNT(*) FILTER (WHERE activity_online) as atividades_online
FROM crm_interactions
WHERE interaction_type IN ('event_registration', 'course_completion')
```

### Jornada Média

```sql
SELECT 
  AVG(days_to_conversion) as dias_para_conversao,
  AVG(activities_count) as atividades_antes_conversao
FROM crm_conversion_milestones
WHERE milestone_type = 'signup'
```

### Retenção de Empreendedoras

| Coorte | M1 | M3 | M6 | M12 |
|--------|-----|-----|-----|------|
| Jan/24 | 80% | 60% | 45% | 30% |
| Fev/24 | 85% | 65% | 50% | - |
| Mar/24 | 75% | 55% | - | - |

## Funções RPC Disponíveis

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `get_crm_stats()` | Stats gerais | JSON com KPIs |
| `calculate_cac(period)` | CAC do período | DECIMAL |
| `calculate_ltv()` | LTV médio | DECIMAL |
| `calculate_churn_rate(period)` | Churn do período | DECIMAL (%) |
| `get_funnel_stats()` | Funil de vendas | JSON com estágios |
| `get_journey_by_cpf(cpf)` | Jornada individual | JSON com timeline |

## Dashboards

### 1. Dashboard Executivo
- KPIs principais
- Tendências mensais
- Comparativo período anterior

### 2. Dashboard de Vendas
- Pipeline por estágio
- Deals por responsável
- Previsão de fechamento

### 3. Dashboard de Impacto
- Empreendedoras atendidas
- Atividades realizadas
- Taxa de retenção
- Jornada média

## Exportação de Dados

### Formatos Disponíveis
- CSV (Excel compatível)
- JSON (integração com outras ferramentas)

### Dados Exportáveis
- Lista de leads
- Lista de contatos unificados
- Deals e pipeline
- Eventos e inscrições
- Doações
- Métricas agregadas

## Boas Práticas

1. **Monitore tendências**: Compare períodos para identificar melhorias
2. **Segmente por fonte**: Identifique canais mais efetivos
3. **Acompanhe cohorts**: Analise retenção por período de entrada
4. **Use filtros de centro de custo**: Separe métricas por entidade
5. **Exporte regularmente**: Mantenha histórico para análises
