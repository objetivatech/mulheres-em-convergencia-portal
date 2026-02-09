# Fase 8: FAQ e Materiais Promocionais

## Visão Geral

A Fase 8 implementa o sistema de suporte e materiais promocionais para as embaixadoras, incluindo FAQ gerenciável e kit completo de materiais para divulgação.

## Banco de Dados

### Tabela `ambassador_faq_items`

```sql
CREATE TABLE public.ambassador_faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Categorias pré-definidas:**
- `sobre`: Informações sobre o programa
- `indicacao`: Como fazer indicações
- `pagamento`: Pagamentos e comissões
- `rastreamento`: Acompanhamento de métricas
- `dicas`: Dicas de sucesso

**RLS Policies:**
- Admins: gerenciamento completo
- Embaixadoras: leitura de itens ativos

## Componentes Criados

### 1. `AmbassadorFAQ`
Exibe perguntas frequentes agrupadas por categoria, com accordion expansível.

**Localização:** `src/components/ambassador/AmbassadorFAQ.tsx`

**Funcionalidades:**
- Busca itens do banco de dados
- Agrupa por categoria
- Ordenação pré-definida
- Interface com Accordion

### 2. `AmbassadorMaterials`
Kit completo de materiais promocionais com abas para diferentes tipos de conteúdo.

**Localização:** `src/components/ambassador/AmbassadorMaterials.tsx`

**Abas disponíveis:**
1. **WhatsApp**: Templates de mensagens prontas
2. **Instagram**: Templates para Stories, Feed e Reels
3. **Banners**: Informações sobre tamanhos disponíveis (em desenvolvimento)
4. **QR Code**: Gerador de QR Code personalizado
5. **PDF**: Apresentação do programa (em desenvolvimento)

### 3. `AmbassadorQRCode`
Gerador de QR Code dinâmico com o link de indicação da embaixadora.

**Localização:** `src/components/ambassador/AmbassadorQRCode.tsx`

**Funcionalidades:**
- Geração automática via API externa
- Download em PNG com branding
- Código de referência incluso na imagem

## Integração no Dashboard

Nova aba "Ajuda" adicionada ao dashboard da embaixadora (`/painel/embaixadora`).

**Grid de abas atualizado:**
```
Visão Geral | Meus Links | Indicações | Pagamentos | Relatórios | Ajuda
```

## Templates de Mensagens

### WhatsApp
1. **Convite Simples**: Mensagem casual de convite
2. **Destacando Benefícios**: Lista de vantagens da comunidade
3. **História Pessoal**: Template para personalização com experiência

### Instagram
1. **Stories**: Texto curto com emojis e hashtags
2. **Post Feed**: Legenda completa com CTA
3. **Roteiro Reels**: Script estruturado (hook, desenvolvimento, CTA)

## FAQ Inicial Populado

12 perguntas distribuídas em 5 categorias:

| Categoria | Quantidade |
|-----------|------------|
| Sobre o Programa | 3 |
| Como Indicar | 3 |
| Pagamentos | 3 |
| Rastreamento | 2 |
| Dicas | 2 |

## Gestão via Admin

Para adicionar/editar FAQs, usar o Supabase Table Editor ou criar interface admin dedicada.

```sql
-- Exemplo: Adicionar nova pergunta
INSERT INTO ambassador_faq_items (question, answer, category, display_order) 
VALUES (
  'Nova pergunta aqui?',
  'Resposta detalhada aqui.',
  'sobre',
  10
);
```

## Próximos Passos (Melhorias Futuras)

1. **Interface admin** para gerenciar FAQs
2. **Banners personalizados** gerados dinamicamente
3. **PDF personalizado** com dados da embaixadora
4. **Analytics de materiais** (qual template mais copiado)
5. **Busca na FAQ** para facilitar navegação

## Arquivos Criados/Modificados

**Criados:**
- `src/components/ambassador/AmbassadorFAQ.tsx`
- `src/components/ambassador/AmbassadorMaterials.tsx`
- `src/components/ambassador/AmbassadorQRCode.tsx`

**Modificados:**
- `src/components/ambassador/index.ts` (exports)
- `src/pages/EmbaixadoraDashboard.tsx` (nova aba)

**Migração:**
- Criação da tabela `ambassador_faq_items`
- População inicial de FAQs
