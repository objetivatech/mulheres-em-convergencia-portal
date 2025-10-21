# Sistema de Contato para Negócios

## Visão Geral
Sistema completo de contato para negócios no Portal Mulheres em Convergência, permitindo que clientes enviem mensagens diretamente para empresas e que proprietários gerenciem essas conversas.

## Funcionalidades Implementadas

### 1. Estrutura do Banco de Dados

#### Tabela `business_messages`
- `id`: UUID (PK)
- `business_id`: UUID (FK para businesses)
- `sender_name`: TEXT (nome do remetente)
- `sender_email`: TEXT (email do remetente)
- `subject`: TEXT (assunto da mensagem)
- `message`: TEXT (conteúdo da mensagem)
- `status`: TEXT (unread/read)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### Tabela `business_message_replies`
- `id`: UUID (PK)
- `message_id`: UUID (FK para business_messages)
- `sender_name`: TEXT
- `sender_email`: TEXT
- `reply_text`: TEXT
- `is_business_owner`: BOOLEAN
- `created_at`: TIMESTAMP

### 2. Edge Function: `send-business-message`

**Localização**: `supabase/functions/send-business-message/index.ts`

**Funcionalidades**:
- Valida dados de entrada
- Verifica se a empresa existe
- Salva mensagem no banco de dados
- Atualiza métricas de contato
- Preparado para integração com MailRelay

**Exemplo de uso**:
```typescript
const { data, error } = await supabase.functions.invoke('send-business-message', {
  body: {
    business_id: "uuid-da-empresa",
    sender_name: "João Silva",
    sender_email: "joao@email.com",
    subject: "Interesse em serviços",
    message: "Gostaria de saber mais sobre..."
  }
});
```

### 3. Componentes React

#### `BusinessContactForm`
**Localização**: `src/components/business/BusinessContactForm.tsx`

- Formulário responsivo para contato
- Validação de campos obrigatórios
- Feedback visual durante envio
- Integração com toast notifications

#### `BusinessMessages`
**Localização**: `src/components/business/BusinessMessages.tsx`

- Lista mensagens recebidas
- Marca mensagens como lidas
- Sistema de respostas
- Visualização de conversas
- Interface tempo real

### 4. Dashboard da Empresa

**Localização**: `src/pages/DashboardEmpresa.tsx`

**Melhorias implementadas**:
- Nova aba "Mensagens" no dashboard
- Métricas reais de contato (não mais template)
- Status correto de assinaturas canceladas
- Visualização de período de graça (31 dias)

### 5. Políticas RLS (Row Level Security)

#### business_messages
- **SELECT**: Proprietários podem ver mensagens de seus negócios
- **UPDATE**: Proprietários podem atualizar status das mensagens
- **INSERT**: Qualquer pessoa pode enviar mensagens

#### business_message_replies
- **SELECT**: Proprietários e remetentes podem ver respostas
- **INSERT**: Proprietários podem responder mensagens

### 6. Analytics em Tempo Real

**Hook personalizado**: `src/hooks/useBusinessAnalytics.ts`

- Rastreamento de visualizações
- Rastreamento de cliques
- Métricas agregadas dos últimos 30 dias
- Funções para incrementar contadores

## Integração com MailRelay

### Status Atual
- Edge function preparada para integração
- Estrutura de dados suporta notificações
- TODO: Implementar envio de emails via MailRelay API

### Próximos Passos para MailRelay
1. Configurar templates de email
2. Implementar notificações automáticas
3. Sistema de resposta por email
4. Sincronização com campanhas

## Segurança

### Validações Implementadas
- Validação de campos obrigatórios
- Sanitização de entrada
- Rate limiting (a ser implementado)
- Verificação de empresa ativa

### RLS Policies
- Isolamento de dados por empresa
- Controle de acesso granular
- Proteção contra vazamento de dados

## Melhorias no Sistema de Avaliações

### Edge Function Corrigida
- Retorna sempre status 200 com `success: boolean`
- Melhor tratamento de erros
- Logs detalhados para debugging

### ReviewForm Atualizada
- Tratamento correto de respostas da API
- Feedback específico para diferentes tipos de erro
- Interface mais robusta

## Correções na Dashboard

### Status de Assinatura
- Exibe corretamente assinaturas canceladas
- Mostra período de graça de 31 dias
- Visual diferenciado para status cancelado

### Métricas Reais
- Dados baseados em interações reais
- Remoção de percentuais fictícios
- Integração com sistema de analytics

## Documentação Técnica

### APIs Utilizadas
- Supabase Edge Functions
- Supabase Database
- MailRelay API (preparado)

### Estrutura de Arquivos
```
src/
├── components/business/
│   ├── BusinessContactForm.tsx
│   └── BusinessMessages.tsx
├── hooks/
│   └── useBusinessAnalytics.ts
└── pages/
    └── DashboardEmpresa.tsx

supabase/functions/
└── send-business-message/
    └── index.ts
```

## Testes e Validação

### Testes Realizados
- ✅ Envio de mensagens
- ✅ Armazenamento no banco
- ✅ Interface de gerenciamento
- ✅ Status de assinatura
- ✅ Métricas atualizadas

### Próximos Testes
- [ ] Integração MailRelay
- [ ] Performance com volume alto
- [ ] Notificações em tempo real
- [ ] Backup e recuperação

## Manutenção

### Logs Importantes
- Mensagens enviadas: `send-business-message` logs
- Erros de validação: Console do navegador
- Métricas: `business_analytics` table

### Monitoramento
- Taxa de entrega de mensagens
- Tempo de resposta dos proprietários
- Volume de contatos por empresa
- Conversão de contatos em negócios