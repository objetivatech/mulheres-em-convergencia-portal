# Módulo de Embaixadoras - Documentação Completa

## Visão Geral

O Programa de Embaixadoras é um sistema de marketing de afiliadas que permite que membros da comunidade indiquem novas associadas e recebam comissões sobre as vendas geradas.

## Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Sistema de Níveis](#sistema-de-níveis)
3. [Comissões](#comissões)
4. [Gamificação](#gamificação)
5. [Dashboard em Tempo Real](#dashboard-em-tempo-real)
6. [Fluxo de Indicação](#fluxo-de-indicação)
7. [Gestão Administrativa](#gestão-administrativa)
8. [FAQ e Materiais](#faq-e-materiais)
9. [Página Pública de Embaixadoras](#página-pública-de-embaixadoras)
10. [Integrações](#integrações)
11. [Banco de Dados](#banco-de-dados)

---

## Arquitetura Geral

### Estrutura de Arquivos

```
src/
├── hooks/
│   ├── useAmbassador.ts              # Hook principal de dados
│   ├── useAmbassadorAdmin.ts         # Hook de administração
│   ├── useAmbassadorGamification.ts  # Níveis, conquistas e ranking
│   ├── useAmbassadorRealtime.ts      # Atualizações em tempo real
│   ├── useAmbassadorMaterials.ts     # Materiais promocionais
│   └── useReferralTracking.ts        # Rastreamento de indicações
├── components/
│   └── ambassador/
│       ├── index.ts                  # Barrel exports
│       ├── AmbassadorStatsCards.tsx  # Métricas principais
│       ├── AmbassadorTierProgress.tsx # Nível e progresso
│       ├── AmbassadorAchievements.tsx # Conquistas
│       ├── AmbassadorRanking.tsx     # Top 10
│       ├── AmbassadorReferralLink.tsx # Links de indicação
│       ├── AmbassadorReferralsList.tsx # Lista de indicações
│       ├── AmbassadorPaymentSettings.tsx # Config. pagamento
│       ├── AmbassadorClicksChart.tsx  # Analytics de cliques
│       ├── AmbassadorPayoutHistory.tsx # Histórico de pagamentos
│       ├── AmbassadorNotifications.tsx # Notificações
│       ├── AmbassadorFAQ.tsx          # Perguntas frequentes
│       ├── AmbassadorMaterials.tsx    # Kit promocional
│       └── AmbassadorQRCode.tsx       # Gerador de QR Code
├── components/admin/ambassadors/
│   ├── AdminAmbassadorStats.tsx      # Métricas admin
│   ├── AdminAmbassadorsList.tsx      # Lista de embaixadoras
│   ├── AdminPayoutsList.tsx          # Gestão de pagamentos
│   ├── AdminMaterialsManager.tsx     # Gestão de materiais
│   └── EditAmbassadorDialog.tsx      # Edição de taxas
└── pages/
    ├── EmbaixadoraDashboard.tsx      # Dashboard embaixadora
    └── admin/AdminAmbassadors.tsx    # Painel admin
```

### Rotas

| Rota | Descrição |
|------|-----------|
| `/painel/embaixadora` | Dashboard da embaixadora |
| `/admin/embaixadoras` | Painel administrativo |
| `/convite/:codigo` | Landing page de indicação |
| `/embaixadoras` | Página pública com lista de embaixadoras |

---

## Sistema de Níveis

### Três Níveis de Comissão

O programa possui três níveis progressivos baseados em performance:

| Nível | Vendas Necessárias | Comissão 1ª Venda | Comissão Renovação |
|-------|-------------------|-------------------|---------------------|
| **Bronze** 🥉 | 0-9 vendas | 15% | 7% |
| **Prata** 🥈 | 10-24 vendas | 17% | 7% |
| **Ouro** 🥇 | 25+ vendas | 20% | 7% |

### Progressão Automática

- O sistema atualiza automaticamente o nível quando a embaixadora atinge o número de vendas necessário
- **O nível nunca diminui** - uma vez alcançado, é permanente
- A atualização acontece via trigger no banco de dados

### Benefícios por Nível

**Bronze:**
- 15% de comissão na primeira venda
- 7% nas renovações por 12 meses
- Acesso aos materiais promocionais
- Suporte por email

**Prata:**
- 17% de comissão na primeira venda
- 7% nas renovações por 12 meses
- Materiais exclusivos
- Suporte prioritário
- Destaque no ranking

**Ouro:**
- 20% de comissão na primeira venda
- 7% nas renovações por 12 meses
- Materiais VIP
- Suporte dedicado
- Badges exclusivas
- Bônus por meta atingida

---

## Comissões

### Primeira Venda

A comissão da primeira venda segue a taxa do nível atual da embaixadora:
- Bronze: 15%
- Prata: 17%
- Ouro: 20%

### Comissão Recorrente

Para cada renovação de assinatura da indicada:
- **Taxa:** 7% do valor da renovação
- **Duração:** Por até 12 meses após a primeira compra
- **Rastreamento:** Campo `is_recurring` na tabela `ambassador_referrals`

### Exemplo de Cálculo

```
Embaixadora Nível Prata indica uma nova associada:
├── Plano Anual: R$ 599,00
├── Primeira Venda: 17% × R$ 599,00 = R$ 101,83
│
└── Renovações (se mensal de R$ 59,90):
    ├── Mês 1: 7% × R$ 59,90 = R$ 4,19
    ├── Mês 2: 7% × R$ 59,90 = R$ 4,19
    ├── ...
    └── Mês 12: 7% × R$ 59,90 = R$ 4,19

Total potencial em 12 meses: R$ 101,83 + (R$ 4,19 × 12) = R$ 152,11
```

### Ciclo de Pagamento (Regra 20/10)

- Vendas de **dia 21 do mês anterior até dia 20 do mês atual** são pagas no **dia 10 do mês seguinte**
- Exemplo: Venda em 15/fev → Pagamento em 10/mar
- Exemplo: Venda em 25/fev → Pagamento em 10/abr

---

## Gamificação

### Sistema de Conquistas

Badges especiais desbloqueadas automaticamente:

**Milestones de Vendas:**
| Conquista | Requisito | Pontos |
|-----------|-----------|--------|
| Primeira Venda | 1 venda | 50 |
| Decolando | 5 vendas | 100 |
| Embaixadora Prata | 10 vendas | 200 |
| Embaixadora Ouro | 25 vendas | 500 |
| Top Performer | 50 vendas | 1000 |
| Lendária | 100 vendas | 2000 |

**Engajamento:**
| Conquista | Requisito | Pontos |
|-----------|-----------|--------|
| Começando | 100 cliques | 25 |
| Influenciadora | 500 cliques | 75 |
| Viral | 1000 cliques | 150 |

### Sistema de Pontos

Pontos são acumulados por:
- Vendas realizadas
- Conquistas desbloqueadas
- Bônus especiais

### Ranking

- Top 10 embaixadoras exibidas no dashboard
- Ordenação por pontuação total
- Atualização em tempo real

---

## Dashboard em Tempo Real

### Tecnologia

Utiliza **Supabase Realtime** para atualizações instantâneas via WebSocket.

### Eventos Monitorados

| Tabela | Evento | Ação |
|--------|--------|------|
| `ambassador_referrals` | INSERT | Notifica nova venda |
| `ambassador_referrals` | UPDATE | Notifica pagamento confirmado |
| `ambassador_referral_clicks` | INSERT | Atualiza contador |
| `ambassador_payouts` | * | Notifica novo pagamento |
| `ambassador_user_achievements` | INSERT | Mostra nova conquista |
| `ambassadors` | UPDATE | Notifica mudança de nível |

### Hook de Implementação

```typescript
import { useAmbassadorRealtime } from '@/hooks/useAmbassadorRealtime';

// No componente do dashboard
useAmbassadorRealtime(ambassador?.id);
```

---

## Fluxo de Indicação

### 1. Clique no Link

```
Visitante clica: /convite/ABC123?utm_source=instagram
    ↓
trackClick('ABC123') é executado
    ↓
Cookie 'mec_referral' salvo (30 dias)
    ↓
RPC track_referral_click_extended registra no banco
```

### 2. Cadastro e Assinatura

```
Usuário se cadastra
    ↓
Cookie 'mec_referral' recuperado
    ↓
create-subscription inclui referral_code
    ↓
ambassador_id vinculado à assinatura
```

### 3. Confirmação do Pagamento

```
Webhook Asaas: PAYMENT_RECEIVED
    ↓
processAmbassadorCommission() executado
    ↓
ambassador_referrals criado
    ↓
Totais da embaixadora atualizados
    ↓
Conquistas verificadas
```

---

## Gestão Administrativa

### Painel Admin (`/admin/embaixadoras`)

**Abas Disponíveis:**
1. **Visão Geral:** Métricas consolidadas
2. **Embaixadoras:** Lista completa com ações
3. **Pagamentos:** Processar e gerenciar payouts
4. **Materiais:** Upload e gestão de conteúdo promocional
5. **Página:** Gerenciar visibilidade na página pública

### Ações Administrativas

- Ativar/desativar embaixadoras
- Editar taxa de comissão individual
- Editar dados bancários
- Processar pagamentos
- Exportar relatórios CSV
- Gerenciar materiais promocionais

### Materiais Promocionais

**Tipos Suportados:**
- Banners (imagens)
- PDFs
- Templates de texto (WhatsApp/Instagram)

**Gerenciamento:**
- Upload de arquivos (máx. 10MB)
- Edição de templates com variáveis (`{{LINK}}`, `{{CODIGO}}`)
- Controle de visibilidade
- Contador de downloads

---

## FAQ e Materiais

### FAQ Dinâmico

Perguntas organizadas por categoria:
- 📋 Sobre o Programa
- 🔗 Como Indicar
- 💰 Pagamentos e Comissões
- 📊 Rastreamento
- 💡 Dicas de Sucesso

Gerenciável via banco de dados.

### Kit Promocional

**Templates Pré-definidos:**
- WhatsApp: Convite simples, benefícios, história pessoal
- Instagram: Stories, feed, roteiro de Reels

**QR Code Personalizado:**
- Geração dinâmica com link de indicação
- Download em PNG com branding
- Código de referência visível

---

## Página Pública de Embaixadoras

### Rota: `/embaixadoras`

Página pública para divulgar as embaixadoras do programa, permitindo que visitantes conheçam as parceiras e utilizem seus links de indicação.

### Componentes

- **Hero Section:** Título e descrição do programa
- **Grid de Embaixadoras:** Cards em layout 3 colunas (responsivo)
- **CTA Final:** Botão para página de planos

### Card de Embaixadora

Cada card exibe:
- Avatar com badge de nível (Bronze/Prata/Ouro)
- Nome completo
- Localização (cidade/estado)
- Bio pública (até 3 linhas)
- Links de redes sociais (Instagram, LinkedIn, Website)
- Botão "Copiar Link de Indicação"

### Gerenciamento no Admin

Na aba **"Página"** do painel admin:
- Toggle de visibilidade por embaixadora
- Ordenação via setas ou campo numérico
- Link para preview da página
- Contador de embaixadoras visíveis

### Campos de Perfil

**Tabela `profiles`:**
- `instagram_url` - URL do Instagram
- `linkedin_url` - URL do LinkedIn
- `website_url` - URL do site pessoal
- `public_bio` - Biografia pública

**Tabela `ambassadors`:**
- `show_on_public_page` - Controle de visibilidade
- `display_order` - Ordem de exibição

---

## Integrações

### CRM

Indicações geram automaticamente:
- Lead com fonte "embaixadora"
- Negócio no pipeline de vendas
- Interações de rastreamento

### Mailrelay

E-mails automatizados para:
- Confirmação de pagamento
- Notificação de estorno
- Mudança de nível

### Asaas

- Webhook processa pagamentos
- Calcula comissões automaticamente
- Atualiza status de indicações

---

## Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `ambassadors` | Dados das embaixadoras |
| `ambassador_referrals` | Indicações e comissões |
| `ambassador_referral_clicks` | Cliques nos links |
| `ambassador_payouts` | Pagamentos processados |
| `ambassador_notifications` | Notificações in-app |

### Tabelas de Gamificação

| Tabela | Descrição |
|--------|-----------|
| `ambassador_tiers` | Configuração de níveis |
| `ambassador_achievements` | Definição de conquistas |
| `ambassador_user_achievements` | Conquistas desbloqueadas |
| `ambassador_points` | Histórico de pontuação |

### Tabelas de Suporte

| Tabela | Descrição |
|--------|-----------|
| `ambassador_faq_items` | Perguntas frequentes |
| `ambassador_materials` | Materiais promocionais |

### Campos Importantes em `ambassadors`

```sql
tier TEXT                   -- bronze, silver, gold
tier_updated_at TIMESTAMPTZ -- Quando subiu de nível
lifetime_sales INTEGER      -- Total de vendas (não renovações)
total_points INTEGER        -- Pontuação total
commission_rate NUMERIC     -- Taxa atual de comissão
```

### Campos Importantes em `ambassador_referrals`

```sql
is_recurring BOOLEAN        -- Se é renovação
recurring_month INTEGER     -- Mês da renovação (1-12)
original_referral_id UUID   -- Referência à venda original
```

---

## Segurança

### RLS Policies

- Embaixadoras só acessam seus próprios dados
- Admins têm acesso total
- Inserções de sistema permitidas para automações

### Validações

- Apenas embaixadoras ativas recebem comissões
- Cookie de referral expira em 30 dias
- Atribuição "first-click" (não sobrescreve código existente)

---

## Próximas Melhorias Sugeridas

1. **Payout Automático:** Integração direta com Asaas para transferências
2. **Analytics Avançado:** Gráficos de evolução temporal
3. **Metas Personalizadas:** Desafios mensais com bônus
4. **Materiais Dinâmicos:** Banners personalizados com nome da embaixadora
5. **App Mobile:** Notificações push de vendas
