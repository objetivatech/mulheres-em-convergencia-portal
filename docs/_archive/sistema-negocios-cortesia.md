# Sistema de Negócios Cortesia (Gratuitos)

## Visão Geral

O Sistema de Negócios Cortesia permite que administradores concedam acesso gratuito a negócios específicos no portal, mantendo-os sempre ativos independentemente do status de assinatura do usuário.

## Objetivo

Permitir a **fidelização de usuários** através da concessão de negócios gratuitos, sem gerar cobranças e sem interferir no sistema de assinaturas existente.

## Como Funciona

### Lógica de Ativação

Um negócio no portal pode estar ativo de duas formas:

1. **Assinatura Normal**: 
   - `subscription_active = true`
   - `subscription_renewal_date > hoje`
   - Depende de pagamentos recorrentes

2. **Cortesia (Novo)**:
   - `is_complimentary = true`
   - **Sempre ativo**, independente de assinatura
   - Não gera cobranças
   - Não depende de renovações

### Prioridade

```
SE is_complimentary = true:
  → Negócio SEMPRE ATIVO
SENÃO:
  → Seguir lógica normal de assinatura
```

## Implementação Técnica

### 1. Banco de Dados

**Nova coluna na tabela `businesses`:**

```sql
is_complimentary BOOLEAN NOT NULL DEFAULT false
```

**Função auxiliar:**

```sql
CREATE FUNCTION is_business_active(business_uuid UUID)
RETURNS BOOLEAN
AS $$
  -- Se é cortesia, retorna TRUE
  -- Senão, verifica assinatura normal
$$;
```

### 2. Interface Administrativa

**Localização**: `/admin/users` → Botão "Gerenciar Negócios"

**Funcionalidades**:

- ✅ Visualizar todos os negócios do usuário
- ✅ Marcar/desmarcar negócios como cortesia
- ✅ Ver status atual (ativo/inativo)
- ✅ Ver data de renovação (se não for cortesia)
- ✅ Badge visual "Cortesia (Gratuito)"

**Componente**: `ComplimentaryBusinessManager.tsx`

### 3. Fluxo de Uso

#### Cenário 1: Liberar cortesia ANTES da assinatura

```
1. Usuário se cadastra
2. Admin acessa /admin/users
3. Clica em "Gerenciar Negócios"
4. Usuario ainda não tem negócios
5. Admin pode criar negócio para o usuário (via outro fluxo)
6. Admin marca como cortesia
→ Negócio fica ativo sem necessidade de pagamento
```

#### Cenário 2: Liberar cortesia DEPOIS da assinatura

```
1. Usuário já tem assinatura ativa
2. Possui negócios cadastrados
3. Admin acessa /admin/users
4. Clica em "Gerenciar Negócios"
5. Ativa switch de "Cortesia" no negócio desejado
→ Negócio continua ativo MESMO se assinatura expirar
→ Usuário não é mais cobrado por este negócio
```

#### Cenário 3: Remover cortesia

```
1. Admin desativa switch de "Cortesia"
2. Negócio volta a depender de assinatura
3. SE não houver assinatura ativa:
   → Negócio é desativado automaticamente
```

## Interface do Admin

### Botão no UserManagement

```tsx
<Button onClick={() => handleManageBusinesses(user)}>
  <Gift className="h-4 w-4 mr-1" />
  Gerenciar Negócios
</Button>
```

### Dialog de Gerenciamento

- **Título**: "Gerenciar Negócios e Cortesias"
- **Lista**: Todos os negócios do usuário
- **Para cada negócio**:
  - Nome e categoria
  - Status atual (Ativo/Inativo)
  - Data de renovação (se aplicável)
  - Switch "Liberar Cortesia"
  - Badge "Cortesia (Gratuito)" quando ativo

### Confirmação

Ao ativar/desativar cortesia, mostra AlertDialog com:

**Ao ATIVAR:**
```
✓ O usuário não será cobrado por este negócio
✓ O negócio permanecerá ativo mesmo sem pagamentos
```

**Ao DESATIVAR:**
```
⚠️ Se não houver assinatura ativa, o negócio será desativado
```

## Impacto Zero no Sistema Existente

### ✅ Mantém intacto

- Sistema de assinaturas recorrentes
- Webhooks do ASAAS
- Renovações automáticas a cada 31 dias
- Lógica de pagamentos
- Edge functions existentes
- Relatórios e analytics

### ✅ Adiciona apenas

- Nova coluna `is_complimentary`
- Nova interface administrativa
- Nova função `is_business_active()`
- Documentação

### ✅ Não interfere em

- Cobrança de usuários com assinatura normal
- Processamento de pagamentos
- Renovação de negócios pagos
- Qualquer funcionalidade existente

## Benefícios

1. **Fidelização**: Premiar usuários estratégicos
2. **Flexibilidade**: Admin tem controle total
3. **Não-destrutivo**: Zero impacto no código existente
4. **Reversível**: Pode remover cortesia a qualquer momento
5. **Auditável**: Fácil identificar negócios cortesia
6. **Escalável**: Suporta múltiplos negócios por usuário

## Casos de Uso

### 1. Parceria Estratégica
```
Empresa parceira = negócio cortesia permanente
```

### 2. Período Promocional
```
Cliente especial = 3 meses cortesia
Depois = voltar a cobrar
```

### 3. Compensação
```
Problema técnico = 1 mês cortesia como compensação
```

### 4. Embaixadoras/Influencers
```
Programa de embaixadoras = negócio cortesia enquanto ativas
```

## Monitoramento

### Queries úteis

**Listar todos os negócios cortesia:**
```sql
SELECT b.id, b.name, p.email, p.full_name
FROM businesses b
JOIN profiles p ON p.id = b.owner_id
WHERE b.is_complimentary = true;
```

**Contagem por usuário:**
```sql
SELECT 
  owner_id,
  COUNT(*) as total_businesses,
  COUNT(*) FILTER (WHERE is_complimentary) as complimentary_count
FROM businesses
GROUP BY owner_id
HAVING COUNT(*) FILTER (WHERE is_complimentary) > 0;
```

**Total de cortesias ativas:**
```sql
SELECT COUNT(*) FROM businesses WHERE is_complimentary = true;
```

## Segurança

- ✅ Apenas admins podem gerenciar cortesias
- ✅ RLS policies mantidas
- ✅ Audit trail no admin_audit_log (futuro)
- ✅ Não expõe informação sensível
- ✅ Validação server-side

## Limitações Conhecidas

1. **Não há limite**: Admin pode marcar quantos negócios quiser como cortesia
   - Solução futura: Adicionar limite por usuário ou global

2. **Sem histórico**: Não registra quando cortesia foi ativada/desativada
   - Solução futura: Adicionar campo `complimentary_granted_at`

3. **Sem expiração**: Cortesia não expira automaticamente
   - Solução futura: Adicionar `complimentary_expires_at`

## Próximos Passos (Opcionais)

- [ ] Adicionar badge "Cortesia" nos cards de negócio no diretório
- [ ] Relatório de negócios cortesia no dashboard admin
- [ ] Histórico de alterações de cortesia
- [ ] Limite de cortesias por usuário
- [ ] Expiração automática de cortesias temporárias
- [ ] Notificação ao usuário quando recebe cortesia

## Conclusão

O Sistema de Negócios Cortesia é uma solução elegante e não-invasiva que:

✅ Atende à necessidade de fidelização  
✅ Mantém o sistema existente intacto  
✅ É facilmente gerenciável pelos admins  
✅ Pode ser expandido no futuro  

**Status**: ✅ Implementado e funcional
