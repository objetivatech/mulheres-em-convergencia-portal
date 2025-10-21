# Sistema de Cortesia (Gratuidade) - Completo

## Visão Geral
Sistema completo para oferecer acesso gratuito a negócios específicos, com proteção contra cobranças automáticas e auditoria completa.

## Recursos Implementados

### 1. Campo `is_complimentary` na Tabela `businesses`
- **Tipo**: `BOOLEAN NOT NULL DEFAULT false`
- **Propósito**: Marcar negócios com acesso cortesia
- **Visibilidade**: Apenas para admins (não aparece no site público)

### 2. Função `is_business_active()` Atualizada
```sql
CREATE OR REPLACE FUNCTION public.is_business_active(business_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE
          -- Cortesias são sempre ativos
          WHEN is_complimentary = true THEN true
          -- Verifica assinatura
          WHEN subscription_active = true 
            AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
          THEN true
          ELSE false
        END
      FROM public.businesses
      WHERE id = business_uuid
    ),
    false
  );
$$;
```

### 3. Proteção no Webhook ASAAS
O webhook agora verifica se o usuário tem negócios cortesia ANTES de processar pagamentos:

```typescript
// Em asaas-webhook/index.ts
const { data: complimentaryBusinesses } = await supabaseClient
  .from('businesses')
  .select('id, name')
  .eq('owner_id', subscription.user_id)
  .eq('is_complimentary', true);

if (complimentaryBusinesses && complimentaryBusinesses.length > 0) {
  // Pula processamento de pagamento
  return { success: true, message: "Payment skipped - complimentary" };
}
```

### 4. Interface Admin (`ComplimentaryBusinessManager.tsx`)

Funcionalidades:
- Lista todos os negócios de um usuário
- Toggle para ativar/desativar cortesia
- Diálogo de confirmação antes de mudanças
- Badge visual "Cortesia (Gratuito)"

### 5. Dashboard do Dono do Negócio (`DashboardEmpresa.tsx`)

Card especial para negócios cortesia:
- 🎁 Cor roxa (purple) para destaque
- Mensagem clara: "Acesso Cortesia (Gratuito)"
- Lista de benefícios
- Informação que não haverá cobranças

### 6. Auditoria Completa

Tabela `complimentary_audit_log`:
```sql
CREATE TABLE public.complimentary_audit_log (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT, -- 'enabled' ou 'disabled'
  previous_value BOOLEAN,
  new_value BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);
```

Trigger automático registra todas as mudanças em `is_complimentary`.

## Como Usar (Admin)

### 1. Acessar Gestão de Usuários
- Ir para `/admin/users`
- Encontrar o usuário desejado
- Clicar no botão "Gerenciar Negócios" (ícone Gift)

### 2. Ativar Cortesia
- Ver lista de negócios do usuário
- Clicar no switch ao lado do negócio
- Confirmar no diálogo que aparece
- ✅ Cortesia ativada!

### 3. Verificar Resultado
- O negócio fica permanentemente ativo
- Dono vê card especial na dashboard
- Nenhuma cobrança será gerada
- Auditoria registra a ação

## Garantias de Segurança

### ✅ Não Cobrança Garantida
1. **Função `is_business_active()`**: Cortesias sempre retornam `true`
2. **Webhook ASAAS**: Verifica cortesia ANTES de processar pagamento
3. **RLS Policies**: Apenas admins podem alterar `is_complimentary`

### ✅ Auditoria Completa
- Toda mudança de cortesia é registrada
- Sabe-se quem ativou/desativou
- Data/hora de cada ação
- Valores anteriores e novos

### ✅ Interface Clara
- Dono do negócio sabe que tem cortesia
- Mensagem explícita: "sem cobranças"
- Não aparece no site público

## Cenários de Uso

### Caso 1: Parceria Estratégica
Negócio parceiro recebe cortesia permanente como parte de acordo comercial.

### Caso 2: Reconhecimento Especial
Negócio com contribuição significativa à comunidade recebe cortesia.

### Caso 3: Programa Piloto
Primeiros negócios cadastrados recebem cortesia como early adopters.

### Caso 4: Apoio Social
Negócios de impacto social recebem cortesia para facilitar operação.

## Como Remover Cortesia

1. Admin acessa "Gerenciar Negócios" do usuário
2. Desativa o switch de cortesia
3. Confirma no diálogo
4. Negócio volta ao sistema normal de assinatura
5. Se não tiver assinatura ativa, será desativado

## Relatórios

Para ver todos os negócios cortesia:
```sql
SELECT 
  b.name,
  b.city,
  b.state,
  p.full_name as owner_name,
  p.email as owner_email,
  b.created_at
FROM businesses b
JOIN profiles p ON b.owner_id = p.id
WHERE b.is_complimentary = true
ORDER BY b.created_at DESC;
```

Para ver histórico de mudanças:
```sql
SELECT 
  b.name as business_name,
  p.full_name as admin_name,
  cal.action,
  cal.created_at
FROM complimentary_audit_log cal
JOIN businesses b ON cal.business_id = b.id
JOIN profiles p ON cal.admin_id = p.id
ORDER BY cal.created_at DESC
LIMIT 50;
```

## Testes Recomendados

1. ✅ Ativar cortesia e verificar que negócio fica ativo
2. ✅ Verificar que dono vê card especial na dashboard
3. ✅ Confirmar que webhook ASAAS não processa pagamentos
4. ✅ Verificar que auditoria registra mudanças
5. ✅ Tentar acessar como usuário comum (deve falhar)
6. ✅ Desativar cortesia e verificar que negócio volta ao normal
