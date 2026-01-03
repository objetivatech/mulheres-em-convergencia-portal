# Arquitetura do CRM

## Visão Geral

O CRM do Portal foi desenvolvido para gerenciar o relacionamento com empreendedoras, doadores, patrocinadores e parceiros, com foco em medir o **impacto social** das atividades realizadas.

## Princípios Arquiteturais

1. **CPF como Identificador Universal**: Todo contato é identificado pelo CPF, permitindo rastrear a jornada completa mesmo antes de se tornar usuário registrado.
2. **Centro de Custo**: Todas as transações são vinculadas a centros de custo (empresa/associação) para controle financeiro.
3. **Timeline Unificada**: Todas as interações são registradas em uma única tabela para visão 360°.
4. **Hooks React Query**: Toda comunicação com Supabase é feita via hooks customizados com cache inteligente.

## Estrutura de Banco de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        CENTRO DE CUSTO                          │
│                       (cost_centers)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   crm_leads   │    │    events     │    │   donations   │
│ (pré-usuário) │    │   (eventos)   │    │   (doações)   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        │              ┌──────┴──────┐              │
        │              ▼             │              │
        │    ┌─────────────────┐     │              │
        │    │    event_      │     │              │
        │    │ registrations  │     │              │
        │    └─────────────────┘     │              │
        │                            │              │
        ▼                            ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     crm_interactions                            │
│            (todas as interações unificadas)                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       crm_deals                                 │
│                   (pipeline de vendas)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Tabelas Principais

### cost_centers
Centros de custo para segregação financeira.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do centro |
| type | TEXT | 'empresa' ou 'associacao' |
| cnpj | TEXT | CNPJ (opcional) |
| active | BOOLEAN | Ativo/Inativo |

### crm_leads
Contatos que ainda não são usuários registrados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| cpf | TEXT | CPF (chave de identificação) |
| email | TEXT | Email |
| full_name | TEXT | Nome completo |
| phone | TEXT | Telefone |
| source | TEXT | Origem (website, indicacao, evento) |
| status | TEXT | new, contacted, qualified, converted, lost |
| first_activity_date | TIMESTAMP | Data primeira atividade |
| first_activity_type | TEXT | Tipo da primeira atividade |
| first_activity_paid | BOOLEAN | Se foi atividade paga |
| first_activity_online | BOOLEAN | Se foi online |
| cost_center_id | UUID | Centro de custo |

### crm_interactions
Registro de todas as interações com contatos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| lead_id | UUID | Referência ao lead (opcional) |
| user_id | UUID | Referência ao usuário (opcional) |
| cpf | TEXT | CPF do contato |
| interaction_type | TEXT | Tipo (contact_form, event_registration, etc) |
| channel | TEXT | Canal (website, email, whatsapp, presencial) |
| description | TEXT | Descrição livre |
| activity_name | TEXT | Nome da atividade |
| activity_paid | BOOLEAN | Se foi atividade paga |
| activity_online | BOOLEAN | Se foi online |
| cost_center_id | UUID | Centro de custo |
| form_source | TEXT | Formulário de origem |

### crm_deals
Pipeline de vendas e oportunidades.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| lead_id | UUID | Referência ao lead |
| user_id | UUID | Referência ao usuário |
| cpf | TEXT | CPF do contato |
| title | TEXT | Título do negócio |
| value | DECIMAL | Valor estimado |
| stage | TEXT | Estágio (lead, qualified, proposal, negotiation, won, lost) |
| expected_close_date | DATE | Previsão de fechamento |
| closed_at | TIMESTAMP | Data de fechamento |
| won | BOOLEAN | Se foi ganho |

### events
Eventos (cursos, workshops, palestras).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| title | TEXT | Título |
| type | TEXT | Tipo (curso, workshop, palestra, encontro, encontro_networking, mentoria, webinar, conferencia, outro) |
| format | TEXT | Formato (online, presencial, hibrido) |
| date_start | TIMESTAMP | Data início |
| date_end | TIMESTAMP | Data fim (opcional) |
| price | DECIMAL | Preço |
| free | BOOLEAN | Se é gratuito |
| max_participants | INTEGER | Limite de participantes |
| cost_center_id | UUID | Centro de custo |

### donations
Doações recebidas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| donor_id | UUID | Usuário doador |
| cpf | TEXT | CPF do doador |
| amount | DECIMAL | Valor |
| type | TEXT | Tipo (unica, recorrente) |
| campaign | TEXT | Campanha |
| status | TEXT | Status do pagamento |
| cost_center_id | UUID | Centro de custo |

## Fluxo de Dados

### 1. Novo Contato (Lead)
```
Formulário → registerCRMInteraction() → crm_leads + crm_interactions
```

### 2. Conversão para Usuário
```
Signup → Trigger on_auth_user_created → crm_interactions (type: signup)
                                      → crm_leads.status = converted
```

### 3. Inscrição em Evento
```
EventRegistration → event_registrations + crm_interactions
```

### 4. Doação
```
Donation → donations + crm_interactions
```

## Hooks React Query

| Hook | Descrição |
|------|-----------|
| `useCRM()` | Hook principal com sub-hooks para leads, deals, interactions |
| `useEvents()` | Gestão de eventos e inscrições |
| `useDonations()` | Gestão de doações e patrocínios |
| `useSocialImpact()` | Métricas de impacto e jornada por CPF |

## Páginas Admin

| Rota | Descrição |
|------|-----------|
| `/admin/crm` | Dashboard com KPIs |
| `/admin/crm/contatos` | Lista unificada de contatos |
| `/admin/crm/pipeline` | Kanban de vendas |
| `/admin/crm/eventos` | Gestão de eventos |
| `/admin/crm/financeiro` | Doações e patrocínios |
| `/admin/crm/impacto` | Dashboard de impacto social |
| `/admin/crm/jornada/:cpf` | Jornada individual |
| `/admin/centros-custo` | Gestão de centros de custo |

## Segurança

- **RLS (Row Level Security)**: Todas as tabelas têm políticas habilitadas
- **Acesso Admin**: Verificação via `is_admin` no perfil
- **Auditoria**: Logs de acesso a dados sensíveis (CPF)

## Próximos Passos

1. Integração com sistema de pagamentos (Asaas)
2. Automações de email baseadas em eventos CRM
3. Relatórios personalizáveis com export PDF
