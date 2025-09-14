# Sistema de Usuários Baseado em CPF - Documentação Completa

## Visão Geral

O sistema foi completamente reestruturado para usar o CPF como identificador principal dos usuários, permitindo maior controle, evitando duplicações e possibilitando análises demográficas precisas.

## Características Principais

### 1. CPF como Identificador Único
- **Obrigatório**: Todo usuário deve ter um CPF único
- **Formato padronizado**: XXX.XXX.XXX-XX
- **Validação completa**: Algoritmo de validação de CPF brasileiro
- **Geração automática**: Para registros antigos sem CPF, foram gerados CPFs fictícios baseados no ID

### 2. Múltiplos Contatos por Usuário
- **Tipos**: email, phone, whatsapp
- **Contato principal**: Apenas um contato por tipo pode ser marcado como principal
- **Verificação**: Sistema de verificação de contatos
- **Histórico**: Mantém histórico de todos os contatos

### 3. Múltiplos Endereços por Usuário
- **Tipos**: residential, commercial, billing, shipping
- **Endereço principal**: Apenas um endereço por tipo pode ser marcado como principal
- **Geolocalização**: Suporte a latitude/longitude
- **Migração**: Dados existentes de cidade/estado foram migrados

## Estrutura do Banco de Dados

### Tabela `profiles` (Modificada)
```sql
- cpf: TEXT NOT NULL UNIQUE (formato XXX.XXX.XXX-XX)
- email: TEXT (mantido para compatibilidade)
- full_name: TEXT
- phone: TEXT (mantido para compatibilidade)
- city: TEXT (mantido para compatibilidade)
- state: TEXT (mantido para compatibilidade)
```

### Nova Tabela `user_contacts`
```sql
- id: UUID PRIMARY KEY
- user_id: UUID REFERENCES profiles(id)
- contact_type: TEXT ('email', 'phone', 'whatsapp')
- contact_value: TEXT
- is_primary: BOOLEAN
- verified: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Nova Tabela `user_addresses`
```sql
- id: UUID PRIMARY KEY
- user_id: UUID REFERENCES profiles(id)
- address_type: TEXT ('residential', 'commercial', 'billing', 'shipping')
- street: TEXT
- number: TEXT
- complement: TEXT
- neighborhood: TEXT
- city: TEXT
- state: TEXT
- postal_code: TEXT
- country: TEXT DEFAULT 'Brasil'
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- is_primary: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Funções do Backend

### 1. `validate_cpf(cpf_input TEXT)`
Valida CPF usando algoritmo brasileiro completo.

### 2. `format_cpf(cpf_input TEXT)`
Formata CPF para padrão XXX.XXX.XXX-XX.

### 3. `get_user_by_cpf(cpf_input TEXT)`
Busca usuário por CPF, retornando dados básicos.

### 4. `upsert_user_by_cpf(cpf_input, user_email, user_full_name, user_phone)`
Cria ou atualiza usuário baseado em CPF. Se existir, atualiza dados; se não existir, cria novo.

## Hook Principal: `useCpfSystem`

### Utilitários CPF
```typescript
const { cpfUtils } = useCpfSystem();

// Limpar formatação
cpfUtils.clean("123.456.789-00") // "12345678900"

// Formatar para exibição
cpfUtils.format("12345678900") // "123.456.789-00"

// Validar formato
cpfUtils.isValidFormat("123.456.789-00") // true/false

// Aplicar máscara durante digitação
cpfUtils.applyMask("12345678900") // "123.456.789-00"
```

### Queries Principais
```typescript
const { 
  useUserByCpf,
  useUserContacts, 
  useUserAddresses 
} = useCpfSystem();

// Buscar usuário por CPF
const user = useUserByCpf("123.456.789-00");

// Buscar contatos do usuário
const contacts = useUserContacts(userId);

// Buscar endereços do usuário
const addresses = useUserAddresses(userId);
```

### Mutations Principais
```typescript
const {
  useUpsertUserByCpf,
  useAddContact,
  useUpdateContact,
  useRemoveContact,
  useAddAddress,
  useUpdateAddress,
  useRemoveAddress
} = useCpfSystem();

// Criar/atualizar usuário
const upsertUser = useUpsertUserByCpf();
await upsertUser.mutateAsync({
  cpf: "123.456.789-00",
  email: "user@email.com",
  fullName: "Nome Usuário",
  phone: "(11) 99999-9999"
});

// Adicionar contato
const addContact = useAddContact();
await addContact.mutateAsync({
  userId: "uuid",
  contactType: "email",
  contactValue: "novo@email.com",
  isPrimary: true
});
```

## Componente Principal: `CpfUserForm`

### Funcionalidades
- **Busca por CPF**: Interface para buscar usuário existente
- **Criação de usuário**: Formulário para criar novo usuário se não existir
- **Exibição de dados**: Mostra informações completas do usuário encontrado
- **Contatos e endereços**: Lista todos os contatos e endereços (opcional)

### Uso
```typescript
<CpfUserForm 
  onUserFound={(userId) => console.log('Usuário encontrado:', userId)}
  showContactsAndAddresses={true}
  allowCreate={true}
/>
```

### Props
- `onUserFound?: (userId: string) => void` - Callback quando usuário é encontrado
- `showContactsAndAddresses?: boolean` - Exibir contatos e endereços (padrão: true)
- `allowCreate?: boolean` - Permitir criação de novos usuários (padrão: true)

## Sistema Atualizado de Criação de Usuários Admin

### Nova Abordagem em Duas Etapas

#### Etapa 1: Buscar/Criar Usuário por CPF
- Busca usuário existente pelo CPF
- Se não existe, permite criar novo usuário com dados básicos
- Usa o componente `CpfUserForm`

#### Etapa 2: Definir Permissões e Acesso
- Define roles/permissões do usuário
- Cria conta de acesso ao sistema (email/senha para login)
- Usa a Edge Function `create-admin-user` para segurança

### Fluxo Atualizado
1. Admin digita CPF no painel
2. Sistema busca usuário existente
3. Se não existir, admin preenche dados básicos (nome, email, telefone)
4. Sistema cria/atualiza registro no banco
5. Admin define permissões (roles)
6. Admin define email/senha para acesso ao sistema
7. Sistema cria conta de acesso usando Edge Function segura

## Correções de Problemas

### 1. Página /diretorio em Branco ✅
**Problema**: `SelectItem` com `value=""` causava erro no Radix UI
**Solução**: Alterado para `value="all"` e ajustada lógica de filtros

### 2. Erro 403 na Criação de Usuários ✅
**Problema**: Frontend tentando usar `supabase.auth.admin.createUser()`
**Solução**: Criada Edge Function `create-admin-user` com privilégios adequados

### 3. Sistema CPF Implementado ✅
**Problema**: Necessidade de controle por CPF único
**Solução**: Sistema completo implementado com validação, formatação e estruturas relacionadas

## Migração de Dados

### Dados Existentes
- **CPFs nulos**: Foram gerados CPFs fictícios baseados no hash do ID
- **Emails existentes**: Migrados para `user_contacts` como principal
- **Telefones existentes**: Migrados para `user_contacts`  
- **Cidade/Estado**: Migrados para `user_addresses` como residencial principal

### Compatibilidade
- Campos originais mantidos na tabela `profiles` para compatibilidade
- Novos sistemas usam as tabelas `user_contacts` e `user_addresses`
- Migração gradual pode ser feita conforme necessário

## Segurança

### RLS (Row Level Security)
- **user_contacts**: Usuários só veem próprios contatos + admins veem tudo
- **user_addresses**: Usuários só veem próprios endereços + admins veem tudo
- **profiles**: Política existente mantida

### Validações
- **CPF**: Validação algorítmica completa no backend
- **Formato**: Constraint de formato no banco de dados
- **Unicidade**: Constraint de unicidade no CPF

### Edge Functions
- **create-admin-user**: Função segura para criação de contas por admins
- **Privilégios adequados**: Usa service_role apenas no backend

## Próximos Passos

### Implementações Futuras
1. **Interface de gestão de contatos**: ✅ **Implementado** - Componentes para gerenciar múltiplos contatos
2. **Interface de gestão de endereços**: ✅ **Implementado** - Componentes para gerenciar múltiplos endereços  
3. **Integração com CEP**: ✅ **Implementado** - API ViaCEP para autocompletar endereços
4. **Relatórios demográficos**: Aproveitar dados únicos por CPF
5. **Migração completa**: Gradualmente substituir campos antigos pelos novos

### Recentes Atualizações ✅

#### Sistema de Endereços Completo
- **AddressFormDialog**: Modal para adicionar/editar endereços com busca automática via CEP
- **AddressSelector**: Seletor de endereços existentes para uso em assinaturas
- **Tipos corretos**: Alterados para `residential`, `commercial`, `billing`, `shipping` (compatível com constraints do banco)

#### SEO e URLs Amigáveis
- **Roteamento**: Alterado de `/diretorio/:id` para `/diretorio/:slug`
- **RPCs criadas**:
  - `get_public_business_by_slug(p_slug text)`: Busca empresa por slug
  - `get_public_businesses()`: Atualizada para incluir slug
- **Analytics**: Contadores via `update_business_analytics` RPC ao invés de updates diretos
- **Navegação**: Todos os links usando slug ao invés de ID

### Melhorias de UX
1. **Validação em tempo real**: ✅ **Implementado** - CPF e endereços validados durante digitação
2. **Busca inteligente**: Busca por nome, email ou CPF
3. **Histórico de alterações**: Auditoria de mudanças nos dados
4. **Verificação de contatos**: Sistema de confirmação por email/SMS

## Advertência de Segurança

Existe 1 warning de segurança restante que precisa ser resolvido pelo usuário:

**Leaked Password Protection Disabled**: O Supabase está com proteção contra senhas vazadas desabilitada. Para habilitar:

1. Acesse o dashboard do Supabase
2. Vá em Authentication > Settings
3. Habilite "Password Strength" e "Leaked Password Protection"
4. Configure as políticas de senha conforme necessário

Este é um setting de segurança importante que deve ser habilitado em produção.