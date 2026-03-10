# Performance Optimization - Portal MeC

## Visão Geral
Conjunto de otimizações aplicadas para melhorar o PageSpeed score, especialmente em mobile.

## Diagnóstico Inicial (mobile)
- Performance: 47
- FCP: 8.0s
- LCP: 14.9s
- TBT: 420ms

## Otimizações Implementadas

### 1. index.html
- **Preconnect** para Supabase, Google Fonts, GTM
- **DNS-prefetch** para Google Ads e Facebook
- **Preload** da fonte Montserrat
- **GTM deferido:** Carregamento do GTM movido para `window.load + 2s delay`, removendo script render-blocking do `<head>`

### 2. Fontes
- Google Fonts já usa `display=swap` via URL
- Preload do CSS de fontes para iniciar download antecipado

### 3. Logo (acima da dobra)
- `loading="eager"` no `LogoComponent` (antes era `lazy`)
- `fetchPriority="high"` para priorizar LCP
- Dimensões explícitas (`width`/`height`) para evitar layout shift (CLS)

### 4. Componente OptimizedImage
- Novo `src/components/ui/OptimizedImage.tsx`
- Props: `priority` (eager loading + fetchPriority), `responsiveSizes` (srcset), `fallbackSrc`
- `decoding="async"` por padrão para não bloquear thread principal
- Dimensões explícitas reduzem CLS

### 5. Lazy Loading
- Mantido `loading="lazy"` em imagens abaixo da dobra (cards, galeria, etc.)
- Removido de imagens acima da dobra (logo)

## Componente OptimizedImage - Uso

```tsx
import OptimizedImage from '@/components/ui/OptimizedImage';

// Imagem hero (acima da dobra)
<OptimizedImage
  src={heroUrl}
  alt="Hero"
  width={1200}
  height={630}
  priority
/>

// Imagem em card (abaixo da dobra)
<OptimizedImage
  src={cardUrl}
  alt="Card"
  width={400}
  height={225}
/>
```

## Arquivos Afetados
- `index.html` — preconnects, font preload, GTM defer
- `src/components/layout/LogoComponent.tsx` — eager loading, dimensions
- `src/components/ui/OptimizedImage.tsx` — novo componente reutilizável
