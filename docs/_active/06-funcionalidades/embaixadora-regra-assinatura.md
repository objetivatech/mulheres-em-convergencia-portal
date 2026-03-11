# Regra de Negócio: Embaixadora Requer Assinatura Ativa de Negócio

## Visão Geral

A partir desta atualização, o perfil de embaixadora só pode estar ativo (`active = true`) se a usuária possuir ao menos um negócio com assinatura ativa (`subscription_active = true`) no diretório.

## Implementação

### Banco de Dados

**Trigger**: `trg_validate_ambassador_business` na tabela `ambassadors`  
**Função**: `validate_ambassador_business_subscription()` (SECURITY DEFINER)

- Executada em `BEFORE INSERT OR UPDATE`
- Valida apenas quando `NEW.active = true`
- Verifica se existe registro em `businesses` onde `owner_id = user_id` e `subscription_active = true`
- Lança exceção se não houver negócio com assinatura ativa

### Frontend

**Dashboard da Embaixadora** (`src/pages/EmbaixadoraDashboard.tsx`):
- Exibe alerta visual (`Alert` com `variant="destructive"`) quando `hasActiveBusiness === false`
- Inclui link para o diretório para criação/ativação de negócio

### Impacto

- Embaixadoras existentes sem negócio ativo **não são desativadas automaticamente** — a validação ocorre apenas em novas inserções ou atualizações
- Para desativar manualmente, o admin pode alterar `active = false` no painel
- A Edge Function de ativação de embaixadoras deve respeitar a mesma regra (validação no trigger garante isso)

## Fluxo Esperado

1. Usuária solicita ser embaixadora
2. Admin verifica se ela tem negócio com assinatura ativa
3. Se sim, ativa perfil → trigger permite
4. Se não, trigger bloqueia e retorna erro
5. Dashboard exibe alerta orientando a criação do negócio
