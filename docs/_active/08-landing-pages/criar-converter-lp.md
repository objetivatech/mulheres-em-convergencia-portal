# Landing Page - Método Criar & Converter

## Visão Geral

Landing Page de vendas para o produto "Método Criar & Converter", totalmente integrada ao portal Mulheres em Convergência.

**URL**: `/criar-converter`

## Arquitetura

### Estrutura de Arquivos

```
src/
├── types/
│   └── landing-page.ts          # Tipos TypeScript reutilizáveis
├── data/
│   └── products/
│       └── criar-converter.ts   # Conteúdo editável da LP
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
│       ├── LPEventDetails.tsx   # Detalhes do evento
│       ├── LPInvestment.tsx     # Preço e CTA final
│       └── LPCheckoutForm.tsx   # Formulário de checkout
└── pages/
    └── CriarConverterPage.tsx   # Página principal

supabase/
└── functions/
    └── create-product-payment/  # Edge Function para pagamento
```

## Como Editar o Conteúdo

Todo o conteúdo editável está em `src/data/products/criar-converter.ts`:

```typescript
export const criarConverterContent: LandingPageContent = {
  product: {
    price: 297.00,        // Alterar preço aqui
    eventDates: '21, 22 e 23 de janeiro',
    // ...
  },
  hero: {
    headline: 'Crie conteúdo com estratégia...',
    // ...
  },
  // Todas as seções são editáveis
};
```

## Como Duplicar para Novo Produto

1. **Copiar arquivo de dados**:
   ```bash
   cp src/data/products/criar-converter.ts src/data/products/novo-produto.ts
   ```

2. **Editar o conteúdo** no novo arquivo

3. **Criar nova página**:
   ```typescript
   // src/pages/NovoProdutoPage.tsx
   import { novoConteudo } from '@/data/products/novo-produto';
   // Usar os mesmos componentes LP*
   ```

4. **Adicionar rota** em `App.tsx`:
   ```typescript
   <Route path="/novo-produto" element={<NovoProdutoPage />} />
   ```

## Integração com ASAAS

- Edge Function: `create-product-payment`
- Aceita: PIX, Cartão, Boleto (UNDEFINED billing type)
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
- URL canônica definida
- Estrutura semântica com sections
