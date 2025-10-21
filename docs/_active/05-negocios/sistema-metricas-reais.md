# Sistema de Métricas Reais

## Visão Geral

Este documento descreve a implementação do sistema de métricas reais para blog posts e negócios no portal Mulheres em Convergência.

## 1. Contador de Visualizações do Blog

### Implementação
- **Função RPC**: `increment_blog_post_views(p_slug text)`
- **Segurança**: SECURITY DEFINER para contornar RLS
- **Localização**: Página individual do post (`src/pages/Post.tsx`)

### Funcionamento
1. Quando um usuário acessa um post, a função RPC é chamada
2. A função incrementa `views_count` na tabela `blog_posts`
3. Apenas posts com status 'published' têm suas visualizações contadas
4. O contador é exibido na página do post junto com outros metadados

### Código
```typescript
// Incrementar visualização usando RPC seguro
await supabase.rpc('increment_blog_post_views', { p_slug: slug });
```

## 2. Métricas de Negócios

### Analytics Aprimorado
- **Função atualizada**: `update_business_analytics()`
- **Dupla atualização**: Analytics diários + contadores agregados
- **Tabelas afetadas**: `business_analytics` e `businesses`

### Métricas Rastreadas
- **Visualizações**: Cada acesso ao perfil do negócio
- **Cliques**: Links externos (website, redes sociais, contatos)
- **Contatos**: Mensagens enviadas através do formulário
- **Avaliações**: Reviews submetidas pelos usuários

### Exibição nos Cards
Os cards de negócios agora mostram métricas reais:

#### Home Page (BusinessShowcase)
```
[Visualizações] | [Avaliações]
123 visualizações | 45 avaliações
```

#### Diretório
```
Grid View:
[Visualizações] | [Avaliações]

List View:
[Visualizações]
[Avaliações]
```

## 3. Funções RPC Atualizadas

### get_random_businesses()
- Inclui `views_count` e `reviews_count`
- Ordenação aleatória mantida
- Performance otimizada com COUNT agregado

### get_featured_businesses()
- Mesma estrutura de dados
- Foco em negócios premium/master
- Métricas reais de engajamento

### get_public_businesses()
- Estrutura completa para diretório
- Todas as métricas incluídas
- Base para filtros e ordenação

## 4. Correções de Bugs

### Sistema de Avaliações
- **Problema**: Edge function retornava status HTTP inconsistentes
- **Solução**: Sempre retorna 200 com estrutura `{ success: boolean, error?: string }`
- **Benefício**: Frontend pode processar respostas de forma consistente

### Estrutura de Resposta Padronizada
```json
{
  "success": true,
  "message": "Avaliação enviada com sucesso!",
  "review_id": "uuid"
}

// ou em caso de erro:
{
  "success": false,
  "error": "Mensagem de erro amigável",
  "details": "Detalhes técnicos opcionais"
}
```

## 5. Performance e Segurança

### Otimizações
- Funções SECURITY DEFINER para operações seguras
- Índices automáticos para `business_reviews.business_id`
- Caching de consultas via React Query
- Atualização em lote de analytics

### Segurança
- RLS mantida em todas as tabelas
- Validação completa nos edge functions
- Sanitização de dados de entrada
- Logs detalhados para auditoria

## 6. Monitoramento

### Logs Disponíveis
- Edge function logs no Supabase Dashboard
- Activity logs para ações de usuário
- Analytics de performance via React Query

### Métricas de Negócio
- Taxa de conversão de visualizações
- Engajamento por categoria
- Performance de diferentes tipos de negócio
- Tendências de crescimento por região

## 7. Próximos Passos

### Melhorias Futuras
- Dashboard de analytics avançado
- Relatórios mensais automatizados
- Comparativos de performance
- Alertas de marcos de engajamento
- Integração com Google Analytics

### Otimizações Técnicas
- Cache de métricas frequentes
- Agregações pre-computadas
- Índices compostos otimizados
- Compressão de dados históricos