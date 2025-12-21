# Integração de Formulários com CRM

## Visão Geral

Todos os formulários do site podem registrar interações automaticamente no CRM, permitindo rastrear a jornada do contato desde o primeiro contato.

## Biblioteca de Integração

### Localização
```
src/lib/crmIntegration.ts
```

### Função Principal

```typescript
import { registerCRMInteraction } from '@/lib/crmIntegration';

const result = await registerCRMInteraction(
  // Dados do contato
  {
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '11999999999',
    cpf: '12345678901' // opcional, mas recomendado
  },
  // Dados da interação
  {
    type: 'contact_form',
    channel: 'website',
    description: 'Mensagem do formulário',
    formSource: 'contato',
    activityName: 'Formulário de Contato'
  }
);

if (result.success) {
  console.log('Lead ID:', result.leadId);
} else {
  console.error('Erro:', result.error);
}
```

## Tipos de Interação

| Tipo | Descrição |
|------|-----------|
| `contact_form` | Formulário de contato |
| `newsletter_subscription` | Inscrição newsletter |
| `event_registration` | Inscrição em evento |
| `donation` | Doação |
| `phone_call` | Ligação telefônica |
| `email` | Email |
| `meeting` | Reunião |
| `whatsapp` | WhatsApp |
| `signup` | Cadastro como usuário |

## Canais

| Canal | Descrição |
|-------|-----------|
| `website` | Site/formulários online |
| `email` | Email |
| `phone` | Telefone |
| `whatsapp` | WhatsApp |
| `presencial` | Atendimento presencial |
| `social_media` | Redes sociais |
| `referral` | Indicação |

## Exemplos de Integração

### 1. Formulário de Contato

```typescript
// src/pages/Contato.tsx
import { registerCRMInteraction, INTERACTION_TYPES, CHANNELS } from '@/lib/crmIntegration';

const handleSubmit = async (data: FormData) => {
  // 1. Envia o formulário
  const response = await sendContactForm(data);
  
  // 2. Registra no CRM
  await registerCRMInteraction(
    {
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf
    },
    {
      type: INTERACTION_TYPES.CONTACT_FORM,
      channel: CHANNELS.WEBSITE,
      description: `Assunto: ${data.subject}\n\n${data.message}`,
      formSource: 'contato'
    }
  );
};
```

### 2. Newsletter

```typescript
// src/components/NewsletterForm.tsx
import { registerCRMInteraction, INTERACTION_TYPES, CHANNELS } from '@/lib/crmIntegration';

const handleSubscribe = async (email: string, name?: string) => {
  // 1. Inscreve na newsletter
  await subscribeNewsletter(email, name);
  
  // 2. Registra no CRM
  await registerCRMInteraction(
    {
      name: name || email.split('@')[0],
      email: email
    },
    {
      type: INTERACTION_TYPES.NEWSLETTER_SUBSCRIPTION,
      channel: CHANNELS.WEBSITE,
      description: 'Inscrito na newsletter',
      formSource: 'newsletter'
    }
  );
};
```

### 3. Inscrição em Evento

```typescript
// src/components/EventRegistrationForm.tsx
import { registerCRMInteraction, INTERACTION_TYPES, CHANNELS } from '@/lib/crmIntegration';

const handleEventRegistration = async (data: RegistrationData, event: Event) => {
  // 1. Cria a inscrição
  await createRegistration(data, event.id);
  
  // 2. Registra no CRM
  await registerCRMInteraction(
    {
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf
    },
    {
      type: INTERACTION_TYPES.EVENT_REGISTRATION,
      channel: CHANNELS.WEBSITE,
      description: `Inscrição no evento: ${event.title}`,
      formSource: 'event_registration',
      activityName: event.title,
      activityPaid: !event.free,
      activityOnline: event.format === 'online',
      costCenterId: event.cost_center_id
    }
  );
};
```

### 4. Formulário de Doação

```typescript
// src/components/DonationForm.tsx
import { registerCRMInteraction, INTERACTION_TYPES, CHANNELS } from '@/lib/crmIntegration';

const handleDonation = async (data: DonationData) => {
  // 1. Processa a doação
  const donation = await createDonation(data);
  
  // 2. Registra no CRM
  await registerCRMInteraction(
    {
      name: data.donorName,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf
    },
    {
      type: INTERACTION_TYPES.DONATION,
      channel: CHANNELS.WEBSITE,
      description: `Doação de R$ ${data.amount} - ${data.campaign || 'Geral'}`,
      formSource: 'donation',
      metadata: {
        amount: data.amount,
        campaign: data.campaign,
        donation_id: donation.id
      }
    }
  );
};
```

## Fluxo de Dados

```
Formulário
    │
    ▼
registerCRMInteraction()
    │
    ├─── Busca lead/user por email ou CPF
    │
    ├─── Se não existe: Cria novo lead
    │
    ├─── Registra interação em crm_interactions
    │
    └─── Retorna { success, leadId }
```

## Tratamento de Erros

```typescript
try {
  const result = await registerCRMInteraction(contactData, interactionData);
  
  if (!result.success) {
    // Log do erro (não bloqueia o fluxo principal)
    console.error('CRM Error:', result.error);
  }
} catch (error) {
  // Falha silenciosa - não impede o formulário de funcionar
  console.error('CRM Integration failed:', error);
}
```

## Boas Práticas

1. **Sempre inclua o CPF quando disponível**: Permite unificar interações do mesmo contato
2. **Use os tipos padrão**: `INTERACTION_TYPES` e `CHANNELS` garantem consistência
3. **Não bloqueie o formulário**: Erros do CRM não devem impedir o envio
4. **Registre metadados relevantes**: IDs de transações, valores, etc.
5. **Identifique o formulário de origem**: Use `formSource` para rastrear

## Triggers Automáticos

Alguns eventos são registrados automaticamente via triggers no banco:

| Evento | Trigger |
|--------|---------|
| Novo usuário criado | `on_auth_user_created` |
| Nova inscrição em evento | `on_event_registration` |
| Nova doação confirmada | `on_donation_confirmed` |

## Debugging

Para depurar integrações:

1. Verifique os logs do console
2. Consulte a tabela `crm_interactions` no Supabase
3. Use o perfil 360° do contato em `/admin/crm/contatos`
