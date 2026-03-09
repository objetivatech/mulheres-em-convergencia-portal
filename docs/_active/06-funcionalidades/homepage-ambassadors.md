# Seção de Embaixadoras na Homepage

## Visão Geral

Bloco de destaque para as embaixadoras MeC na homepage, posicionado entre FeaturedPosts e FinalCTA.

## Componente

**Arquivo:** `src/components/home/AmbassadorsShowcase.tsx`

### Funcionalidades
- Carrossel horizontal com Embla Carousel
- Auto-play a cada 4 segundos
- Exibe até 8 embaixadoras
- Design simplificado: avatar + nome + localização
- CTA para página `/embaixadoras`
- Responsivo: 1 card em mobile, 4 em desktop

### Dados
Utiliza o hook `usePublicAmbassadors` existente, que busca da tabela `ambassadors`:
- `public_name`
- `public_photo_url`
- `public_city`
- `public_state`

### Filtros Aplicados
- `active = true`
- `show_on_public_page = true`
- `public_name IS NOT NULL`
- Ordenado por `display_order`

## Estilo Visual

```text
┌──────────────────────────────────────────────────┐
│         [ícone] Embaixadoras MeC                 │
│                                                  │
│           Quem nos Representa                    │
│   Texto descritivo sobre as embaixadoras...      │
│                                                  │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ 👤  │  │ 👤  │  │ 👤  │  │ 👤  │  ◀ ▶       │
│  │Nome │  │Nome │  │Nome │  │Nome │             │
│  │Local│  │Local│  │Local│  │Local│             │
│  └─────┘  └─────┘  └─────┘  └─────┘             │
│                                                  │
│        [Conheça nossas Embaixadoras →]          │
└──────────────────────────────────────────────────┘
```

## Posição na Homepage

| Ordem | Componente |
|-------|------------|
| ... | ... |
| 9 | FeaturedPosts |
| **10** | **AmbassadorsShowcase** |
| 11 | FinalCTA |

## Dependências

- `embla-carousel-react` - já instalado
- `embla-carousel-autoplay` - já instalado
- `@/components/ui/carousel` - componente shadcn

## Alterações de Arquivo

- `src/pages/Index.tsx` - importa e renderiza AmbassadorsShowcase
- `src/components/home/AmbassadorsShowcase.tsx` - novo componente
