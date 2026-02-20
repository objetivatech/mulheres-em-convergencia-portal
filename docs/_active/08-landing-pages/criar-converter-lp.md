# Landing Page - Método Criar & Converter

## Visão Geral

Landing Page de vendas para o produto "Método Criar & Converter", totalmente integrada ao portal Mulheres em Convergência.

**URLs**:
- Rota fixa: `/criar-converter`
- Rota dinâmica: `/lp/criar-converter`

> **Nota**: O conteúdo desta LP agora é gerenciado pelo banco de dados via painel admin (`/admin/landing-pages`). O arquivo estático `src/data/products/criar-converter.ts` foi mantido como fallback para a rota fixa.

## Gerenciamento pelo Painel Admin

Consulte a documentação completa em [admin-landing-pages.md](./admin-landing-pages.md).

Para editar o conteúdo da LP "Criar e Converter":
1. Acesse `/admin/landing-pages`
2. Clique em "Editar" na LP desejada
3. Modifique o conteúdo nas abas disponíveis
4. Clique em "Salvar"

## Arquitetura

### Estrutura de Arquivos

```
src/
├── types/
│   └── landing-page.ts          # Tipos TypeScript reutilizáveis
├── data/
│   └── products/
│       └── criar-converter.ts   # Conteúdo estático (fallback)
├── hooks/
│   └── useLandingPages.ts       # Hook CRUD para LPs dinâmicas
├── components/
│   └── landing-page/
│       ├── index.ts             # Export central
│       ├── LPHero.tsx           # Seção Hero
│       ├── LPPainPoints.tsx     # Dores/Identificação
│       ├── LPMethod.tsx         # Apresentação do Método
│       ├── LPPillars.tsx        # Pilares (3 cards)
│       ├── LPIncluded.tsx       # O que está incluído
│       ├── LPTargetAudience.tsx # Para quem é
│       ├── LPTransformation.tsx # Transformação/Resultados
│       ├── LPTestimonials.tsx   # Depoimentos (vídeo e texto)
│       ├── LPEventDetails.tsx   # Detalhes do evento
│       ├── LPInvestment.tsx     # Preço e CTA final
│       └── LPCheckoutForm.tsx   # Formulário de checkout
└── pages/
    ├── CriarConverterPage.tsx   # Página fixa (fallback)
    ├── DynamicLandingPage.tsx   # Renderização dinâmica
    └── admin/
        ├── AdminLandingPages.tsx      # Listagem admin
        └── AdminLandingPageEditor.tsx # Editor admin
```

---

## Como Criar Novas LPs

### Via Painel Admin (Recomendado)
1. Acesse `/admin/landing-pages`
2. Clique em "Nova Landing Page"
3. Preencha título e slug
4. Edite o conteúdo nas abas
5. Altere o status para "Publicada" e ative

### Via Duplicação
1. Na listagem, clique no ícone de duplicar em uma LP existente
2. A cópia é criada como rascunho
3. Edite conforme necessário

---

## Integração com ASAAS

- Edge Function: `create-product-payment`
- Aceita: PIX, Cartão, Boleto
- Cria lead no CRM automaticamente
- Redireciona para checkout do ASAAS

## Integração CRM

Ao iniciar uma compra:
1. Lead criado/atualizado em `crm_leads`
2. Interação registrada em `crm_interactions`
3. Webhook ASAAS confirma pagamento

## SEO

- Meta tags dinâmicas via react-helmet-async
- Open Graph configurado
- Campos SEO editáveis no painel admin
- URL canônica definida

---

## Depoimentos

Suporta dois tipos:
- **Vídeo**: URL do YouTube (Shorts, embed, watch)
- **Texto**: Quote com nome e cargo

Formatos de URL suportados para vídeos:
- `https://youtube.com/shorts/ABC123`
- `https://www.youtube.com/watch?v=ABC123`
- `https://youtu.be/ABC123`
- Apenas o ID: `ABC123`
