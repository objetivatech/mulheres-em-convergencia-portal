

# Plano de Implementacao - Correcoes e Novos Recursos

Este plano cobre 4 demandas principais, mais sugestoes de melhorias adicionais identificadas durante a analise.

---

## 1. Correcao do Carousel de Parceiros (Desktop + Mobile)

**Problema identificado:** O componente `PartnersCarousel.tsx` usa Embla Carousel com `loop: true` e `dragFree: true`, mas com poucos parceiros os itens nao preenchem a tela no desktop, fazendo o slider parecer estatico. No mobile, a ultima imagem fica "colada" na primeira.

**Solucao:**
- Duplicar o array de parceiros (renderizar `[...partners, ...partners]`) para garantir que haja itens suficientes para o loop funcionar suavemente em todas as resolucoes
- Adicionar `gap` via CSS nos slides para garantir espacamento entre o ultimo e o primeiro item
- Ajustar os flex-basis dos slides para garantir que sempre haja itens fora da viewport, permitindo a animacao fluida

**Arquivos afetados:**
- `src/components/partners/PartnersCarousel.tsx`

---

## 2. Timeline Dinamica com Filtro por Ano e Painel Admin

**Problema identificado:** A timeline atual tem 23 itens hardcoded no componente `Timeline.tsx`, sem filtro por ano. Na pagina `/sobre`, fica visualmente sobrecarregado.

**Solucao em 3 partes:**

### 2a. Tabela no banco de dados
- Criar tabela `timeline_items` com campos: `id`, `year`, `date_label`, `title`, `description`, `image_url`, `display_order`, `active`, `created_at`, `updated_at`
- Migrar os 23 itens hardcoded para esta tabela
- RLS: leitura publica para itens ativos, gerenciamento por admins

### 2b. Filtro por ano na pagina /sobre
- Adicionar seletor horizontal de anos (ex: 2015, 2017, 2018, 2019, 2020, 2021, 2022, 2023) acima do slider
- Ao selecionar um ano, filtrar apenas os itens daquele ano
- Botao "Todos" para exibir a timeline completa
- Design responsivo com scroll horizontal no mobile

### 2c. Painel Admin para Timeline
- Nova pagina `/admin/timeline` com CRUD completo
- Formulario com: titulo, data/periodo, descricao, imagem (upload para R2), ano, ordem de exibicao, ativo/inativo
- Lista com drag-and-drop para reordenar
- Link no painel admin principal

**Arquivos a criar:**
- `src/pages/admin/AdminTimeline.tsx` - Pagina de gerenciamento
- `src/hooks/useTimeline.ts` - Hook para dados da timeline
- Migracao SQL para tabela e dados iniciais

**Arquivos a modificar:**
- `src/components/timeline/Timeline.tsx` - Buscar do banco + aceitar filtro por ano
- `src/pages/Sobre.tsx` - Adicionar seletor de ano
- `src/App.tsx` - Nova rota `/admin/timeline`
- `src/pages/Admin.tsx` - Card de acesso rapido

---

## 3. Pagina "Quem e Elisangela Aranda"

**Solucao:**
- Criar pagina estatica `/quem-e-elisangela-aranda` com o texto fornecido
- Upload das 5 imagens para R2 (pasta `site-assets/`)
- Layout editorial com imagens distribuidas ao longo do texto (alternando lado esquerdo/direito)
- Hero com a imagem principal (foto com camiseta do projeto)
- SEO completo com meta tags e Open Graph
- Design responsivo com tipografia elegante

**Arquivos a criar:**
- `src/pages/QuemEElisangelaAranda.tsx`

**Arquivos a modificar:**
- `src/App.tsx` - Rota `/quem-e-elisangela-aranda`

**Rota final para adicionar ao menu:** `/quem-e-elisangela-aranda`

---

## 4. Modal de Imagens na Pagina de Negocios

**Problema identificado:** Na `DiretorioEmpresa.tsx`, o clique em imagens da galeria executa `window.open(image, '_blank')`, abrindo em nova aba.

**Solucao:**
- Criar componente `ImageLightbox` reutilizavel com Dialog/modal
- Suporte a navegacao entre imagens (setas esquerda/direita)
- Gestos de swipe no mobile
- Zoom pinch-to-zoom opcional
- Contador "3 de 12"
- Botao de fechar e clique fora para fechar
- Aplicar na galeria e em qualquer imagem linkada da pagina de negocios

**Arquivos a criar:**
- `src/components/ui/ImageLightbox.tsx`

**Arquivos a modificar:**
- `src/pages/DiretorioEmpresa.tsx` - Substituir `window.open` pelo modal

---

## 5. Melhorias Adicionais Identificadas

### 5a. Cover image da pagina de negocios tambem abre em modal
- A imagem de capa do negocio tambem pode ser clicada para abrir no lightbox, reutilizando o mesmo componente

### 5b. Acessibilidade no carousel de parceiros
- Adicionar `aria-label` nos botoes do carousel
- Pausar animacao quando o usuario usa `prefers-reduced-motion`

### 5c. Skeleton loading na timeline
- Ao carregar dados do banco, exibir skeleton cards em vez de tela vazia

---

## 6. Documentacao

Criar/atualizar os seguintes documentos:
- `docs/_active/CHANGELOG-2026-02-14.md` - Registro de todas as alteracoes
- `docs/_active/06-funcionalidades/timeline-dinamica.md` - Documentacao da timeline e painel admin
- `docs/_active/06-funcionalidades/image-lightbox.md` - Documentacao do componente de lightbox

---

## Detalhes Tecnicos

### Ordem de implementacao recomendada
1. Carousel de parceiros (correcao rapida, impacto visual imediato)
2. Modal de imagens (componente reutilizavel necessario para outros itens)
3. Pagina Elisangela Aranda (conteudo independente)
4. Timeline dinamica (mais complexo: banco + admin + frontend)
5. Documentacao (consolidar tudo ao final)

### Tabela SQL `timeline_items`
```text
id              UUID PRIMARY KEY
year            INTEGER NOT NULL
date_label      TEXT NOT NULL          -- ex: "Maio 2015", "2019 - 2022"
title           TEXT NOT NULL
description     TEXT NOT NULL
image_url       TEXT
display_order   INTEGER DEFAULT 0
active          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### Componente ImageLightbox - Props
```text
images: string[]          -- Array de URLs
initialIndex: number      -- Indice inicial
open: boolean
onOpenChange: (open: boolean) => void
```

