# Deploy da Edge Function generate-rss

**Data:** 22 de outubro de 2025  
**Status:** ✅ Código corrigido e pronto para deploy

---

## 📋 Resumo

A edge function `generate-rss` foi corrigida para funcionar no deploy via Supabase Dashboard. O problema anterior era a importação do arquivo `_shared/cors.ts`, que não é enviado automaticamente pelo Dashboard.

**Solução implementada:** O código CORS foi incluído diretamente na função, removendo a dependência externa.

---

## 🚀 Como fazer o deploy via Supabase Dashboard

### Passo 1: Acessar o Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto **Mulheres em Convergência**
3. No menu lateral, clique em **Edge Functions**

### Passo 2: Criar ou atualizar a função

1. Se a função `generate-rss` já existe:
   - Clique na função existente
   - Clique em **Edit Function**
   
2. Se a função não existe:
   - Clique em **Create a new function**
   - Nome: `generate-rss`

### Passo 3: Copiar o código

Copie o código completo abaixo e cole no editor do Supabase Dashboard:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  published_at: string;
  author: {
    full_name: string;
  };
  category: {
    name: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        published_at,
        profiles:author_id (
          full_name
        ),
        blog_categories:category_id (
          name
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    const typedPosts = posts as unknown as BlogPost[];
    const baseUrl = 'https://mulheresemconvergencia.com.br';
    const rssDate = new Date().toUTCString();

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Mulheres em Convergência - Blog Convergindo</title>
    <description>Portal dedicado ao empoderamento e conexão de mulheres empreendedoras</description>
    <link>${baseUrl}</link>
    <language>pt-BR</language>
    <lastBuildDate>${rssDate}</lastBuildDate>
    <pubDate>${rssDate}</pubDate>
    <managingEditor>contato@mulheresemconvergencia.com.br (Mulheres em Convergência)</managingEditor>
    <webMaster>contato@mulheresemconvergencia.com.br (Mulheres em Convergência)</webMaster>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/assets/logo-horizontal.png</url>
      <title>Mulheres em Convergência</title>
      <link>${baseUrl}</link>
    </image>
    ${typedPosts.map(post => {
      const postUrl = `${baseUrl}/convergindo/${post.slug}`;
      const pubDate = new Date(post.published_at).toUTCString();
      const author = post.author?.full_name || 'Mulheres em Convergência';
      const category = post.category?.name || 'Geral';
      
      // Clean content for RSS (remove HTML tags for description)
      const cleanExcerpt = post.excerpt?.replace(/<[^>]*>/g, '') || '';
      const cleanContent = post.content?.replace(/<[^>]*>/g, '') || '';
      
      // Prepare content with featured image
      let fullContent = '';
      if (post.featured_image_url) {
        fullContent = `<p><img src="${post.featured_image_url}" alt="${post.title}" style="max-width: 100%; height: auto;" /></p>`;
      }
      fullContent += post.content || '';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${cleanExcerpt || cleanContent.substring(0, 300) + '...'}]]></description>
      <content:encoded><![CDATA[${fullContent}]]></content:encoded>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>contato@mulheresemconvergencia.com.br (${author})</author>
      <category><![CDATA[${category}]]></category>
      ${post.featured_image_url ? `
      <enclosure url="${post.featured_image_url}" type="image/jpeg" length="0" />
      <media:content url="${post.featured_image_url}" medium="image" type="image/jpeg">
        <media:title>${post.title}</media:title>
      </media:content>` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });

  } catch (error) {
    console.error('RSS generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate RSS feed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Passo 4: Deploy

1. Clique em **Deploy** (ou **Save and Deploy**)
2. Aguarde a confirmação de deploy bem-sucedido
3. Anote a URL da função (geralmente: `https://[seu-projeto].supabase.co/functions/v1/generate-rss`)

---

## 🧪 Como testar o RSS feed

### Teste 1: Verificar se a função está respondendo

Abra no navegador ou use curl:

```bash
curl https://[seu-projeto].supabase.co/functions/v1/generate-rss
```

**Resultado esperado:** Um XML válido com os posts do blog

### Teste 2: Validar o RSS

1. Acesse https://validator.w3.org/feed/
2. Cole a URL da função
3. Clique em **Check**

**Resultado esperado:** Validação bem-sucedida sem erros críticos

### Teste 3: Verificar imagens no feed

1. Abra o XML gerado
2. Procure por tags `<enclosure>` e `<media:content>`
3. Verifique se as URLs das imagens estão corretas

**Exemplo esperado:**
```xml
<enclosure url="https://[storage-url]/featured-image.jpg" type="image/jpeg" length="0" />
<media:content url="https://[storage-url]/featured-image.jpg" medium="image" type="image/jpeg">
  <media:title>Título do Post</media:title>
</media:content>
```

### Teste 4: Testar em um leitor de RSS

Use um leitor de RSS como:
- Feedly (https://feedly.com)
- Inoreader (https://www.inoreader.com)
- Thunderbird (cliente de email com suporte a RSS)

Adicione a URL da função e verifique se:
- Os posts aparecem corretamente
- As imagens são exibidas
- Os links funcionam

---

## 📝 Integração com o site

Após o deploy bem-sucedido, você pode adicionar o link do RSS no site:

### Opção 1: Meta tag no HTML

Adicione no `<head>` do site:

```html
<link rel="alternate" type="application/rss+xml" 
      title="Mulheres em Convergência - Blog" 
      href="https://[seu-projeto].supabase.co/functions/v1/generate-rss" />
```

### Opção 2: Link visível para usuários

Adicione um botão ou link no blog:

```html
<a href="https://[seu-projeto].supabase.co/functions/v1/generate-rss" 
   target="_blank" 
   rel="noopener noreferrer">
  <i class="fas fa-rss"></i> Assinar RSS
</a>
```

---

## 🔧 Troubleshooting

### Erro: "Module not found"

**Causa:** A função ainda está tentando importar arquivos externos  
**Solução:** Certifique-se de copiar o código completo fornecido acima, que já inclui o CORS inline

### Erro: "Failed to fetch posts"

**Causa:** Problema de permissões no banco de dados  
**Solução:** Verifique as políticas RLS da tabela `blog_posts`:
```sql
-- Permitir leitura pública de posts publicados
CREATE POLICY "Public can read published posts"
ON blog_posts FOR SELECT
USING (status = 'published');
```

### Erro: "CORS error"

**Causa:** Headers CORS não configurados corretamente  
**Solução:** O código fornecido já inclui os headers corretos. Verifique se copiou todo o código.

### Imagens não aparecem no RSS

**Causa:** URLs das imagens podem estar incorretas ou privadas  
**Solução:** 
1. Verifique se as imagens no Storage são públicas
2. Confirme que `featured_image_url` contém URLs completas (não apenas paths)

---

## ✅ Checklist de deploy

- [ ] Código copiado completamente do arquivo ou desta documentação
- [ ] Deploy realizado via Supabase Dashboard
- [ ] Função respondendo corretamente (teste com curl ou navegador)
- [ ] RSS validado em https://validator.w3.org/feed/
- [ ] Imagens aparecendo no feed
- [ ] Testado em um leitor de RSS
- [ ] Link do RSS adicionado no site (opcional)

---

## 📚 Recursos adicionais

- **Especificação RSS 2.0:** https://www.rssboard.org/rss-specification
- **Media RSS:** https://www.rssboard.org/media-rss
- **Validador W3C:** https://validator.w3.org/feed/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

## 📌 Notas importantes

1. **Cache:** O RSS tem cache de 1 hora (`max-age=3600`). Mudanças no blog podem levar até 1 hora para aparecer no feed.

2. **Limite de posts:** O feed retorna os 50 posts mais recentes. Para alterar, modifique `.limit(50)` no código.

3. **Imagens:** O feed inclui imagens de duas formas:
   - `<enclosure>`: Para compatibilidade com leitores antigos
   - `<media:content>`: Para leitores modernos com suporte a Media RSS

4. **Segurança:** A função usa a chave anônima do Supabase (`SUPABASE_ANON_KEY`), que já está configurada automaticamente nas variáveis de ambiente.

---

**Última atualização:** 22 de outubro de 2025  
**Commit relacionado:** `aa4f77a` - Remove dependência de cors.ts na edge function generate-rss

