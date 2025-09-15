# Sistema de Compartilhamento Social - Blog Posts

## Visão Geral

Sistema completo de compartilhamento social integrado aos posts do blog, permitindo que leitores compartilhem conteúdo em múltiplas plataformas com tracking UTM para análise de performance.

## Componente ShareButtons

**Arquivo:** `src/components/blog/ShareButtons.tsx`

### Plataformas Suportadas

#### 1. **Redes Sociais Principais**
- ✅ **Facebook** - Compartilhamento via Sharer API
- ✅ **LinkedIn** - Share API nativa
- ✅ **WhatsApp** - Web API para compartilhamento
- ✅ **Telegram** - Share URL com texto personalizado
- ✅ **Email** - Mailto com assunto e corpo formatados

#### 2. **Funcionalidades Especiais**
- ✅ **Copiar Link** - Com UTMs personalizados
- ✅ **Instagram** - Instruções para Stories/Posts
- ✅ **Share Nativo** - Web Share API para mobile

### Interface de Uso

```typescript
<ShareButtons
  title={post.title}
  url={`https://mulhereemconvergeencia.com.br/convergindo/${post.slug}`}
  description={post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)}
  imageUrl={post.featured_image_url}
/>
```

### Props Disponíveis

```typescript
interface ShareButtonsProps {
  title: string;           // Título do post
  url: string;            // URL canônica do post
  description?: string;    // Descrição/excerpt
  imageUrl?: string;      // Imagem destacada
  className?: string;     // Classes CSS adicionais
}
```

## Sistema de UTM Tracking

### Parâmetros Gerados Automaticamente

```typescript
const generateUTMUrl = (source: string, medium: string = 'social') => {
  const utmParams = new URLSearchParams({
    utm_source: source,        // facebook, linkedin, whatsapp, etc.
    utm_medium: medium,        // social, email, direct
    utm_campaign: 'blog_share', // Campanha fixa
    utm_content: title.toLowerCase().replace(/\s+/g, '_') // Título como identificador
  });
  
  return `${url}?${utmParams.toString()}`;
};
```

### Exemplos de URLs Geradas

**Facebook:**
```
https://mulhereemconvergeencia.com.br/convergindo/exemplo-post?utm_source=facebook&utm_medium=social&utm_campaign=blog_share&utm_content=exemplo_post
```

**LinkedIn:**
```
https://mulhereemconvergeencia.com.br/convergindo/exemplo-post?utm_source=linkedin&utm_medium=social&utm_campaign=blog_share&utm_content=exemplo_post
```

**Email:**
```
https://mulhereemconvergeencia.com.br/convergindo/exemplo-post?utm_source=email&utm_medium=email&utm_campaign=blog_share&utm_content=exemplo_post
```

## Conteúdo Personalizado por Plataforma

### Facebook
```typescript
🌟 Novo post no Blog Convergindo!

${postTitle}

${postExcerpt}

📂 Categoria: ${categoryName}
✍️ Por: ${authorName}

Leia o post completo: ${postUrl}

#MulheresEmConvergencia #Empreendedorismo #MulheresEmpreendedoras #BlogConvergindo
```

### LinkedIn
```typescript
🚀 Novo artigo publicado no Blog Convergindo

${postTitle}

${postExcerpt}

Este conteúdo foi criado para inspirar e empoderar mulheres empreendedoras em sua jornada de crescimento.

#${categoryName} #MulheresEmConvergencia #Empreendedorismo

Leia mais: ${postUrl}
```

### Twitter/X
```typescript
✨ ${postTitle}

${postExcerpt.length > 100 ? postExcerpt.substring(0, 100) + '...' : postExcerpt}

${postUrl}

#MulheresEmConvergencia #Empreendedorismo
```

### Instagram
```typescript
🌟 ${postTitle}

${postExcerpt}

📂 ${categoryName}
✍️ ${authorName}

Link no nosso perfil! 👆

#MulheresEmConvergencia #Empreendedorismo #MulheresEmpreendedoras
```

## Integração com Posts

### No Componente Post.tsx

**Posicionamento estratégico:**
```typescript
{/* Content */}
<div className="prose prose-lg max-w-none">
  {/* Conteúdo do post */}
</div>

{/* Social Share Buttons */}
<div className="mt-8 pt-8 border-t border-border">
  <ShareButtons
    title={post.title}
    url={`https://mulhereemconvergeencia.com.br/convergindo/${post.slug}`}
    description={post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)}
    imageUrl={post.featured_image_url}
  />
</div>
```

## Design e UX

### Layout Responsivo

**Desktop:**
```
🔗 Compartilhar este post:
[Facebook] [LinkedIn] [WhatsApp] [Telegram] [Email] [Copiar Link]

💡 Para Instagram: Copie o link e compartilhe nos Stories ou posts
```

**Mobile:**
```
🔗 Compartilhar este post:
[📘] [💼] [📱] [✈️] [📧] [📋] [📤 Compartilhar]

💡 Para Instagram: Copie o link...
```

### Estados Visuais

**Botão Normal:**
```css
variant="outline" 
className="flex items-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
```

**Botão Copiado:**
```typescript
{copied ? (
  <Check className="h-4 w-4 text-green-600" />
) : (
  <Copy className="h-4 w-4" />
)}
```

### Cores por Plataforma

- **Facebook**: `hover:bg-blue-600`
- **LinkedIn**: `hover:bg-blue-700`
- **WhatsApp**: `hover:bg-green-600`
- **Telegram**: `hover:bg-blue-500`
- **Email**: `hover:bg-gray-600`
- **Copiar**: `hover:bg-primary`

## Funcionalidades Especiais

### 1. **Web Share API (Mobile)**
```typescript
const handleNativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: description,
        url: generateUTMUrl('native_share', 'mobile')
      });
    } catch (err) {
      console.log('Share cancelled or failed');
    }
  }
};
```

### 2. **Clipboard API**
```typescript
const handleCopyLink = async () => {
  try {
    const shareUrl = generateUTMUrl('copy_link', 'direct');
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
  } catch (err) {
    toast.error('Erro ao copiar o link');
  }
};
```

### 3. **Instagram Guidelines**
```typescript
<div className="mt-3 p-2 bg-muted rounded-lg">
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Instagram className="h-3 w-3" />
    <span>
      Para Instagram: Copie o link e compartilhe nos Stories ou posts
    </span>
  </div>
</div>
```

## Analytics e Tracking

### UTM Parameters Tracking

**Google Analytics 4:**
- **Source**: Identifica a plataforma (facebook, linkedin, etc.)
- **Medium**: Tipo de mídia (social, email, direct)
- **Campaign**: Sempre 'blog_share'
- **Content**: Slug do post para identificação

### Relatórios Disponíveis

1. **Tráfego por Fonte Social**
   - Qual rede social gera mais visitas
   - Performance por post
   - Conversões por canal

2. **Engagement por Plataforma**
   - Taxa de clique por botão
   - Tempo na página por origem
   - Taxa de rejeição por canal

3. **Conteúdo Mais Compartilhado**
   - Posts com mais shares
   - Categorias mais populares
   - Padrões de compartilhamento

## Performance e Acessibilidade

### Otimizações

**Lazy Loading:**
- Ícones carregados sob demanda
- JavaScript não-bloquear

**ARIA Labels:**
```typescript
aria-label="Compartilhar no Facebook"
```

**Keyboard Navigation:**
- Todos os botões acessíveis via teclado
- Tab order lógico
- Enter/Space funcionais

### Compatibilidade

- ✅ **Desktop**: Todos os navegadores modernos
- ✅ **Mobile**: iOS Safari, Chrome Android
- ✅ **Tablets**: Responsivo completo
- ✅ **Screen readers**: ARIA labels apropriadas

## Próximas Melhorias

### 1. **Analytics Avançados**
- [ ] Tracking de clicks por botão
- [ ] Heatmaps de interação
- [ ] A/B testing de posicionamento

### 2. **Funcionalidades Adicionais**
- [ ] Pinterest share button
- [ ] Reddit compartilhamento
- [ ] Print/PDF options

### 3. **Personalização**
- [ ] Botões condicionais por categoria
- [ ] Textos customizáveis por post
- [ ] Temas alternativos

## Manutenção e Suporte

### Monitoramento
- URLs de compartilhamento funcionais
- UTMs sendo capturados no Analytics
- Fallbacks para APIs indisponíveis

### Debugging
```typescript
console.log('Sending to platform:', { platform, url, title });
```

### Testes Regulares
- [ ] Compartilhamento em cada plataforma
- [ ] Tracking UTM no Analytics
- [ ] Compatibilidade mobile

## Status de Implementação

🎉 **CONCLUÍDO** - Sistema de compartilhamento social completo implementado em setembro de 2025

**Resultado:**
- ✅ 7 plataformas de compartilhamento
- ✅ UTM tracking completo
- ✅ Design responsivo e acessível
- ✅ Conteúdo personalizado por plataforma
- ✅ Web Share API para mobile
- ✅ Clipboard API com feedback visual