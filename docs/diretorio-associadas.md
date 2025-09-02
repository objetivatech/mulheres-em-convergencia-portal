# Diretório de Associadas

## Visão Geral

O Diretório de Associadas é uma plataforma completa para conectar empresárias e facilitar o networking entre mulheres empreendedoras. O sistema permite a listagem, busca e visualização detalhada de empresas cadastradas na plataforma.

## Funcionalidades Implementadas

### 1. Páginas Públicas

#### Diretório Principal (`/diretorio`)
- **Busca Avançada**: Campo de busca por nome, categoria ou localização
- **Filtros**: Por categoria, estado e cidade
- **Modos de Visualização**: Grid (cards) e Lista
- **Contador de Resultados**: Mostra quantas empresas foram encontradas
- **Empresas em Destaque**: Highlight para empresas com plano premium
- **Responsividade**: Adaptado para mobile e desktop

#### Página da Empresa (`/diretorio/:id`)
- **Perfil Completo**: Logo, capa, galeria de imagens
- **Informações Detalhadas**: Descrição, categoria, localização
- **Contatos**: Telefone, email, WhatsApp, site, Instagram
- **Estatísticas**: Visualizações, cliques, contatos realizados
- **Avaliações**: Sistema de reviews com notas e comentários
- **SEO Otimizado**: Meta tags dinâmicas para cada empresa

### 2. Sistema de Busca e Filtros

- **Busca Textual**: Nome da empresa, descrição, categoria
- **Filtros Geográficos**: Por estado e cidade
- **Filtros por Categoria**: 10 categorias principais disponíveis
- **Busca Responsiva**: Interface adaptada para mobile

### 3. Integração com Banco de Dados

#### Tabelas Utilizadas
- `businesses`: Dados principais das empresas
- `business_reviews`: Sistema de avaliações
- `business_subscriptions`: Planos e assinaturas

#### Funções RPC
- `get_public_businesses()`: Lista empresas ativas
- `get_public_business_by_id()`: Detalhes de empresa específica
- `get_business_contacts()`: Contatos (restrito por plano)
- `get_public_business_reviews()`: Avaliações públicas

### 4. Controle de Acesso e Privacidade

- **Informações Públicas**: Nome, categoria, descrição, logo, localização geral
- **Informações Restritas**: Contatos detalhados (dependem do plano de assinatura)
- **Rastreamento de Engajamento**: Contagem automática de views, cliques e contatos

## Estrutura de Arquivos

```
src/
├── pages/
│   ├── Diretorio.tsx          # Listagem principal
│   └── DiretorioEmpresa.tsx   # Página individual da empresa
├── components/layout/
│   └── Header.tsx             # Navegação atualizada
└── docs/
    └── diretorio-associadas.md # Esta documentação
```

## Categorias de Negócios

1. **Alimentação** - Restaurantes, lanchonetes, docerias
2. **Artesanato** - Trabalhos manuais, decoração
3. **Beleza e Estética** - Salões, clínicas, cosméticos
4. **Consultoria** - Serviços especializados
5. **Educação** - Cursos, treinamentos, ensino
6. **Moda** - Roupas, acessórios, calçados
7. **Saúde e Bem-estar** - Clínicas, terapias, fitness
8. **Serviços** - Limpeza, manutenção, diversos
9. **Tecnologia** - Software, marketing digital, e-commerce
10. **Outros** - Demais segmentos

## Recursos de SEO

### Meta Tags Dinâmicas
- Título personalizado por empresa
- Descrição baseada no conteúdo
- Keywords relevantes (nome, categoria, localização)
- Open Graph para redes sociais

### URLs Amigáveis
- `/diretorio` - Listagem principal
- `/diretorio/:id` - Perfil da empresa (UUID otimizado)

## Métricas e Analytics

### Por Empresa
- **Visualizações**: Cada acesso à página da empresa
- **Cliques no Site**: Redirecionamentos para site externo
- **Contatos**: Uso dos botões de contato (telefone, email, WhatsApp)

### Rastreamento Automático
- Incremento automático ao acessar perfil
- Registro de interações de contato
- Dados para relatórios de performance

## Próximas Funcionalidades (Roadmap)

### ✅ FASE 1 - Implementada
- ✅ Estrutura base e navegação (páginas públicas, busca, filtros)
- ✅ Integração com banco de dados Supabase
- ✅ Sistema de busca e filtros geográficos
- ✅ Páginas responsivas e otimizadas para SEO

### ✅ FASE 2 - Implementada 
- ✅ Dashboard da Associada (`/dashboard/empresa`)
- ✅ Formulários completos de edição (dados, contatos, localização)
- ✅ Sistema de upload de imagens (logo, capa, galeria)
- ✅ Métricas básicas (visualizações, cliques, contatos)
- ✅ Interface em abas organizadas
- ✅ Validação de formulários com Zod
- ✅ Integração com Supabase Storage

### ✅ FASE 3 - Implementada
- ✅ Página de Planos (`/planos`) com os 3 planos definidos
- ✅ Integração com gateway ASAAS via edge function
- ✅ Sistema de assinaturas com controle de recursos
- ✅ Exibição do plano atual no dashboard
- ✅ Checkout em nova aba via ASAAS
- ✅ Planos inseridos no banco: Iniciante, Intermediário, Master
- ✅ Controle de funcionalidades por plano

### ✅ FASE 4 - Implementada (Recursos Avançados)
- ✅ Mapa interativo com geolocalização (Mapbox)
- ✅ Sistema de reviews expandido com formulário
- ✅ Busca por proximidade geográfica
- ✅ Visualização em mapa no diretório
- ✅ Mapa individual na página da empresa
- ✅ Formulário para criar avaliações

### ✅ FASE 5 - Implementada (Recursos Premium)
- ✅ Sistema de empresas em destaque com badges visuais
- ✅ Sistema de boosts/impulsos de visibilidade com créditos
- ✅ Analytics avançados com métricas detalhadas
- ✅ Dashboard premium com controle de recursos
- ✅ Sistema de créditos para compra de boosts
- ✅ Diferentes tipos de destaque (Featured, Premium Badge, Spotlight)
- ✅ Controle de acesso por plano de assinatura

## Segurança e Performance

- **RLS (Row Level Security)**: Controle de acesso no Supabase
- **Sanitização**: Dados validados antes da exibição
- **Otimização**: Lazy loading de imagens
- **Caching**: Query optimization com React Query
- **Responsividade**: Mobile-first design

## Acessibilidade (WCAG 2.1 AA)

- Navegação por teclado
- Alt text em imagens
- Contraste adequado de cores
- Estrutura semântica HTML
- Labels descritivos em formulários

## Monitoramento e Logs

- Tracking de erros via console
- Logs de performance de queries
- Monitoramento de engajamento
- Relatórios de uso por categoria

---

*Documentação atualizada em: Janeiro 2025*
*Versão: 4.0 - Fases 1, 2, 3 e 4 Implementadas*