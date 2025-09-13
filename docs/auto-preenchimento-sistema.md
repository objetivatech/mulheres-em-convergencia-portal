# Sistema de Auto-preenchimento Inteligente

## Visão Geral

O sistema de auto-preenchimento inteligente permite que usuários logados tenham seus formulários preenchidos automaticamente com dados já cadastrados no sistema, incluindo endereços, contatos e informações pessoais.

## Funcionalidades Principais

### 1. Auto-preenchimento Automático

**Para usuários logados**:
- Dados do perfil são preenchidos automaticamente
- Endereço principal é selecionado automaticamente
- Telefone principal é preenchido automaticamente
- Dados são sincronizados em tempo real

### 2. Seleção de Endereços Múltiplos

**Interface de seleção**:
- Lista todos os endereços cadastrados do usuário
- Permite escolher qual endereço usar no formulário
- Opção de "usar novo endereço" sempre disponível
- Identificação visual de endereço principal

### 3. Seleção de Contatos Múltiplos

**Gerenciamento de contatos**:
- Lista telefones, emails e WhatsApp cadastrados
- Seleção por tipo específico (phone, email, whatsapp)
- Identificação visual de contato principal e verificado
- Opção de adicionar novo contato

## Implementação Técnica

### Hooks Personalizados

#### 1. `useSmartFormFiller`

**Localização**: `src/hooks/useSmartFormFiller.ts`

**Funcionalidades**:
```typescript
// Auto-preenchimento inteligente
const {
  // Dados
  smartData,
  loading,
  
  // Endereços
  hasAddresses,
  getAddressSuggestions,
  selectAddress,
  getPrimaryAddress,
  
  // Contatos  
  hasContacts,
  hasPhoneContacts,
  getContactSuggestions,
  selectContact,
  getPrimaryPhone,
  
  // Helpers
  getFormValues,
  autoFillPrimary,
} = useSmartFormFiller();
```

**Recursos**:
- Carrega automaticamente dados de usuários logados
- Gerencia seleções de endereços e contatos
- Fornece valores formatados para formulários
- Auto-preenchimento com dados primários

### Componentes de Interface

#### 1. `AddressSelector`

**Localização**: `src/components/form/AddressSelector.tsx`

**Props**:
```typescript
interface AddressSelectorProps {
  addresses: AddressOption[];      // Lista de endereços disponíveis
  selectedId?: string;            // ID do endereço selecionado
  onSelect: (id: string) => void; // Callback de seleção
  onNewAddress?: () => void;      // Callback para novo endereço
  title?: string;                 // Título personalizado
}
```

**Recursos**:
- Radio buttons para seleção única
- Exibição detalhada de cada endereço
- Identificação visual de endereço principal
- Opção integrada para "novo endereço"

#### 2. `ContactSelector`

**Localização**: `src/components/form/ContactSelector.tsx`

**Props**:
```typescript
interface ContactSelectorProps {
  contacts: ContactOption[];        // Lista de contatos disponíveis
  selectedId?: string;             // ID do contato selecionado
  onSelect: (id: string) => void;  // Callback de seleção
  type?: 'phone' | 'email' | 'all'; // Filtro por tipo
  onNewContact?: () => void;       // Callback para novo contato
}
```

**Recursos**:
- Filtragem por tipo de contato
- Ícones visuais para cada tipo (telefone, email, WhatsApp)
- Badges para contato principal e verificado
- Suporte a múltiplos tipos simultaneamente

### Integração com Formulários

#### Exemplo de Uso no `CustomerInfoDialog`

```typescript
// Hook de auto-preenchimento
const {
  hasAddresses,
  hasPhoneContacts, 
  getAddressSuggestions,
  getContactSuggestions,
  selectAddress,
  selectContact,
  getFormValues,
  autoFillPrimary,
} = useSmartFormFiller();

// Auto-preenchimento ao abrir diálogo
useEffect(() => {
  if (open && user) {
    // Combina dados do perfil com auto-preenchimento inteligente
    const smartValues = autoFillPrimary();
    
    form.reset({
      // Dados básicos do perfil
      name: userProfile?.full_name || '',
      cpfCnpj: userProfile?.cpf || '',
      
      // Auto-preenchimento inteligente
      phone: smartValues.phone || userProfile?.phone || '',
      address: smartValues.address || '',
      city: smartValues.city || userProfile?.city || '',
      // ... outros campos
    });
  }
}, [open, user, userProfile, autoFillPrimary]);

// Handlers para seleção
const handleAddressSelect = (addressId: string | null) => {
  selectAddress(addressId);
  const values = getFormValues();
  
  // Atualiza campos do formulário
  if (values.address) form.setValue('address', values.address);
  if (values.city) form.setValue('city', values.city);
  // ... outros campos
};

const handleContactSelect = (contactId: string | null) => {
  selectContact(contactId);
  const values = getFormValues();
  
  if (values.phone) form.setValue('phone', values.phone);
};
```

#### Renderização Condicional

```jsx
{/* Seletor de telefone - apenas para usuários com contatos */}
{user && hasPhoneContacts() && (
  <ContactSelector
    contacts={getContactSuggestions('phone')}
    onSelect={handleContactSelect}
    type="phone"
    className="mt-2"
  />
)}

{/* Seletor de endereço - apenas para usuários com endereços */}
{user && hasAddresses() && (
  <AddressSelector
    addresses={getAddressSuggestions()}
    onSelect={handleAddressSelect}
    title="Usar endereço cadastrado"
    className="mt-4"
  />
)}
```

## Fluxo de Funcionamento

### 1. Inicialização

1. **Usuário abre formulário**
   - `useSmartFormFiller` carrega dados do usuário
   - Hook busca endereços e contatos via `useCpfSystem`
   - Identifica dados primários automaticamente

2. **Auto-preenchimento inicial**
   - `autoFillPrimary()` preenche campos com dados principais
   - Formulário é resetado com valores combinados
   - Seletores são inicializados (se há dados disponíveis)

### 2. Interação do Usuário

1. **Seleção de endereço**
   - Usuário escolhe endereço na lista ou "novo endereço"
   - `selectAddress()` atualiza estado interno
   - `getFormValues()` retorna valores do endereço selecionado
   - Campos do formulário são atualizados automaticamente

2. **Seleção de contato**
   - Similar ao endereço, mas para contatos
   - Suporte a tipos específicos (phone, email, whatsapp)
   - Atualização automática dos campos relacionados

### 3. Submissão

1. **Validação**
   - Dados selecionados são validados junto com novos dados
   - Campos preenchidos automaticamente passam por validação normal

2. **Processamento**
   - Formulário processa dados combinados (perfil + seleções + novos dados)
   - Sistema salva novos dados se fornecidos pelo usuário

## Casos de Uso

### Cenário 1: Usuário com Dados Completos

```
Usuário: João Silva
Endereços: 2 (residencial, comercial)  
Contatos: 3 (2 telefones, 1 email)

Comportamento:
✅ Auto-preenchimento com endereço principal
✅ Auto-preenchimento com telefone principal  
✅ Seletores aparecem com opções disponíveis
✅ Usuário pode alternar entre dados salvos
```

### Cenário 2: Usuário com Dados Parciais

```
Usuário: Maria Santos
Endereços: 0
Contatos: 1 (telefone)

Comportamento:
✅ Auto-preenchimento apenas com telefone
❌ Seletor de endereço não aparece
✅ Seletor de telefone aparece
✅ Usuário preenche endereço manualmente
```

### Cenário 3: Usuário Sem Dados Adicionais

```
Usuário: Ana Costa  
Endereços: 0
Contatos: 0

Comportamento:
✅ Auto-preenchimento apenas com dados do perfil
❌ Nenhum seletor aparece
✅ Usuário preenche tudo manualmente
✅ Dados são salvos para próximo uso
```

## Vantagens para UX

### Para o Usuário
- **Conveniência**: Não precisa digitar dados já cadastrados
- **Rapidez**: Formulários preenchidos em segundos
- **Precisão**: Reduz erros de digitação
- **Flexibilidade**: Pode escolher entre múltiplos endereços/contatos

### Para o Sistema
- **Consistência**: Reutilização de dados já validados
- **Histórico**: Manutenção do histórico de endereços e contatos
- **Validação**: Dados previamente validados são confiáveis
- **Análise**: Melhor compreensão do comportamento do usuário

## Extensibilidade

### Novos Tipos de Dados

O sistema pode ser facilmente estendido para outros tipos:

```typescript
// Exemplo: Dados de empresas
const useBusinessSelector = () => {
  // Similar ao AddressSelector
  // Para usuários com múltiplas empresas
};

// Exemplo: Cartões de crédito
const usePaymentMethodSelector = () => {
  // Para usuários com múltiplos cartões
  // Incluindo mascaramento de dados sensíveis
};
```

### Integração com Outros Formulários

```typescript
// Qualquer formulário pode usar o sistema
const FormularioContrato = () => {
  const smartFiller = useSmartFormFiller();
  
  // Mesmo padrão de auto-preenchimento
  // Mesmos componentes de seleção
  // Mesma experiência do usuário
};
```

## Configuração e Manutenção

### Dependências
- `@tanstack/react-query`: Cache e sincronização de dados
- `react-hook-form`: Gerenciamento de formulários
- Hooks `useCpfSystem`: Integração com dados do usuário

### Monitoramento
- Logs de auto-preenchimento via `user_activity_log`
- Métricas de uso dos seletores
- Taxa de utilização vs. inserção manual

---

*Documentação atualizada em: Janeiro 2024*
*Versão: 1.0*