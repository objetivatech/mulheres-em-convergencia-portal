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
│       ├── LPTestimonials.tsx   # Depoimentos (vídeo e texto)
│       ├── LPEventDetails.tsx   # Detalhes do evento
│       ├── LPInvestment.tsx     # Preço e CTA final
│       └── LPCheckoutForm.tsx   # Formulário de checkout
└── pages/
    └── CriarConverterPage.tsx   # Página principal

supabase/
└── functions/
    └── create-product-payment/  # Edge Function para pagamento
```

---

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

---

## Guia Completo de Edição de Conteúdo

### Estrutura Básica de Cada Seção

Cada seção da LP possui propriedades específicas. Veja como editar cada uma:

### 1. Hero Section

```typescript
hero: {
  headline: 'Texto principal do H1',
  subheadline: 'Texto secundário explicativo',
  description: 'Descrição mais longa do produto',
  ctaPrimary: 'TEXTO DO BOTÃO PRINCIPAL',
  ctaSecondary: 'Texto do link secundário',
},
```

### 2. Pain Points (Dores)

```typescript
painPoints: {
  title: 'Título da seção',
  painPoints: [
    { text: 'Primeira dor' },
    { text: 'Segunda dor' },
    { text: '👉 Use emojis para destacar itens' },
  ],
  closingText: 'Texto de fechamento',
  closingHighlight: 'Texto em destaque',
},
```

### 3. Método

```typescript
method: {
  title: 'Título do método',
  description: 'Descrição do método',
  benefits: [
    'Benefício 1',
    'Benefício 2',
    'Benefício 3',
  ],
  closingText: 'Frase de impacto final',
},
```

### 4. Pilares

```typescript
pillars: {
  title: 'Os 3 Pilares do Método',
  pillars: [
    {
      id: 'pilar-1',
      title: 'Pilar 01',
      subtitle: 'Subtítulo',
      description: 'Descrição do pilar',
      icon: 'Lightbulb', // Ícone do Lucide React
    },
    // Adicione quantos pilares quiser
  ],
},
```

**Ícones disponíveis**: Qualquer ícone do [Lucide Icons](https://lucide.dev/icons). 
Exemplos: `Lightbulb`, `Target`, `Sparkles`, `Star`, `Heart`, `Check`, `Award`, etc.

### 5. O Que Está Incluído

```typescript
included: {
  title: 'O Que Você Vai Receber',
  items: [
    { text: 'Item normal' },
    { text: 'Item destacado', highlight: true },
    { text: 'Item bônus especial', isBonus: true },
  ],
},
```

- `highlight: true` - Adiciona destaque visual
- `isBonus: true` - Marca como bônus com badge especial

### 6. Para Quem É

```typescript
targetAudience: {
  title: 'Para Quem É o Produto',
  profiles: [
    'Perfil 1',
    'Perfil 2',
    'Perfil 3',
  ],
  ctaPrimary: 'Frase de chamada opcional no final',
},
```

### 7. Transformação

```typescript
transformation: {
  title: 'Depois do Método, Você:',
  transformations: [
    { text: 'Resultado 1' },
    { text: 'Resultado 2' },
  ],
  ctaPrimary: 'Frase de impacto final',
},
```

### 8. Detalhes do Evento

```typescript
eventDetails: {
  title: 'Detalhes do Evento',
  dates: '21, 22 e 23 de janeiro de 2026',
  duration: '+ de 20 horas de conteúdos',
  format: 'Presencial',
  location: 'São Paulo - SP',
},
```

### 9. Investimento

```typescript
investment: {
  title: 'Investimento',
  price: 'R$ 297,00',
  priceValue: 297.00,  // Valor numérico para o checkout
  description: 'Descrição da oferta',
  ctaText: 'TEXTO DO BOTÃO DE COMPRA',
},
```

### 10. Depoimentos (NOVO!)

```typescript
testimonials: {
  title: 'O Que Dizem Nossas Alunas',
  subtitle: 'Subtítulo opcional',
  testimonials: [
    // Depoimento em VÍDEO (YouTube/Shorts)
    {
      type: 'video',
      youtubeUrl: 'https://youtube.com/shorts/VIDEO_ID',
      // ou: 'https://www.youtube.com/watch?v=VIDEO_ID'
      // ou apenas: 'VIDEO_ID'
      name: 'Nome da Pessoa',      // opcional
      role: 'Profissão/Cargo',     // opcional
    },
    
    // Depoimento em TEXTO
    {
      type: 'text',
      quote: 'O texto completo do depoimento aqui.',
      name: 'Nome da Pessoa',
      role: 'Profissão/Cargo',     // opcional
      avatarUrl: '/caminho/foto.jpg',  // opcional
    },
  ],
},
```

#### Formatos de URL suportados para vídeos:

- `https://youtube.com/shorts/ABC123`
- `https://www.youtube.com/watch?v=ABC123`
- `https://youtu.be/ABC123`
- `https://youtube.com/embed/ABC123`
- `ABC123` (apenas o ID)

---

## Adicionando Elementos Especiais

### Frases de Destaque em Listas

Para adicionar uma frase de destaque em uma lista, use emojis ou caracteres especiais:

```typescript
painPoints: [
  { text: 'Problema 1' },
  { text: 'Problema 2' },
  { text: '👉 Se você se identificou, esse método é para você!' },
],
```

### Textos de Fechamento

Várias seções suportam textos de fechamento para frases de impacto:

```typescript
// Em painPoints
closingText: 'O problema não é você.',
closingHighlight: 'É a falta de método.',

// Em method
closingText: 'Marketing não é só postar. É estratégia.',

// Em targetAudience e transformation
ctaPrimary: 'Frase de chamada para ação.',
```

### Criando Novos Elementos/Seções

Se precisar de uma seção totalmente nova:

1. **Crie o componente** em `src/components/landing-page/`:

```typescript
// LPNovaSecao.tsx
interface NovaSecaoContent {
  title: string;
  items: string[];
}

export function LPNovaSecao({ content }: { content: NovaSecaoContent }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          {content.title}
        </h2>
        <ul>
          {content.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

2. **Adicione ao index.ts**:

```typescript
export { LPNovaSecao } from './LPNovaSecao';
```

3. **Adicione o tipo** em `src/types/landing-page.ts`:

```typescript
export interface NovaSecaoContent {
  title: string;
  items: string[];
}

// E adicione ao LandingPageContent
export interface LandingPageContent {
  // ...outras seções
  novaSecao?: NovaSecaoContent;
}
```

4. **Adicione o conteúdo** no arquivo de dados:

```typescript
novaSecao: {
  title: 'Título',
  items: ['Item 1', 'Item 2'],
},
```

5. **Use na página**:

```typescript
{content.novaSecao && (
  <LPNovaSecao content={content.novaSecao} />
)}
```

---

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

5. **Adicionar à tabela landing_pages** (para aparecer no slider da home):
   - Acesse o banco de dados
   - Insira registro na tabela `landing_pages`

---

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

---

## Classes CSS Úteis

Para customizações dentro dos textos, você pode usar HTML em alguns campos:

```typescript
// Em descrições que suportam JSX
description: 'Texto normal e <strong>texto em negrito</strong>',
```

**Cores do tema disponíveis**:
- `text-primary` - Cor principal
- `text-muted-foreground` - Texto secundário
- `bg-primary` - Fundo principal
- `bg-accent` - Fundo de destaque

---

## Checklist para Nova LP

- [ ] Arquivo de dados criado em `src/data/products/`
- [ ] Página criada em `src/pages/`
- [ ] Rota adicionada em `App.tsx`
- [ ] Registro inserido em `landing_pages` (se quiser aparecer no slider)
- [ ] Meta tags SEO configuradas
- [ ] Preço correto configurado
- [ ] Depoimentos adicionados (opcional)
- [ ] Testado checkout completo
