
# Melhorias no Blog: Role Editor, Perfil de Autor, e Comentarios

## Resumo

Este plano cobre 5 areas principais de melhoria no sistema de blog:

1. **Ajuste da role `blog_editor`** - permissoes corretas e acesso via menu do usuario
2. **Restricao de edicao/exclusao** - editores so gerenciam seus proprios posts
3. **Perfil de autor gerenciado pelo admin** - foto, bio, links sociais
4. **Bloco de autor no post publicado** - exibicao no final do artigo + nome no resumo
5. **Sistema de comentarios com moderacao** - comentarios nos posts com aprovacao pelo admin

---

## 1. Acesso do Blog Editor

### Situacao Atual
- A rota `/admin/blog` ja aceita usuarios com `canEditBlog = true`
- O `UserDashboard` ja tem modulos de blog para a role `blog_editor`, porem marcados como "Coming soon" (`available: false`)
- Os links apontam para `/blog/meus-posts` e `/blog/criar` (rotas que nao existem)

### Mudancas
- **`UserDashboard.tsx`**: Ativar os modulos de blog (`available: true`) e apontar os links para as rotas existentes (`/admin/blog` e `/admin/blog/novo`)
- Adicionar item "Editor de Blog" no menu do usuario (header/navigation) quando o usuario tiver a role `blog_editor`

---

## 2. Restricao de Edicao/Exclusao por Role

### Situacao Atual
- O `BlogDashboard` mostra botoes de editar e excluir para todos os posts, sem verificar autoria
- As RLS policies ja restringem parcialmente (autores so veem seus posts via policy "Authors can manage their posts")

### Mudancas
- **`BlogDashboard.tsx`**: 
  - Para editores (nao-admin): filtrar posts para exibir apenas os do proprio usuario
  - Ocultar botao de exclusao para editores (somente admin pode excluir)
  - Ocultar botao de editar em posts de outros autores
- **`useBlogPosts.ts`**: Adicionar parametro opcional `authorId` para filtrar posts por autor
- **RLS**: Ajustar policy para que `blog_editor` so possa INSERT e UPDATE em seus proprios posts, enquanto admin pode tudo (incluindo DELETE)

---

## 3. Perfil de Autor (Gerenciado pelo Admin)

### Nova Tabela: `blog_authors`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK para auth.users (usuario vinculado) |
| display_name | text | Nome de exibicao |
| photo_url | text | Foto do autor |
| bio | text | Mini-bio |
| instagram_url | text | Link Instagram |
| linkedin_url | text | Link LinkedIn |
| website_url | text | Link site pessoal |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### Admin: Gestao de Autores
- **Nova aba no `BlogDashboard`** ou **nova pagina `/admin/blog/autores`** para o admin cadastrar/editar perfis de autores
- Interface similar ao `AdminPublicPageManager` das embaixadoras: foto, bio, redes sociais
- Upload de foto via bucket `blog-images`
- Vinculacao com usuario existente (select de usuarios com role `blog_editor`)

### Blog Editor: Vinculacao ao Post
- No `BlogEditor.tsx`, adicionar campo de selecao de autor (visivel apenas para admin)
- Campo `author_profile_id` na tabela `blog_posts` (FK para `blog_authors`)

---

## 4. Bloco de Autor no Post Publicado

### Componente: `AuthorBlock`
- Exibido no final do artigo (apos o conteudo, antes dos posts relacionados)
- Layout: foto circular + nome + bio + links de redes sociais
- Estilo consistente com o design do portal

### Nome do Autor no Resumo
- Na area onde hoje aparece "Admin/Autora" (linha 378-381 do `Post.tsx`), exibir o `display_name` do `blog_authors` vinculado
- Fallback para `profiles.full_name` se nao houver perfil de autor

---

## 5. Sistema de Comentarios

### Nova Tabela: `blog_comments`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| post_id | uuid | FK para blog_posts |
| author_name | text | Nome do comentarista |
| author_email | text | Email (nao exibido publicamente) |
| content | text | Texto do comentario |
| status | enum | 'pending', 'approved', 'rejected' |
| user_id | uuid | FK opcional (se logado) |
| parent_id | uuid | FK para blog_comments (respostas) |
| created_at | timestamptz | Data |

### Componentes
- **`CommentForm`**: Formulario para enviar comentario (nome, email, texto)
- **`CommentList`**: Lista de comentarios aprovados no post
- **`CommentModeration`**: Painel admin para aprovar/rejeitar comentarios

### Admin: Moderacao
- Nova pagina ou aba em `/admin/blog` com lista de comentarios pendentes
- Acoes: Aprovar, Rejeitar, Excluir
- Badge com contagem de pendentes no dashboard

### Post Publico
- Secao de comentarios no final do post (apos o bloco de autor)
- Apenas comentarios com status `approved` sao exibidos
- Formulario simples para novos comentarios (ficam como `pending`)

---

## Detalhes Tecnicos

### Migracao SQL
1. Criar tabela `blog_authors` com RLS (admin pode tudo, leitura publica)
2. Adicionar coluna `author_profile_id` em `blog_posts` (FK para `blog_authors`)
3. Criar tabela `blog_comments` com enum `comment_status`
4. RLS: comentarios aprovados sao publicos; qualquer um pode inserir (pending); admin modera
5. Ajustar RLS de `blog_posts`: separar policies por operacao (SELECT, INSERT, UPDATE, DELETE)

### Novos Hooks
- `useBlogAuthors`: CRUD de perfis de autor
- `useBlogComments`: Listar comentarios por post
- `useCommentModeration`: Aprovar/rejeitar/excluir comentarios (admin)

### Novos Componentes
- `src/components/blog/AuthorBlock.tsx` - Bloco de autor no post
- `src/components/blog/CommentForm.tsx` - Formulario de comentario
- `src/components/blog/CommentList.tsx` - Lista de comentarios
- `src/components/admin/blog/AuthorManager.tsx` - Gestao de autores
- `src/components/admin/blog/CommentModeration.tsx` - Moderacao de comentarios

### Arquivos Modificados
- `src/pages/Post.tsx` - Adicionar AuthorBlock e CommentList/CommentForm
- `src/pages/BlogDashboard.tsx` - Adicionar abas (Posts, Autores, Comentarios), filtrar por autoria
- `src/pages/BlogEditor.tsx` - Campo de selecao de autor (admin only)
- `src/pages/UserDashboard.tsx` - Ativar links do blog editor
- `src/hooks/useBlogPosts.ts` - Filtro por autor
- `src/App.tsx` - Rota para gestao de autores se necessario

### Documentacao
- Atualizar `docs/_active/03-blog/blog-editor.md` com todas as novas funcionalidades
