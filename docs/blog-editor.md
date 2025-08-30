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
- **TinyMCE** como editor WYSIWYG
- **Upload de imagens** direto no editor
- **Formatação completa**: títulos, listas, links, tabelas
- **Preview em tempo real**
- **Sanitização** de HTML com DOMPurify

### 3. Gestão de Conteúdo
- **Títulos e slugs** auto-gerados
- **Resumos/excerpts** para SEO
- **Imagens destacadas** com upload
- **Categorização** completa
- **Status**: rascunho, publicado, arquivado
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

## Estrutura Técnica

### Hooks Customizados
- `useBlogPosts`: Gestão de posts (CRUD)
- `useBlogCategories`: Gestão de categorias e tags
- `useImageUpload`: Upload e gerenciamento de imagens

### Componentes
- `RichTextEditor`: Editor TinyMCE configurado
- `ImageUploader`: Interface de upload com drag & drop
- `CategoryManager`: Gestão de categorias

### Páginas
- `BlogDashboard`: Painel principal do blog
- `BlogEditor`: Editor de posts (novo/editar)
- `BlogCategories`: Gestão de categorias

## Permissões e Segurança

### Controle de Acesso
- **Role `blog_editor`**: Pode criar e editar posts próprios
- **Role `admin`**: Acesso total ao sistema de blog
- **RLS** configurado no Supabase para proteção de dados

### Validação
- **Títulos obrigatórios** e únicos
- **Slugs únicos** e SEO-friendly
- **Sanitização HTML** para segurança
- **Validação de imagens** (formato e tamanho)

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

## Próximos Passos (Futuro)

1. **Sistema de Tags**: Implementação completa
2. **Programação de Posts**: Publicação automática
3. **Analytics**: Estatísticas detalhadas de visualizações
4. **Integração Strapi**: CMS headless (opcional)
5. **Comentários**: Sistema de comentários para posts

## Status de Implementação

✅ **Dashboard completo** com estatísticas e filtros
✅ **Editor rico** com TinyMCE
✅ **Upload de imagens** integrado
✅ **Gestão de categorias** completa
✅ **Sistema de permissões** configurado
✅ **Validação e segurança** implementadas
✅ **Interface responsiva** e acessível

O sistema está **100% funcional** e pronto para criação e gestão de conteúdo do blog.