# Editor do Blog - Mulheres em Convergência

## Visão Geral

O Editor do Blog é um sistema completo de gerenciamento de conteúdo integrado ao portal, permitindo criar, editar e publicar posts do blog com interface rica e funcionalidades avançadas.

## Funcionalidades Implementadas

### 1. Dashboard do Blog (`/admin/blog`)
- **Visualização geral** de todos os posts
- **Estatísticas** em tempo real (total, publicados, rascunhos, categorias)
- **Filtros** por status (publicado, rascunho, arquivado, agendado)
- **Busca** por título e conteúdo
- **Ações rápidas**: visualizar, editar, excluir posts
- ✅ **Abas**: Posts, Autores, Comentários (admin)
- ✅ **Badge de pendentes** na aba de comentários

### 2. Editor Rico (`/admin/blog/novo` e `/admin/blog/editar/:id`)
- **TinyMCE** como editor WYSIWYG
- **Upload de imagens** direto no editor
- **Formatação completa**: títulos, listas, links, tabelas
- **Preview em tempo real**
- **Sanitização** de HTML com DOMPurify
- ✅ **Seleção de autor** (admin only)

### 3. Gestão de Conteúdo
- **Títulos e slugs** auto-gerados
- **Resumos/excerpts** para SEO
- **Imagens destacadas** com upload
- ✅ **Categorização completa** com criação rápida
- ✅ **Sistema de tags** com interface completa
- ✅ **Status dinâmico** com botões condicionais
- **SEO**: título, meta descrição, palavras-chave
- ✅ **Vinculação de autor** ao post

### 4. Upload de Imagens
- **Drag & drop** interface
- **Validação** de formato e tamanho (máx. 5MB)
- **Storage** no Supabase (`blog-images` bucket)
- **Otimização** automática

### 5. Gestão de Categorias (`/admin/blog/categorias`)
- **CRUD completo** para categorias
- **Slugs automáticos**
- **Descrições** opcionais

### 6. Sistema de Tags
- ✅ **Interface completa** para seleção de tags
- ✅ **Criação rápida** de novas tags
- ✅ **Nuvem de tags** no footer do site

### 7. Sistema de Permissões (Role `blog_editor`)
- ✅ **Role `blog_editor`** como role principal
- ✅ **Acesso ao `/admin/blog`** via UserDashboard quando role ativa
- ✅ **Controle de publicação** baseado em roles
- ✅ **Blog editors** só podem criar/editar seus próprios posts
- ✅ **Somente admins** podem excluir posts
- ✅ **Interface adaptativa** por permissão (botões ocultos para editores)

### 8. Perfis de Autor (Novo)
- ✅ **Tabela `blog_authors`**: nome, foto, bio, links sociais
- ✅ **Gestão pelo admin** na aba "Autores" do Dashboard
- ✅ **CRUD completo**: criar, editar, excluir autores
- ✅ **Upload de foto** via bucket `blog-images`
- ✅ **Seleção de autor no editor** (admin only)
- ✅ **Vinculação via `author_profile_id`** no post
- ✅ **Bloco de autor** exibido no final do post publicado
- ✅ **Nome do autor** exibido no resumo do post (em vez de "Admin")

### 9. Sistema de Comentários (Novo)
- ✅ **Tabela `blog_comments`** com status (pending, approved, rejected)
- ✅ **Formulário público** para enviar comentários
- ✅ **Lista de comentários aprovados** no post
- ✅ **Moderação pelo admin** na aba "Comentários" do Dashboard
- ✅ **Ações**: aprovar, rejeitar, excluir
- ✅ **Badge com contagem** de comentários pendentes
- ✅ **Comentários entram como pendentes** por padrão
- ✅ **RLS segura**: apenas aprovados são públicos

## Estrutura Técnica

### Hooks Customizados
- `useBlogPosts`: Gestão de posts (CRUD)
- `useBlogCategories`: Gestão de categorias e tags
- `useImageUpload`: Upload e gerenciamento de imagens
- `usePopularTags`: Tags mais utilizadas
- `useUserPermissions`: Verificação de permissões
- ✅ `useBlogAuthors`: CRUD de perfis de autor
- ✅ `useBlogComments`: Comentários públicos e moderação

### Componentes
- `TinyMCESelfHosted`: Editor WYSIWYG
- `ImageUploader`: Interface de upload com drag & drop
- `ShareButtons`: Botões de compartilhamento
- `SchemaOrg`: Dados estruturados
- `TagCloud`: Nuvem de tags dinâmica
- ✅ `AuthorBlock`: Bloco de autor no post publicado
- ✅ `CommentForm`: Formulário de comentário público
- ✅ `CommentList`: Lista de comentários aprovados
- ✅ `AuthorManager`: Gestão de autores (admin)
- ✅ `CommentModeration`: Moderação de comentários (admin)

### Páginas
- `BlogDashboard`: Painel principal com abas (Posts, Autores, Comentários)
- `BlogEditor`: Editor completo com seleção de autor
- `BlogCategories`: Gestão de categorias

## Permissões e Segurança

### Controle de Acesso
- **Role `admin`**: Acesso total (CRUD completo + moderação)
- ✅ **Role `blog_editor`**: Pode criar e editar seus próprios posts, não pode excluir
- **RLS** granular por operação (SELECT, INSERT, UPDATE, DELETE)

### Fluxo de Publicação
- **Admins**: Podem publicar diretamente
- ✅ **Editores**: Posts ficam como rascunho para revisão
- ✅ **Interface adaptativa**: Botões e opções baseados na role

### Validação
- **Títulos obrigatórios** e únicos
- **Slugs únicos** e SEO-friendly
- **Sanitização HTML** para segurança
- **Validação de imagens** (formato e tamanho)

## Banco de Dados

### Tabelas
- `blog_posts`: Posts com `author_profile_id` (FK para blog_authors)
- `blog_categories`: Categorias
- `blog_tags`: Tags
- `blog_post_tags`: Associação posts-tags
- ✅ `blog_authors`: Perfis de autores (nome, foto, bio, links)
- ✅ `blog_comments`: Comentários com status (pending/approved/rejected)

### Enums
- `post_status`: draft, published, archived, scheduled
- ✅ `comment_status`: pending, approved, rejected

### RLS Policies
- Posts publicados: leitura pública
- Admins: acesso total
- Blog editors: CRUD apenas dos próprios posts
- Comentários aprovados: leitura pública
- Novos comentários: inserção pública (status=pending)
- Moderação de comentários: apenas admin

## Rotas Implementadas

```
/admin/blog              - Dashboard principal (com abas Posts/Autores/Comentários)
/admin/blog/novo         - Criar novo post
/admin/blog/editar/:id   - Editar post existente
/admin/blog/categorias   - Gestão de categorias
```

## Status de Implementação

✅ **Dashboard completo** com abas e estatísticas
✅ **Editor rico** com seleção de autor
✅ **Upload de imagens** integrado
✅ **Gestão de categorias** com criação rápida
✅ **Sistema de tags** completo
✅ **Sistema de permissões** para blog editors
✅ **Perfis de autor** com gestão pelo admin
✅ **Bloco de autor** no post publicado
✅ **Sistema de comentários** com moderação
✅ **Interface responsiva** e acessível
✅ **Nuvem de tags** no footer
✅ **Validação e segurança** implementadas
