# Fase 7 - Integração CRM do Módulo de Embaixadoras

## Visão Geral

A Fase 7 implementa a integração automática do Módulo de Embaixadoras com o sistema CRM do portal. Quando um usuário se cadastra através de um código de indicação de embaixadora, o sistema registra automaticamente:

1. **Lead do usuário referenciado** - Cria ou atualiza lead no CRM
2. **Interação de signup via referral** - Registra a origem da indicação
3. **Deal no pipeline de vendas** - Cria oportunidade para acompanhamento
4. **Interação para a embaixadora** - Registra que a indicação gerou um cadastro

## Arquitetura

### Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useAmbassadorCRMIntegration.ts` | Hook principal com funções de integração CRM |
| `src/hooks/useAuth.ts` | Modificado para chamar integração após signup |

### Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CADASTRO VIA REFERRAL                │
└──────────────────────────────────────────────────────────────────┘

1. Usuário acessa /convite/:codigo
        │
        ▼
2. Cookie mec_referral é salvo (30 dias, first-click)
        │
        ▼
3. Usuário preenche formulário e cria conta
        │
        ▼
4. useAuth.signUp() é chamado
        │
        ├─► Cria conta no Supabase Auth
        │
        ├─► Envia email de confirmação via MailRelay
        │
        └─► Verifica cookie mec_referral
                │
                ▼
5. registerReferralSignup() é chamado
        │
        ├─► Busca embaixadora pelo código
        │
        ├─► Cria/atualiza lead do referenciado
        │
        ├─► Registra interação 'referral_signup'
        │
        ├─► Cria deal no pipeline 'vendas'
        │
        └─► Registra interação 'referral_generated' para embaixadora
```

## API do Hook

### Funções Exportadas

#### `registerReferralSignup(data: ReferralData): Promise<CRMResult>`

Registra um cadastro via referral no CRM.

**Parâmetros:**
```typescript
interface ReferralData {
  referralCode: string;      // Código da embaixadora
  referredUserEmail: string; // Email do novo usuário
  referredUserName: string;  // Nome do novo usuário
  referredUserCpf?: string;  // CPF (opcional)
  referredUserId?: string;   // ID do usuário criado
}
```

**Retorno:**
```typescript
interface CRMResult {
  success: boolean;
  leadId?: string;   // ID do lead criado
  dealId?: string;   // ID do deal criado
  error?: string;    // Mensagem de erro se falhou
}
```

#### `updateDealOnPayment(params): Promise<CRMResult>`

Atualiza o deal quando o pagamento é confirmado.

**Parâmetros:**
```typescript
{
  leadId?: string;
  userEmail?: string;
  planName: string;
  planValue: number;
  referralCode?: string;
}
```

### Funções Auxiliares

- `getAmbassadorByCode(referralCode)` - Busca embaixadora pelo código
- `findOrCreateLead(email, name, cpf?, source?, sourceDetail?)` - Cria ou encontra lead
- `createInteraction(params)` - Registra interação no CRM

## Tipos de Interação

O sistema define os seguintes tipos de interação específicos para embaixadoras:

```typescript
const AMBASSADOR_INTERACTION_TYPES = {
  REFERRAL_SIGNUP: 'referral_signup',       // Usuário se cadastrou via referral
  REFERRAL_GENERATED: 'referral_generated', // Embaixadora gerou uma indicação
  REFERRAL_CONVERTED: 'referral_converted', // Indicação converteu em venda
  REFERRAL_PAYMENT: 'referral_payment',     // Pagamento confirmado
  AMBASSADOR_PAYOUT: 'ambassador_payout',   // Comissão paga à embaixadora
};
```

## Registros no CRM

### Lead do Referenciado

```json
{
  "full_name": "Nome do Usuário",
  "email": "usuario@email.com",
  "cpf": "12345678900",
  "source": "embaixadora",
  "source_detail": "Nome da Embaixadora",
  "status": "new",
  "first_activity_type": "referral_signup",
  "first_activity_paid": false,
  "first_activity_online": true
}
```

### Interação do Referenciado

```json
{
  "interaction_type": "referral_signup",
  "channel": "website",
  "description": "Cadastro via indicação da embaixadora: [Nome]",
  "activity_name": "Cadastro via Referral",
  "metadata": {
    "referral_code": "ABC123",
    "ambassador_id": "uuid",
    "ambassador_name": "Nome da Embaixadora"
  }
}
```

### Deal Criado

```json
{
  "title": "Nome do Usuário - Indicação Nome da Embaixadora",
  "pipeline_id": "[pipeline vendas]",
  "stage": "lead",
  "product_type": "plano",
  "value": 0,
  "metadata": {
    "referral_code": "ABC123",
    "ambassador_id": "uuid",
    "source": "ambassador_referral"
  }
}
```

### Interação da Embaixadora

```json
{
  "interaction_type": "referral_generated",
  "channel": "website",
  "description": "Indicação gerou cadastro de: Nome (email@email.com)",
  "activity_name": "Indicação Convertida em Cadastro",
  "metadata": {
    "referred_user_email": "email@email.com",
    "referred_user_name": "Nome",
    "referred_lead_id": "uuid"
  }
}
```

## Visualização no CRM

### Perfil do Contato (Referenciado)

No perfil do contato, a timeline mostrará:
- **Cadastro via Referral** - Com informações da embaixadora que indicou

### Perfil do Contato (Embaixadora)

No perfil da embaixadora, a timeline mostrará:
- **Indicação Convertida em Cadastro** - Para cada usuário que se cadastrou via seu link

### Pipeline de Vendas

Os deals criados via referral aparecem no Kanban do pipeline "Vendas" com:
- Título identificando a indicação
- Metadata com código de referral
- Stage inicial "lead" para acompanhamento

## Tratamento de Erros

A integração CRM é resiliente e não bloqueia o cadastro do usuário:

1. **Falha ao encontrar embaixadora** - Log de warning, cadastro continua
2. **Falha ao criar lead** - Retorna erro mas não bloqueia signup
3. **Falha ao criar interação** - Log de erro, fluxo continua
4. **Falha ao criar deal** - Log de erro, lead é criado normalmente

```javascript
// No useAuth.ts
if (referralCode) {
  try {
    await registerReferralSignup({...});
  } catch (crmError) {
    console.error('[Auth] Error registering referral in CRM:', crmError);
    // Don't fail signup if CRM fails
  }
}
```

## Requisitos de RLS

As tabelas CRM precisam permitir INSERT para usuários não-admin:

- `crm_leads` - INSERT público para criação automática de leads
- `crm_interactions` - INSERT público para registro de interações
- `crm_deals` - INSERT público para criação de deals via referral

## Próximos Passos

1. **Fase 8 - FAQ e Materiais Promocionais** - Página de ajuda para embaixadoras
2. **Documentação Consolidada** - Unificar toda documentação do módulo
3. **Testes E2E** - Validar fluxo completo de indicação → CRM

## Changelog

| Data | Alteração |
|------|-----------|
| 2025-02-09 | Implementação inicial da Fase 7 |
