# Fase 9: Níveis, Comissão Recorrente e Gamificação

## Visão Geral

A Fase 9 implementa o sistema avançado de progressão com três níveis de comissão, comissões recorrentes por renovação e gamificação completa com conquistas e ranking.

## Novos Recursos

### 1. Sistema de Níveis

Três níveis progressivos baseados em vendas confirmadas:

| Nível | Vendas | Comissão 1ª Venda | Comissão Renovação |
|-------|--------|-------------------|---------------------|
| Bronze | 0-9 | 15% | 7% |
| Prata | 10-24 | 17% | 7% |
| Ouro | 25+ | 20% | 7% |

**Progressão automática:** Trigger `update_ambassador_tier` atualiza o nível quando `total_sales` muda.

### 2. Comissão Recorrente

- **Taxa fixa:** 7% sobre renovações
- **Duração:** 12 meses a partir da primeira venda
- **Rastreamento:** Campos `is_recurring`, `recurring_month` e `original_referral_id`

### 3. Gamificação

**Conquistas implementadas:**
- Milestones de vendas (1, 5, 10, 25, 50, 100)
- Milestones de cliques (100, 500, 1000)
- Promoção de nível (Prata, Ouro)

**Sistema de pontos:**
- Cada conquista vale pontos
- Ranking atualizado em tempo real
- Top 10 exibido no dashboard

### 4. Dashboard em Tempo Real

**Hook `useAmbassadorRealtime`:**
- Escuta mudanças via Supabase Realtime
- Notifica vendas, pagamentos e conquistas
- Atualiza dados sem refresh

## Banco de Dados

### Novas Tabelas

#### `ambassador_tiers`
```sql
id TEXT PRIMARY KEY,           -- 'bronze', 'silver', 'gold'
name TEXT NOT NULL,            -- Nome de exibição
min_sales INTEGER NOT NULL,    -- Vendas necessárias
commission_rate NUMERIC(5,2),  -- Taxa primeira venda
recurring_rate NUMERIC(5,2),   -- Taxa renovação (7%)
recurring_months INTEGER,      -- Meses de recorrência (12)
color TEXT,                    -- Cor do badge
icon TEXT,                     -- Ícone Lucide
benefits TEXT[]                -- Lista de benefícios
```

#### `ambassador_achievements`
```sql
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
description TEXT NOT NULL,
icon TEXT NOT NULL,
category TEXT,                 -- 'milestone', 'engagement', 'tier'
requirement_type TEXT,         -- 'sales', 'clicks', 'tier'
requirement_value INTEGER,
points INTEGER,
badge_color TEXT
```

#### `ambassador_user_achievements`
```sql
id UUID PRIMARY KEY,
ambassador_id UUID REFERENCES ambassadors(id),
achievement_id TEXT REFERENCES ambassador_achievements(id),
unlocked_at TIMESTAMPTZ,
notified BOOLEAN
```

#### `ambassador_points`
```sql
id UUID PRIMARY KEY,
ambassador_id UUID,
points_type TEXT,              -- 'sale', 'achievement', 'bonus'
points INTEGER,
description TEXT,
reference_id UUID,
created_at TIMESTAMPTZ
```

### Novos Campos em `ambassadors`

```sql
tier TEXT DEFAULT 'bronze',
tier_updated_at TIMESTAMPTZ,
lifetime_sales INTEGER DEFAULT 0,
total_points INTEGER DEFAULT 0
```

### Novos Campos em `ambassador_referrals`

```sql
is_recurring BOOLEAN DEFAULT false,
recurring_month INTEGER,
original_referral_id UUID
```

## Componentes Criados

### `AmbassadorTierProgress`
Exibe nível atual, progresso para próximo nível e benefícios.

### `AmbassadorAchievements`
Grid de conquistas com estado bloqueado/desbloqueado e progresso.

### `AmbassadorRanking`
Top 10 embaixadoras ordenadas por pontuação.

## Hooks Criados

### `useAmbassadorGamification`
```typescript
const {
  useTiers,              // Todos os níveis
  useAchievements,       // Todas conquistas
  useUserAchievements,   // Conquistas do usuário
  usePointsHistory,      // Histórico de pontos
  useRanking,            // Top 10
  calculateTierProgress, // Calcular progresso
} = useAmbassadorGamification();
```

### `useAmbassadorRealtime`
```typescript
// Ativa escuta de eventos em tempo real
useAmbassadorRealtime(ambassador?.id);
```

## FAQ Atualizado

Novas perguntas adicionadas:
- O que são os níveis de embaixadora?
- Como funciona a comissão recorrente?
- Como subo de nível?
- O que são as conquistas?
- Como funciona o sistema de pontos?
- Onde vejo minhas conquistas e nível?

## Integração no Dashboard

O dashboard foi atualizado para incluir na aba "Visão Geral":
1. Card de progresso de nível
2. Ranking de embaixadoras
3. Grid de conquistas
4. Atualizações em tempo real

## Fluxo de Atualização de Nível

```
Pagamento confirmado
    ↓
Webhook atualiza total_sales
    ↓
Trigger update_ambassador_tier dispara
    ↓
Calcula lifetime_sales (vendas não-recorrentes)
    ↓
Determina novo tier via calculate_ambassador_tier()
    ↓
Se mudou: atualiza tier, tier_updated_at, commission_rate
    ↓
Realtime notifica o dashboard
    ↓
Toast "Subiu de Nível!" aparece
```

## Arquivos Modificados/Criados

**Criados:**
- `src/hooks/useAmbassadorGamification.ts`
- `src/hooks/useAmbassadorRealtime.ts`
- `src/components/ambassador/AmbassadorTierProgress.tsx`
- `src/components/ambassador/AmbassadorAchievements.tsx`
- `src/components/ambassador/AmbassadorRanking.tsx`
- `docs/_active/10-embaixadoras/09-fase9-niveis-gamificacao.md`

**Modificados:**
- `src/hooks/useAmbassador.ts` (novos campos Ambassador)
- `src/components/ambassador/index.ts` (exports)
- `src/pages/EmbaixadoraDashboard.tsx` (integração)

**Migração:**
- Novas tabelas e campos
- Funções e triggers
- RLS policies
- FAQ inicial populado
