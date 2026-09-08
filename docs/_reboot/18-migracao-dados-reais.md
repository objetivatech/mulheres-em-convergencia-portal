# 18 — Migração dos dados reais (banco antigo → banco novo)

## O que faz
A função `migrar-legado` lê **somente** o banco antigo (`ngqymbjatenxztrjjdxa`) e escreve no banco novo (`tysvpeprhokdijquprkd`). Nada é alterado no antigo.

Copia:
- `businesses` → `negocios` (+ `gallery_images` → `negocio_midias` tipo `galeria`)
- `blog_authors` → `autores`, `blog_categories` → `post_categorias`, `blog_tags` → `post_tags`
- `blog_posts` → `posts`, com vínculos de categoria (`category_id` + `blog_post_categories`) e de tag
- `pages` → `paginas`

## Idempotência
Tudo entra por `upsert` com conflito em `slug` (e em `post_id,categoria_id` / `post_id,tag_id` nos vínculos). A galeria de cada negócio é apagada e regravada. Rodar duas vezes produz o mesmo resultado.

## Regras de conversão
- Negócio publicado quando `subscription_active = true` ou `is_complimentary = true`; destaque = `featured`.
- Post publicado quando `status = 'published'`; senão vira rascunho.
- Página publicada quando `status = 'published'` ou `is_public = true`.
- Slugs ausentes são gerados a partir do nome/título, sem acento, com sufixo numérico em caso de repetição.

## Como rodar
Autenticação: JWT de administradora **ou** header `x-cron-secret` com `CRON_SECRET` (ou `MIGRACAO_TOKEN`).

```
POST /functions/v1/migrar-legado   {"acao":"inspecionar"}   # lista tabelas e colunas do antigo
POST /functions/v1/migrar-legado   {"acao":"migrar"}        # migra tudo
POST /functions/v1/migrar-legado   {"acao":"migrar","alvos":["negocios"]}
```

## Execução de 08/09/2026
23 negócios (7 publicados), 23 imagens de galeria, 22 posts, 1 autora, 9 categorias, 36 tags, 47 vínculos de categoria, 163 vínculos de tag, 5 páginas.

## Reversão
Como o antigo não é tocado, reverter significa apagar/ajustar no novo:
```sql
delete from negocio_midias; delete from negocios;
delete from post_tag_vinculo; delete from post_categoria_vinculo; delete from posts;
```
Depois basta rodar a função de novo para repor.

## Segredos
- `LEGACY_SUPABASE_SERVICE_ROLE_KEY` — leitura do banco antigo.
- `MIGRACAO_TOKEN` — token operacional da migração; pode ser removido após o corte.
