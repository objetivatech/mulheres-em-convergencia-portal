# Gerenciamento de Landing Pages - Painel Admin

## Visão Geral

O sistema de Landing Pages permite criar, editar, duplicar e gerenciar páginas de venda diretamente pelo painel administrativo, sem necessidade de alterar código.

## Acesso

- **Listagem**: `/admin/landing-pages`
- **Editor**: `/admin/landing-pages/:id`
- **Nova LP**: `/admin/landing-pages/nova`
- **URL pública**: `/lp/:slug`

## Funcionalidades

### Listagem
- Tabela com todas as LPs cadastradas
- Filtro por status (Rascunho, Publicada, Arquivada)
- Ações: Editar, Duplicar, Visualizar, Ativar/Desativar, Excluir

### Editor
O editor é dividido em abas:

1. **Geral**: Título, slug, status, SEO, imagem de capa, dados do produto, seções habilitadas
2. **Hero**: Headline, subheadline, descrição, CTAs
3. **Conteúdo**: Pontos de Dor, Método, Incluído, Público-Alvo, Transformação, Investimento
4. **Pilares**: Até 4 pilares com título, subtítulo, descrição e ícone
5. **Evento**: Datas, duração, formato, local
6. **Depoimentos**: Vídeos YouTube ou texto, com nome e cargo

### Seções Opcionais
Cada seção (exceto Hero e Investimento) pode ser desabilitada via toggle na aba Geral, permitindo LPs com diferentes composições.

### Duplicação
Qualquer LP pode ser duplicada com um clique. A cópia é criada como rascunho com slug único.

## Estrutura de Dados

O conteúdo da LP é armazenado na coluna `content` (JSONB) da tabela `landing_pages`, seguindo o tipo `LandingPageContent` definido em `src/types/landing-page.ts`.

### Campos da tabela `landing_pages`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| slug | TEXT | URL amigável |
| title | TEXT | Título da LP |
| content | JSONB | Conteúdo completo da LP |
| status | TEXT | draft, published, archived |
| active | BOOLEAN | Se a LP está visível |
| featured | BOOLEAN | Destaque no slider |
| seo_title | TEXT | Título para SEO |
| seo_description | TEXT | Descrição para SEO |
| sections_enabled | JSONB | Quais seções estão ativas |
| image_url | TEXT | Imagem de capa |
| created_by | UUID | Quem criou |

## Renderização Pública

As LPs publicadas e ativas são acessíveis em `/lp/:slug`. A renderização usa os mesmos componentes modulares (`LPHero`, `LPPainPoints`, etc.) com os dados vindos do banco.

## Componentes Reutilizáveis

Os componentes de LP ficam em `src/components/landing-page/`:
- `LPHero` - Seção principal
- `LPPainPoints` - Pontos de dor
- `LPMethod` - Método
- `LPPillars` - Pilares
- `LPIncluded` - O que está incluído
- `LPTargetAudience` - Público-alvo
- `LPTransformation` - Transformações
- `LPEventDetails` - Detalhes do evento
- `LPInvestment` - Investimento
- `LPCheckoutForm` - Formulário de checkout
- `LPTestimonials` - Depoimentos

## Arquivos Relacionados

- `src/hooks/useLandingPages.ts` - Hook CRUD
- `src/pages/admin/AdminLandingPages.tsx` - Listagem admin
- `src/pages/admin/AdminLandingPageEditor.tsx` - Editor admin
- `src/pages/DynamicLandingPage.tsx` - Renderização pública
- `src/types/landing-page.ts` - Tipos TypeScript
