# Deploy da Edge Function generate-rss

**Data:** 22 de outubro de 2025 (atualizado em abril de 2026)
**Status:** ✅ Funcionando via Cloudflare Pages Function

---

## 📋 Resumo

A edge function `generate-rss` gera o feed RSS do blog. Ela é chamada internamente pelo proxy em `functions/[[path]].ts` (Cloudflare Pages Function), que intercepta requisições a `/rss.xml` no domínio oficial e faz a ponte para o Supabase.

**URL pública canônica:** `https://mulheresemconvergencia.com.br/rss.xml`

> ⚠️ **IMPORTANTE:** Nunca use URLs diretas do Supabase (`supabase.co/functions/v1/...`) em interfaces públicas, documentação externa ou ferramentas como Google Search Console. O domínio oficial é a única referência pública.

---

## 🏗️ Arquitetura

```
Usuário / Google / Agregadores RSS
        ↓
https://mulheresemconvergencia.com.br/rss.xml
        ↓
Cloudflare Pages Function (functions/[[path]].ts)
  - Adiciona headers apikey + Authorization
  - Retorna XML com Content-Type correto
  - Cache: 1 hora
        ↓
Supabase Edge Function (generate-rss)
  - Consulta posts publicados no banco
  - Gera RSS 2.0 com metadados completos
```

---

## 🚀 Deploy

A Edge Function é deployada automaticamente pelo Lovable ao fazer push. Não é necessário deploy manual via Dashboard.

---

## 🧪 Como testar

### Teste 1: URL pública
Acesse no navegador: `https://mulheresemconvergencia.com.br/rss.xml`

**Resultado esperado:** XML válido com os posts do blog.

### Teste 2: Validar o RSS
1. Acesse https://validator.w3.org/feed/
2. Cole a URL `https://mulheresemconvergencia.com.br/rss.xml`
3. Clique em **Check**

### Teste 3: Testar em um leitor de RSS
Use Feedly, Inoreader ou Thunderbird com a URL `https://mulheresemconvergencia.com.br/rss.xml`.

---

## 🔧 Troubleshooting

### RSS retorna 404
- Verifique se `functions/[[path]].ts` existe no repositório
- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão configuradas no Cloudflare Pages

### Erro: "Failed to fetch posts"
- Verifique as políticas RLS da tabela `blog_posts` (leitura pública para posts publicados)

---

## 📌 Notas

1. **Cache:** 1 hora (`max-age=3600`). Novos posts podem levar até 1h para aparecer.
2. **Limite:** 50 posts mais recentes.
3. **Segurança:** O header `apikey` é adicionado apenas no servidor (Cloudflare Pages Function), nunca exposto ao cliente.

---

**Última atualização:** Abril de 2026
