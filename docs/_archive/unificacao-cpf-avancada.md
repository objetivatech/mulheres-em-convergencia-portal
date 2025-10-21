# Sistema de Unificação por CPF Avançado

## Visão Geral

O sistema de unificação por CPF permite mesclar dados de usuários não autenticados com cadastros existentes, garantindo que todos os dados sejam consolidados em um único perfil baseado no CPF como identificador único.

## Funcionalidades Principais

### 1. Detecção Inteligente de CPF Duplicado

**Comportamento por contexto**:
- **Usuário logado**: Aviso sobre conflito, bloqueio de submissão
- **Usuário não logado**: Oferta de mesclagem inteligente de dados
- **CPF inválido**: Validação em tempo real com feedback

### 2. Interface de Mesclagem Interativa

**Recursos disponíveis**:
- Comparação lado-a-lado de dados existentes vs. novos
- Seleção granular de quais dados manter/atualizar
- Visualização clara de conflitos de informações
- Preservação de dados históricos (endereços, contatos)

### 3. Mesclagem Não-Destrutiva

**Princípios**:
- Nunca bloqueia criação de cadastro
- Sempre oferece opções de mesclagem
- Preserva dados existentes importantes
- Permite adição de novos dados ao perfil existente

## Implementação Técnica

### Componente Principal

#### `CpfMergeDialog`

**Localização**: `src/components/form/CpfMergeDialog.tsx`

**Props Principais**:
```typescript
interface CpfMergeDialogProps {
  open: boolean;
  existingUser: CpfUserData;          // Dados do usuário existente
  newUserData: {                      // Novos dados fornecidos
    name?: string;
    email?: string; 
    phone?: string;
    cpf: string;
  };
  existingAddresses?: UserAddress[];   // Endereços já cadastrados
  existingContacts?: UserContact[];    // Contatos já cadastrados
  onMerge: (selections: MergeSelections) => Promise<void>;
}
```

**Interface de Seleção**:
```typescript
interface MergeSelections {
  updateProfile: boolean;             // Permitir atualização do perfil
  keepExistingData: {                // Quais dados existentes manter
    name?: boolean;
    email?: boolean;
    phone?: boolean;
  };
  addNewData: {                      // Quais novos dados adicionar
    phone?: boolean;
    address?: boolean;
  };
  selectedAddresses: string[];        // IDs dos endereços para manter
  selectedContacts: string[];         // IDs dos contatos para manter
}
```

### Fluxo de Detecção e Mesclagem

#### 1. Validação de CPF no Formulário

```typescript
// CustomerInfoDialog.tsx
const validateCpf = async (cpf: string) => {
  if (!cpf || cpf.length < 11) return;
  
  const { data } = await supabase.rpc('get_user_by_cpf', { cpf_input: cpf });
  
  if (data && data.length > 0 && data[0].id !== user?.id) {
    setExistingUserData(data[0]);
    
    if (user) {
      // Usuário logado: apenas aviso
      setCpfExists(`CPF já cadastrado para ${data[0].full_name}`);
    } else {
      // Usuário não logado: oferecer mesclagem
      setCpfExists(`CPF já cadastrado para ${data[0].full_name}. Clique para mesclar dados.`);
    }
  } else {
    setCpfExists(null);
    setExistingUserData(null);
  }
};
```

#### 2. Interceptação de Submissão

```typescript
const handleSubmit = async (values: CustomerFormData) => {
  // Usuário logado com CPF conflitante: bloquear
  if (user && cpfExists && existingUserData) {
    return; 
  }

  // Usuário não logado com CPF existente: abrir diálogo de mesclagem
  if (!user && cpfExists && existingUserData) {
    setShowMergeDialog(true);
    return;
  }

  // Processar normalmente
  await onSubmit(values, signupData);
};
```

### Interface de Mesclagem

#### Seções do Diálogo

1. **Comparação de Dados Pessoais**
```jsx
<div className="grid md:grid-cols-2 gap-4">
  {/* Dados existentes */}
  <div>
    <h4>Dados Existentes</h4>
    <div>Nome: {existingUser.full_name}</div>
    <div>Email: {existingUser.email}</div>
    <div>CPF: {existingUser.cpf}</div>
  </div>
  
  {/* Dados novos */}
  <div>
    <h4>Dados Novos</h4>
    <div>Nome: {newUserData.name}</div>
    <div>Email: {newUserData.email}</div>
    <div>CPF: {newUserData.cpf}</div>
  </div>
</div>
```

2. **Resolução de Conflitos**
```jsx
{/* Apenas para dados conflitantes */}
{hasConflicts() && (
  <div>
    <h4>Resolver Conflitos:</h4>
    {newUserData.name !== existingUser.full_name && (
      <Checkbox
        checked={selections.keepExistingData.name}
        onCheckedChange={(checked) => toggleKeepExisting('name', !!checked)}
      >
        Manter nome existente: {existingUser.full_name}
      </Checkbox>
    )}
  </div>
)}
```

3. **Seleção de Endereços Existentes**
```jsx
{existingAddresses.map((address) => (
  <div key={address.id}>
    <Checkbox
      checked={selections.selectedAddresses.includes(address.id)}
      onCheckedChange={(checked) => toggleAddressSelection(address.id, checked)}
    />
    <div>
      {address.street}, {address.number} - {address.city}/{address.state}
      {address.is_primary && <Badge>Principal</Badge>}
    </div>
  </div>
))}
```

4. **Adição de Novos Dados**
```jsx
{newUserData.phone && (
  <Checkbox
    checked={selections.addNewData.phone}
    onCheckedChange={(checked) => toggleAddNew('phone', checked)}
  >
    Adicionar telefone: {newUserData.phone}
  </Checkbox>
)}
```

## Lógica de Mesclagem

### Estratégias de Resolução

#### 1. Dados Básicos do Perfil

**Regras**:
- **Nome**: Usuário escolhe manter existente ou atualizar
- **Email**: Similar ao nome, com validação de formato
- **CPF**: Sempre mantido (é o identificador único)
- **Dados não conflitantes**: Adicionados automaticamente

#### 2. Contatos e Endereços

**Comportamento**:
- **Endereços existentes**: Usuário escolhe quais manter
- **Contatos existentes**: Usuário escolhe quais manter
- **Novos endereços**: Sempre adicionados (nunca conflitam)
- **Novos contatos**: Adicionados com verificação de duplicatas

#### 3. Dados de Assinatura

**Processamento**:
- Mesclagem não interfere no fluxo de pagamento
- Dados mesclados são usados para criar/atualizar assinatura
- Histórico de atividades preservado no usuário existente

### Implementação da Mesclagem

```typescript
const handleCpfMerge = async (selections: MergeSelections) => {
  if (!existingUserData) return;
  
  try {
    // 1. Atualizar perfil básico se necessário
    const profileUpdates: any = {};
    
    if (!selections.keepExistingData.name && newUserData.name) {
      profileUpdates.full_name = newUserData.name;
    }
    
    if (!selections.keepExistingData.email && newUserData.email) {
      profileUpdates.email = newUserData.email;
    }
    
    if (Object.keys(profileUpdates).length > 0) {
      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', existingUserData.id);
    }
    
    // 2. Adicionar novos contatos se selecionados
    if (selections.addNewData.phone && newUserData.phone) {
      await supabase
        .from('user_contacts')
        .insert({
          user_id: existingUserData.id,
          contact_type: 'phone',
          contact_value: newUserData.phone,
          is_primary: false // Não assumir como principal
        });
    }
    
    // 3. Remover contatos/endereços não selecionados (opcional)
    // Implementar apenas se usuário solicitar explicitamente
    
    // 4. Log da operação
    await supabase.rpc('log_user_activity', {
      p_user_id: existingUserData.id,
      p_activity_type: 'data_merged',
      p_description: 'Dados mesclados via formulário de assinatura',
      p_metadata: {
        merged_data: selections,
        source: 'subscription_form'
      }
    });
    
    toast({
      title: 'Dados mesclados com sucesso',
      description: 'Os dados foram unificados no cadastro existente.',
    });
    
    setShowMergeDialog(false);
    
  } catch (error) {
    toast({
      title: 'Erro ao mesclar dados', 
      description: 'Não foi possível unificar os dados.',
      variant: 'destructive',
    });
  }
};
```

## Casos de Uso Detalhados

### Cenário 1: Dados Complementares

```
Usuário Existente:
- Nome: Maria Silva
- Email: maria@email.com  
- CPF: 123.456.789-01
- Telefone: (11) 9999-1111
- Endereço: Rua A, 123

Novos Dados:
- Nome: Maria Silva Santos (nome completo)
- Email: maria@email.com (mesmo)
- CPF: 123.456.789-01 (mesmo)
- Telefone: (11) 9999-2222 (novo número)

Resultado da Mesclagem:
✅ Atualizar nome para versão completa
✅ Manter email existente 
✅ Adicionar segundo telefone
✅ Manter endereço existente
```

### Cenário 2: Conflito de Dados

```
Usuário Existente:
- Nome: João Santos
- Email: joao@empresa.com
- CPF: 987.654.321-09

Novos Dados:  
- Nome: João Silva Santos (sobrenome diferente)
- Email: joao.pessoal@gmail.com (email pessoal)
- CPF: 987.654.321-09 (mesmo)

Opções Oferecidas:
□ Manter nome existente: João Santos
□ Atualizar para: João Silva Santos  
□ Manter email existente: joao@empresa.com
□ Adicionar email pessoal: joao.pessoal@gmail.com
```

### Cenário 3: Expansão de Cadastro

```
Usuário Existente:
- Dados básicos apenas
- Sem endereços cadastrados
- Sem contatos adicionais

Novos Dados:
- Endereço comercial completo
- Telefone WhatsApp Business
- Email corporativo

Resultado:
✅ Todos os novos dados são adicionados
✅ Perfil fica completo e enriquecido
✅ Usuário pode usar dados em futuros formulários
```

## Benefícios do Sistema

### Para o Usuário
- **Não perde dados**: Nunca precisa recriar cadastro
- **Controle total**: Escolhe exatamente quais dados manter/atualizar
- **Experiência fluida**: Processo de mesclagem é rápido e intuitivo
- **Transparência**: Vê exatamente o que será alterado

### Para o Sistema  
- **Integridade de dados**: CPF como chave única garantida
- **Redução de duplicatas**: Unificação automática de registros
- **Histórico preservado**: Logs de atividade mantidos no usuário correto
- **Flexibilidade**: Sistema não destrutivo permite reversão

### Para o Negócio
- **Dados mais ricos**: Perfis de usuário se tornam mais completos
- **Menor fricção**: Usuários não são impedidos de finalizar compras
- **Melhor experiência**: Processo transparente e controlado pelo usuário
- **Conformidade**: Respeita princípios de proteção de dados pessoais

## Monitoramento e Métricas

### Logs de Atividade

```sql
-- Consultar mesclagens realizadas
SELECT 
  created_at,
  activity_description,
  metadata->'merged_data' as selections,
  metadata->'source' as source
FROM user_activity_log 
WHERE activity_type = 'data_merged'
ORDER BY created_at DESC;
```

### Métricas de Sucesso

- **Taxa de mesclagem**: % de CPFs duplicados que resultam em mesclagem
- **Dados mais utilizados**: Quais tipos de dados são mais frequentemente mesclados
- **Tempo de decisão**: Quanto tempo usuários gastam na interface de mesclagem
- **Abandono**: % de usuários que cancelam o processo

---

*Documentação atualizada em: Janeiro 2024*
*Versão: 1.0*