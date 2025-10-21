# Histórico de Correções - 2025

## Outubro 2025

### 📅 [14/10/2025] Sistema de Parceiros e Apoiadores - Implementação Completa

#### 📦 Componentes Criados

**Backend:**
- ✅ Tabela `partners` com campos expandidos:
  - Campos básicos: `name`, `logo_url`, `website_url`, `active`, `display_order`
  - Campos adicionais: `description`, `partnership_type`, `start_date`, `contact_email`
  - Campo JSONB: `social_links` (Instagram, LinkedIn, Facebook)
- ✅ Bucket `partner-logos` no Supabase Storage
- ✅ RLS policies para upload e visualização de logos
- ✅ Compactação automática de imagens via `optimize-image`

**Frontend:**
- ✅ `PartnersCarousel.tsx` - Carrossel auto-play com logos
- ✅ `PartnerModal.tsx` - Modal com detalhes completos
- ✅ `PartnersManagement.tsx` - Interface admin com drag-and-drop
- ✅ `ImageUploader` integrado para upload otimizado

**Integração:**
- ✅ Carrossel na página inicial (após Hero)
- ✅ Carrossel na página Sobre (após valores)
- ✅ Rota `/admin/parceiros` no painel administrativo

#### 🎨 Funcionalidades

**Para Administradoras:**
- Upload de logos com compactação automática
- Arrastar e soltar para reordenar
- Ativar/desativar parceiros
- Gerenciar informações completas (descrição, contatos, redes sociais)

**Para Visitantes:**
- Carrossel responsivo (3-7 logos visíveis)
- Auto-play com pausa no hover
- Modal com detalhes ao clicar no logo
- Links para site e redes sociais

#### 📚 Documentação Criada
- `docs/guia-admin-parceiros.md` - Guia completo de uso
- `docs/migracao-planos-2025.md` - Detalhes da migração de planos

---

### 📅 [14/10/2025] Migração de Planos de Assinatura

#### 🔄 Problema Identificado
Negócios cadastrados antes de 14/10/2025 usavam valores antigos de planos (`basic`, `intermediate`, `premium`), impedindo exibição nos showcases da capa.

#### ✅ Solução Implementada

**Migration SQL:**
```sql
UPDATE businesses SET subscription_plan = 'iniciante' WHERE subscription_plan = 'basic';
UPDATE businesses SET subscription_plan = 'intermediario' WHERE subscription_plan IN ('intermediate', 'intermediário');
UPDATE businesses SET subscription_plan = 'impulso' WHERE subscription_plan IN ('impulse', 'premium', 'master');
```

**Constraint Adicionada:**
```sql
ALTER TABLE businesses
ADD CONSTRAINT businesses_subscription_plan_check
CHECK (subscription_plan IN ('iniciante', 'intermediario', 'impulso'));
```

#### 📊 Negócios Migrados
- "Empresa de TESTE": `basic` → `iniciante` (cortesia)
- "Loja da Rak": `basic` → `iniciante` (assinatura ativa)

#### 🎯 Impacto
- ✅ Negócios agora aparecem corretamente nos showcases da capa
- ✅ Funções SQL `get_random_businesses()` e `get_featured_businesses()` funcionando
- ✅ Constraint previne valores inválidos no futuro

---

### 📅 [14/10/2025] Correção de Funções SQL de Showcases

#### 🔧 Funções Atualizadas

**`get_random_businesses()`**
- Retorna negócios com plano `iniciante`
- Inclui negócios cortesia (independente do plano)
- Verifica assinatura ativa

**`get_featured_businesses()`**
- Retorna negócios com plano `intermediario` ou `impulso`
- Inclui negócios cortesia desses planos
- Verifica assinatura ativa

#### 📋 Lógica de Filtro
```sql
WHERE (
  is_complimentary = true
  OR (
    subscription_active = true
    AND subscription_plan IN ('iniciante')  -- ou ('intermediario', 'impulso')
    AND EXISTS (SELECT 1 FROM user_subscriptions WHERE ...)
  )
)
```

---

## Melhorias de Performance

### Upload de Imagens
- ✅ Compactação automática via `optimize-image` edge function
- ✅ Geração de 3 versões: thumbnail, medium, large
- ✅ Uso da versão medium por padrão
- ✅ Redução de peso sem perda visível de qualidade

### Carrossel de Parceiros
- ✅ Lazy loading de imagens
- ✅ Auto-play com Embla Carousel
- ✅ Responsivo (3-7 logos conforme viewport)
- ✅ Animações suaves com Tailwind

---

## Segurança

### RLS Policies Adicionadas
- ✅ `partner-logos` bucket: apenas admins fazem upload
- ✅ `partner-logos` bucket: leitura pública
- ✅ Tabela `partners`: apenas admins gerenciam
- ✅ Visualização pública de parceiros ativos

### Validação de Dados
- ✅ Constraint em `subscription_plan` (apenas valores válidos)
- ✅ Validação de imagens no upload (tamanho, formato)
- ✅ Proteção contra SQL injection

---

## Acesso Administrativo

### Novas Rotas
- `/admin/parceiros` - Gerenciamento de parceiros
- Acessível via: **Admin > Configuração do Site > Parceiros e Apoiadores**

### Permissões Necessárias
- Requer role `admin` ou função `get_current_user_admin_status()`

---

## Próximos Passos Sugeridos

### Monitoramento
- [ ] Verificar performance do carrossel em produção
- [ ] Monitorar tempo de upload de imagens
- [ ] Coletar feedback de usuárias sobre showcases

### Melhorias Futuras
- [ ] Analytics de cliques nos logos de parceiros
- [ ] Filtro de parceiros por tipo (apoiadora, patrocinadora, etc.)
- [ ] Versionamento de logos (histórico de alterações)

---

## Recursos Úteis

### Documentação
- [Guia Admin - Parceiros](./guia-admin-parceiros.md)
- [Migração de Planos](./migracao-planos-2025.md)
- [Sistema de Upload](./sistema-upload-imagens.md)

### Links Supabase
- [Storage Bucket: partner-logos](https://supabase.com/dashboard/project/ngqymbjatenxztrjjdxa/storage/buckets/partner-logos)
- [Tabela: partners](https://supabase.com/dashboard/project/ngqymbjatenxztrjjdxa/editor)
- [Edge Function: optimize-image](https://supabase.com/dashboard/project/ngqymbjatenxztrjjdxa/functions/optimize-image)

---

## Janeiro 2025

### 🚨 Correções Críticas Implementadas

#### Data: 14/01/2025

---

#### 1️⃣ Correção: Dropdowns Invisíveis em Modais

**Prioridade**: 🔴 Crítica  
**Status**: ✅ Resolvido  

##### Problema Reportado

Usuários não conseguiam preencher formulários dentro de modais porque os dropdowns (selects) não apareciam:
- Formulário de assinatura (estado/cidade)
- Formulário de endereço
- Formulário de contato
- Notificações da jornada do cliente

##### Análise Técnica

**Causa Raiz**: Conflito de z-index entre componentes
- Dialog Overlay: `z-[1000]`
- Dialog Content: `z-[1001]`
- Select/Dropdown: `z-50` ❌ (muito baixo)

Resultado: Dropdowns renderizavam **atrás** do conteúdo do modal.

##### Solução Aplicada

**Arquivos Modificados**:

1. `src/components/ui/select.tsx` (linha 76)
   ```diff
   - className="relative z-50 ..."
   + className="relative z-[1100] ..."
   ```

2. `src/components/ui/dropdown-menu.tsx` (linhas 48, 66)
   ```diff
   - className="z-50 ..."
   + className="z-[1100] ..."
   ```

##### Hierarquia Z-Index Estabelecida

```
z-[900]  → Mobile menu
z-[1000] → Dialog Overlay
z-[1001] → Dialog Content
z-[1100] → Dropdowns/Selects ✅
z-[9999] → Toasts
```

##### Validação

- ✅ Formulário de assinatura funcionando
- ✅ Selects de estado/cidade visíveis e clicáveis
- ✅ Formulários de endereço OK
- ✅ Desktop e Mobile validados

---

#### 2️⃣ Correção: Negócios Cortesia Invisíveis

**Prioridade**: 🔴 Crítica  
**Status**: ✅ Resolvido  

##### Problema Reportado

Negócios marcados como cortesia (`is_complimentary = true`) não apareciam no diretório público, mesmo estando ativos no admin.

##### Análise Técnica

**Causa Raiz**: Funções SQL não consideravam o campo `is_complimentary`

As 3 funções RPC principais exigiam sempre:
- `subscription_active = true`
- Assinatura válida em `user_subscriptions`

Negócios cortesia não atendem esses requisitos → filtrados incorretamente.

##### Solução Aplicada

**Migration SQL**: `supabase/migrations/[timestamp]_fix_complimentary_visibility.sql`

Atualização de 3 funções:

1. **`get_public_businesses()`**
2. **`get_public_business_by_id(uuid)`**
3. **`get_public_business_by_slug(text)`**

Lógica aplicada:
```sql
WHERE (
  b.is_complimentary = true  -- CORTESIA: sempre visível
  OR 
  (b.subscription_active = true AND EXISTS (...))  -- NORMAL
)
```

##### Validação

- ✅ Negócios cortesia aparecem no diretório
- ✅ Negócios normais continuam funcionando
- ✅ Filtros incluem cortesias
- ✅ Busca por slug funciona
- ✅ Performance mantida (< 2s)

---

#### 3️⃣ Correção: Mobile Não Responsivo (Página Contato)

**Prioridade**: 🟡 Alta  
**Status**: ✅ Resolvido  

##### Problema Reportado

Página `/contato` quebrava em mobile:
- Scroll horizontal indesejado
- Google Maps extrapolava largura
- Elementos cortados nas laterais

##### Análise Técnica

**Causa Raiz**:
1. Container sem `overflow-x-hidden`
2. Card do mapa sem `max-w-full`
3. Iframe sem classes responsivas

##### Solução Aplicada

**Arquivo**: `src/pages/Contato.tsx`

**Linha 106** - Container:
```diff
- <main className="container mx-auto px-4 py-8">
+ <main className="container mx-auto px-4 py-8 overflow-x-hidden">
```

**Linhas 289-311** - Card do mapa:
```diff
- <Card className="mt-8">
+ <Card className="mt-8 max-w-full overflow-hidden">
  <CardContent className="p-0">
-   <div className="rounded-lg overflow-hidden">
+   <div className="w-full rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="400"
+       className="w-full"
-       style={{ border: 0 }}
+       style={{ border: 0, maxWidth: '100%' }}
        ...
```

##### Validação

- ✅ iPhone SE (375px): sem scroll horizontal
- ✅ iPhone 12 (390px): layout correto
- ✅ Android (360px): responsivo
- ✅ Tablet (768px): OK
- ✅ Desktop: mantido

---

## 📊 Resumo Executivo

| # | Problema | Tipo | Arquivos | Tempo | Impacto |
|---|----------|------|----------|-------|---------|
| 1 | Dropdowns invisíveis | CSS z-index | 2 arquivos UI | 15min | Alto |
| 2 | Cortesia invisível | SQL Functions | 1 migration | 30min | Alto |
| 3 | Mobile quebrado | CSS responsivo | 1 arquivo | 10min | Médio |
| 4 | Sistema de Parceiros | Full-stack | 8 arquivos | 2h | Alto |
| 5 | Migração de Planos | Database | 1 migration | 30min | Alto |

**Total**: 5 implementações/correções críticas  
**Tempo total**: ~4 horas  
**Risco de regressão**: Baixo (mudanças isoladas)  

---

## 📚 Documentação Criada

1. **`docs/z-index-hierarchy.md`** ✅
   - Hierarquia oficial de z-index
   - Guia de debugging
   - Checklist de testes

2. **`docs/sistema-negocios-cortesia.md`** (atualizado)
   - Funções RPC que devem considerar `is_complimentary`
   - Guia de uso do sistema de cortesias

3. **`docs/guia-admin-parceiros.md`** ✅
   - Guia completo de gerenciamento de parceiros
   - Upload de logos otimizado
   - Boas práticas

4. **`docs/migracao-planos-2025.md`** ✅
   - Detalhamento da migração de planos
   - Mapeamento de valores antigos para novos

---

## ✅ Checklist Pós-Deploy

Validações obrigatórias:

- [x] Formulário de assinatura: dropdowns funcionam
- [x] Negócios cortesia: visíveis no diretório
- [x] Página contato: responsiva em 375px
- [x] Desktop: sem regressões
- [x] Mobile (iOS + Android): testado
- [x] Documentação: atualizada
- [x] Sistema de parceiros: funcionando
- [x] Upload de logos: compactação automática
- [x] Migração de planos: executada
- [x] Showcases na capa: exibindo negócios

---

## 🔄 Monitoramento (24h)

Métricas a observar:

1. **Taxa de conversão de assinaturas** (deve aumentar)
2. **Negócios cortesia no diretório** (confirmar visibilidade)
3. **Bounce rate mobile /contato** (deve reduzir)
4. **Logs de erro** (monitorar z-index ou SQL)
5. **Performance do carrossel de parceiros**
6. **Uploads de logos** (tempo e sucesso)

**Queries úteis**:

```sql
-- Verificar negócios cortesia ativos
SELECT COUNT(*) FROM businesses WHERE is_complimentary = true;

-- Listar negócios cortesia
SELECT id, name, city, state, subscription_plan
FROM businesses 
WHERE is_complimentary = true 
ORDER BY created_at DESC;

-- Verificar parceiros ativos
SELECT COUNT(*) FROM partners WHERE active = true;

-- Listar parceiros
SELECT name, partnership_type, display_order
FROM partners
ORDER BY display_order ASC;
```

---

## 🎯 Aprendizados

### ✅ O Que Funcionou

1. Abordagem em fases: correções isoladas
2. Documentação imediata
3. Testes abrangentes (desktop + mobile)
4. Hierarquia z-index bem definida
5. Upload de imagens otimizado desde o início

### 🔄 Melhorias Futuras

1. Testes automatizados (Cypress)
2. Storybook para componentes UI
3. Code review obrigatório para componentes base
4. Monitoramento proativo de erros
5. Analytics de uso do sistema de parceiros

---

## 📞 Suporte

**Em caso de regressão**:

1. Consultar `docs/z-index-hierarchy.md`
2. Verificar funções SQL para cortesias
3. Validar responsividade em DevTools (375px)
4. Verificar bucket `partner-logos` e RLS policies
5. Contatar time de desenvolvimento

**Responsável**: Time de Frontend + Backend  
**Data**: 14/10/2025 (Outubro) + 14/01/2025 (Janeiro)  
**Versão**: 2.0  
**Status**: ✅ Implementado e Validado

---

**Última atualização:** 14/10/2025  
**Versão do sistema:** 2.0  
**Status:** ✅ Todas as correções implementadas com sucesso
