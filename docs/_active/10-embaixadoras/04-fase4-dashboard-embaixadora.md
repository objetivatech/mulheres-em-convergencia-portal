# Fase 4 - Dashboard da Embaixadora

## Status: ✅ Concluído

## Visão Geral

O Dashboard da Embaixadora é o painel completo para embaixadoras gerenciarem suas indicações, acompanharem comissões e configurarem seus dados de pagamento.

## Arquitetura

### Estrutura de Arquivos

```
src/
├── hooks/
│   └── useAmbassador.ts          # Hook principal para dados e operações
├── components/
│   └── ambassador/
│       ├── index.ts              # Barrel export
│       ├── AmbassadorStatsCards.tsx       # Cards de métricas
│       ├── AmbassadorReferralLink.tsx     # Gestão de links
│       ├── AmbassadorReferralsList.tsx    # Lista de indicações
│       ├── AmbassadorPaymentSettings.tsx  # Configurações de pagamento
│       ├── AmbassadorClicksChart.tsx      # Gráficos de analytics
│       └── AmbassadorPayoutHistory.tsx    # Histórico de pagamentos
└── pages/
    └── EmbaixadoraDashboard.tsx  # Página principal
```

### Rotas

| Rota | Descrição | Redirect |
|------|-----------|----------|
| `/painel/embaixadora` | Dashboard principal | - |
| `/embaixadora/dashboard` | Compatibilidade | → `/painel/embaixadora` |
| `/dashboard/embaixadora` | Compatibilidade | → `/painel/embaixadora` |

## Hook useAmbassador

### Funções Disponíveis

```typescript
const {
  useAmbassadorData,    // Dados da embaixadora
  useReferrals,         // Lista de indicações
  useClicks,            // Cliques no link
  usePayouts,           // Histórico de pagamentos
  useStats,             // Estatísticas calculadas
  useUpdatePaymentData, // Atualizar dados bancários
  getInviteLink,        // Gerar link básico
  getInviteLinkWithUTM, // Gerar link com UTM
} = useAmbassador();
```

### Tipos

```typescript
interface Ambassador {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  total_sales: number;
  link_clicks: number;
  active: boolean;
  pix_key: string | null;
  bank_data: BankData | null;
  payment_preference: 'pix' | 'bank_transfer';
  minimum_payout: number;
  pending_commission: number;
  next_payout_date: string | null;
}

interface AmbassadorStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingCommission: number;
  thisMonthClicks: number;
  thisMonthConversions: number;
  thisMonthEarnings: number;
  averageTicket: number;
  nextPayoutDate: string | null;
}
```

## Componentes

### AmbassadorStatsCards

Exibe 8 cards de métricas:
- **Principais**: Total de Cliques, Conversões, Taxa de Conversão, Total Ganho
- **Secundários**: Comissão Pendente, Ganhos Este Mês, Ticket Médio, Próximo Pagamento

### AmbassadorReferralLink

Gestão de links de indicação:
- Link simples com botão de copiar
- Link com parâmetros UTM personalizados
- Presets rápidos (Instagram Bio, WhatsApp Status, etc.)
- Compartilhamento direto (WhatsApp, Facebook, Email)

### AmbassadorReferralsList

Tabela com todas as indicações:
- Data, plano, valor da venda
- Comissão calculada
- Status (Pendente, Confirmada, Paga, Cancelada)
- Data de elegibilidade para pagamento

### AmbassadorPaymentSettings

Formulário para configurar dados de pagamento:
- Opção PIX (chave PIX)
- Opção Transferência Bancária (dados completos)
- Lista de bancos principais do Brasil
- Validação e salvamento

### AmbassadorClicksChart

Gráficos de analytics:
- Linha do tempo (últimos 30 dias)
- Distribuição por origem (utm_source)
- Distribuição por mídia (utm_medium)

### AmbassadorPayoutHistory

Histórico de pagamentos recebidos:
- Período de referência
- Quantidade de vendas
- Valores bruto e líquido
- Status do pagamento

## Fluxo de Acesso

1. Usuário autenticado acessa `/painel/embaixadora`
2. Sistema verifica via `isAmbassador` no `useAuth` se o usuário tem registro ativo na tabela `ambassadors`
3. Se existir: exibe dashboard completo
4. Se não existir: exibe mensagem de acesso restrito
5. O link aparece automaticamente no menu do usuário quando `isAmbassador === true`

## Criação Automática de Embaixadora

Quando a role `ambassador` é atribuída a um usuário via UserManagement:
1. Trigger `trigger_create_ambassador_on_role` dispara automaticamente
2. Cria registro em `ambassadors` com código de referral único
3. Código é gerado via `generate_unique_referral_code()` (8 caracteres alfanuméricos)
4. Embaixadora fica ativa imediatamente

Quando a role é removida:
1. Trigger `trigger_deactivate_ambassador_on_role` dispara
2. Registro é desativado (`active = false`) mas mantido para histórico

## Segurança (RLS)

As políticas RLS garantem que:
- Embaixadoras só veem seus próprios dados
- Admins podem ver dados de todas embaixadoras
- Atualização restrita aos próprios dados

## Próximos Passos

- **Fase 5**: Painel Admin para Embaixadoras
  - Listar todas embaixadoras
  - Aprovar/rejeitar novas embaixadoras
  - Processar pagamentos manuais
  - Gerar relatórios de comissões
