# 📋 Migração de Planos de Assinatura

## Data da Migração
**14 de outubro de 2025**

---

## Problema Identificado

Negócios cadastrados antes de 14/10/2025 estavam com valores antigos de planos de assinatura:
- `basic` (antigo)
- `intermediate` (antigo)
- `premium` (antigo)
- `master` (antigo)

Esses valores antigos impediam que os negócios fossem exibidos corretamente nos showcases da página inicial, pois as funções SQL `get_random_businesses()` e `get_featured_businesses()` estavam configuradas para os novos valores.

---

## Solução Implementada

### Migration SQL Executada

```sql
-- Atualizar negócios com plano 'basic' para 'iniciante'
UPDATE public.businesses 
SET subscription_plan = 'iniciante'
WHERE subscription_plan = 'basic';

-- Atualizar variações de 'intermediate' para 'intermediario'
UPDATE public.businesses 
SET subscription_plan = 'intermediario'
WHERE subscription_plan IN ('intermediate', 'intermediário');

-- Atualizar variações de 'premium' para 'impulso'
UPDATE public.businesses 
SET subscription_plan = 'impulso'
WHERE subscription_plan IN ('impulse', 'premium', 'master');

-- Adicionar constraint para garantir apenas valores válidos
ALTER TABLE public.businesses
ADD CONSTRAINT businesses_subscription_plan_check
CHECK (subscription_plan IN ('iniciante', 'intermediario', 'impulso'));
```

---

## Mapeamento de Planos

| Valor Antigo | Novo Valor | Descrição |
|-------------|-----------|-----------|
| `basic` | `iniciante` | Plano básico de entrada |
| `intermediate` / `intermediário` | `intermediario` | Plano intermediário |
| `premium` / `impulse` / `master` | `impulso` | Plano premium/avançado |

---

## Impacto da Migração

### Antes da Migração
- ❌ Negócios com plano `basic` não apareciam em "Nossos Negócios"
- ❌ Funções SQL retornavam arrays vazios
- ❌ Página inicial sem showcases de negócios

### Após a Migração
- ✅ Negócios cortesia com plano `iniciante` aparecem em "Nossos Negócios"
- ✅ Negócios ativos com plano `iniciante` aparecem em "Nossos Negócios"
- ✅ Negócios com plano `intermediario` ou `impulso` aparecem em "Empreendedoras Destaque"
- ✅ Constraint garante que apenas valores válidos sejam aceitos no futuro

---

## Negócios Afetados

A migração atualizou automaticamente:
- **"Empresa de TESTE"**: `basic` → `iniciante` (cortesia)
- **"Loja da Rak"**: `basic` → `iniciante` (assinatura ativa)

Todos os negócios existentes foram migrados sem perda de dados.

---

## Validação Pós-Migração

### Checklist de Testes

- [x] Negócios cortesia com plano `iniciante` aparecem na capa
- [x] Negócios com assinatura ativa e plano `iniciante` aparecem na capa
- [x] Constraint impede inserção de valores inválidos
- [x] Funções SQL `get_random_businesses()` e `get_featured_businesses()` funcionam corretamente

### Consulta de Verificação

```sql
-- Verificar planos atuais dos negócios
SELECT 
  name,
  subscription_plan,
  is_complimentary,
  subscription_active
FROM public.businesses
ORDER BY created_at DESC;
```

---

## Prevenção de Problemas Futuros

### Constraint Adicionada
O sistema agora possui uma constraint que **valida** automaticamente os valores de `subscription_plan`:

```sql
CHECK (subscription_plan IN ('iniciante', 'intermediario', 'impulso'))
```

Isso significa que:
- ✅ Apenas os 3 valores válidos são aceitos
- ❌ Tentativas de inserir valores antigos são **rejeitadas**
- 🔒 Garante consistência de dados no banco

---

## Documentação Relacionada

- [Guia de Planos de Assinatura](./guia-planos-assinatura.md)
- [Sistema de Showcases](./sistema-showcases.md)
- [Histórico de Correções 2025](./historico-correcoes-2025.md)

---

## Notas Técnicas

### Funções SQL Atualizadas
- `get_random_businesses(limit_count)` - Filtra por plano `iniciante`
- `get_featured_businesses(limit_count)` - Filtra por planos `intermediario` e `impulso`

### Segurança
- Migration executada com `SECURITY DEFINER`
- Apenas administradoras podem modificar planos via interface
- RLS policies protegem operações sensíveis

---

**Status:** ✅ Migração concluída com sucesso  
**Reversível:** Não (constraint impede valores antigos)  
**Aprovada por:** Sistema Mulheres em Convergência  
**Data de execução:** 14/10/2025
