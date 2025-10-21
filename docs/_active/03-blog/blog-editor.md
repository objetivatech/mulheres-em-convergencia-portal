# Editor do Blog - Mulheres em Convergência

## Visão Geral

O Editor do Blog é um sistema completo de gerenciamento de conteúdo integrado ao portal, permitindo criar, editar e publicar posts do blog com interface rica e funcionalidades avançadas.

## Funcionalidades Implementadas

### 1. Dashboard do Blog (`/admin/blog`)
- **Visualização geral** de todos os posts
- **Estatísticas** em tempo real (total, publicados, rascunhos, categorias)
- **Filtros** por status (publicado, rascunho, arquivado)
- **Busca** por título e conteúdo
- **Ações rápidas**: visualizar, editar, excluir posts

### 2. Editor Rico (`/admin/blog/novo` e `/admin/blog/editar/:id`)
- **TrumbowygEditor** como editor WYSIWYG
- **Upload de imagens** direto no editor
- **Formatação completa**: títulos, listas, links, tabelas
- **Preview em tempo real**
- **Sanitização** de HTML com DOMPurify
- ✅ **Correção do carregamento de conteúdo existente**

### 3. Gestão de Conteúdo
- **Títulos e slugs** auto-gerados
- **Resumos/excerpts** para SEO
- **Imagens destacadas** com upload
- ✅ **Categorização completa** com criação rápida
- ✅ **Sistema de tags** com interface completa
- ✅ **Status dinâmico** com botões condicionais
- **SEO**: título, meta descrição, palavras-chave

### 4. Upload de Imagens
- **Drag & drop** interface
- **Validação** de formato e tamanho (máx. 5MB)
- **Storage** no Supabase (`blog-images` bucket)
- **Otimização** automática
- **Galeria** integrada ao editor

### 5. Gestão de Categorias (`/admin/blog/categorias`)
- **CRUD completo** para categorias
- **Slugs automáticos**
- **Descrições** opcionais
- **Interface intuitiva** com tabelas
- ✅ **Criação rápida** dentro do editor

### 6. Sistema de Tags
- ✅ **Interface completa** para seleção de tags
- ✅ **Criação rápida** de novas tags
- ✅ **Visualização com badges** das tags selecionadas
- ✅ **Nuvem de tags** no footer do site

### 7. Sistema de Permissões
- ✅ **Role "Author"** implementado
- ✅ **Controle de publicação** baseado em roles
- ✅ **Interface adaptativa** por permissão

## Estrutura Técnica

### Hooks Customizados
- `useBlogPosts`: Gestão de posts (CRUD)
- `useBlogCategories`: Gestão de categorias e tags
- `useImageUpload`: Upload e gerenciamento de imagens
- ✅ `usePopularTags`: Tags mais utilizadas
- ✅ `useUserPermissions`: Verificação de permissões

### Componentes
- `RichTextEditor`: Editor TinyMCE configurado
- `TrumbowygEditor`: ✅ Editor com sincronização corrigida
- `ImageUploader`: Interface de upload com drag & drop
- `CategoryManager`: Gestão de categorias
- ✅ `TagCloud`: Nuvem de tags dinâmica

### Páginas
- `BlogDashboard`: Painel principal do blog
- `BlogEditor`: ✅ Editor completo com todas as funcionalidades
- `BlogCategories`: Gestão de categorias

## Permissões e Segurança

### Controle de Acesso
- **Role `admin`**: Acesso total ao sistema de blog
- ✅ **Role `author`**: Pode criar e editar, mas não publicar
- **RLS** configurado no Supabase para proteção de dados

### Fluxo de Publicação
- **Admins**: Podem publicar diretamente
- ✅ **Autores**: Posts ficam como rascunho para revisão
- ✅ **Interface adaptativa**: Botões e opções baseados na role

### Validação
- **Títulos obrigatórios** e únicos
- **Slugs únicos** e SEO-friendly
- **Sanitização HTML** para segurança
- **Validação de imagens** (formato e tamanho)

## Nuvem de Tags

### Funcionalidade Nova
- ✅ **Exibição dinâmica** no footer do site
- ✅ **Tamanhos proporcionais** ao uso
- ✅ **Links funcionais** para filtragem
- ✅ **Cache otimizado** (5 minutos)

### Características
- **Tags populares**: Baseadas em posts publicados
- **Dimensionamento**: Algoritmo baseado na frequência
- **Performance**: Query otimizada com cache
- **Acessibilidade**: Tooltips com contagem de posts

## Rotas Implementadas

```
/admin/blog              - Dashboard principal
/admin/blog/novo         - Criar novo post
/admin/blog/editar/:id   - Editar post existente
/admin/blog/categorias   - Gestão de categorias
```

## Dependências Adicionadas

- `@tinymce/tinymce-react`: Editor rico
- `react-dropzone`: Upload com drag & drop
- `slugify`: Geração de slugs SEO-friendly
- `dompurify`: Sanitização de HTML

## Melhorias Implementadas (Setembro 2025)

### ✅ Correções Principais
1. **Editor Rico**: Corrigido carregamento de conteúdo existente
2. **Categorias**: Botão de criação agora funcional
3. **Tags**: Sistema completo implementado
4. **Status**: Seletor sincronizado com formulário
5. **Permissões**: Sistema de autores implementado

### ✅ Novas Funcionalidades
- **Nuvem de Tags**: Exibição dinâmica no footer
- **Criação Rápida**: Categorias e tags dentro do editor
- **Interface Adaptativa**: Baseada nas permissões do usuário
- **Botões Condicionais**: Mudança baseada no status selecionado

## Banco de Dados

### Funções SQL Adicionadas
- `is_user_author()`: Verificação de role autor
- `get_popular_blog_tags()`: Tags mais utilizadas com contagem

### Enum Atualizado
- ✅ `user_role`: Adicionado valor 'author'

## Status de Implementação

✅ **Dashboard completo** com estatísticas e filtros  
✅ **Editor rico** com TrumbowygEditor corrigido  
✅ **Upload de imagens** integrado  
✅ **Gestão de categorias** com criação rápida  
✅ **Sistema de tags** completo  
✅ **Sistema de permissões** para autores  
✅ **Interface responsiva** e acessível  
✅ **Nuvem de tags** no footer  
✅ **Validação e segurança** implementadas  

## Próximos Passos (Futuro)

1. **Sistema de Notificações**: Alertar admins sobre posts pendentes
2. **Analytics de Tags**: Métricas detalhadas de uso
3. **Programação de Posts**: Publicação automática
4. **Comentários**: Sistema de comentários para posts
5. **Histórico de Revisões**: Controle de versões dos posts

O sistema está **100% funcional** com todas as correções implementadas e pronto para criação e gestão avançada de conteúdo do blog.