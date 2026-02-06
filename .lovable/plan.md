
# Upgrade do Perfil de Negócios - Plano de Implementação

## Visão Geral

Este upgrade trará funcionalidades inspiradas no template Brikk para enriquecer o perfil das empresas no diretório, com foco em UX responsiva e correção do sistema de mapa.

## Resumo das Implementações

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| Horários de Funcionamento | Cadastro de dias/horários de atendimento | Alta |
| Facilidades/Amenidades | Lista de recursos oferecidos pelo negócio | Média |
| Cardápio/Catálogo | Produtos e serviços com preços | Alta |
| Correção do Mapa | Geocodificação por endereço completo | Alta |
| Atualização de Documentação | Refletir alterações recentes | Alta |

---

## FASE 1: Banco de Dados

### 1.1 Nova Tabela `business_amenities`
```sql
CREATE TABLE business_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT, -- nome do ícone (lucide)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, name)
);
```

### 1.2 Nova Tabela `business_menu_categories`
```sql
CREATE TABLE business_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Nova Tabela `business_menu_items`
```sql
CREATE TABLE business_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES business_menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  is_highlighted BOOLEAN DEFAULT false,
  highlight_label TEXT, -- "Novo", "Mais vendido", etc.
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Políticas RLS
- Leitura pública para amenidades e itens de menu
- Apenas donos podem criar/editar/excluir seus próprios dados

---

## FASE 2: Componentes de Cadastro (Dashboard)

### 2.1 Componente `OpeningHoursEditor`
**Localização:** `src/components/business/OpeningHoursEditor.tsx`

**Características:**
- Interface para cada dia da semana (Segunda a Domingo)
- Toggle para "Fechado" em cada dia
- Campos de horário de abertura e fechamento
- Suporte a múltiplos períodos por dia (ex: 09:00-12:00, 14:00-18:00)
- Botão "Copiar para outros dias" para facilitar preenchimento
- Layout responsivo com grid adaptável

**Estrutura JSON resultante:**
```json
{
  "monday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "tuesday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  ...
  "sunday": { "open": false, "periods": [] }
}
```

### 2.2 Componente `AmenitiesEditor`
**Localização:** `src/components/business/AmenitiesEditor.tsx`

**Características:**
- Lista de facilidades pré-definidas com ícones (seleção por checkbox)
- Possibilidade de adicionar facilidades customizadas
- Categorias: Pagamentos, Acessibilidade, Estacionamento, Pets, etc.
- Interface em grid responsivo

**Facilidades sugeridas:**
- Aceita Cartão de Crédito/Débito
- Aceita PIX
- Wi-Fi Gratuito
- Estacionamento
- Acessível para Cadeirantes
- Ar Condicionado
- Aceita Pets
- Delivery
- Reservas Online
- Agendamento Online

### 2.3 Componente `MenuEditor`
**Localização:** `src/components/business/MenuEditor.tsx`

**Características:**
- Gerenciador de categorias (abas ou accordion)
- Formulário para adicionar/editar itens
- Upload de imagem do item
- Campo de preço com formatação brasileira
- Tags de destaque ("Novo", "Mais vendido", "Promoção")
- Drag-and-drop para reordenar itens
- Layout responsivo com cards

---

## FASE 3: Exibição Pública (Perfil do Negócio)

### 3.1 Componente `BusinessOpeningHours`
**Localização:** `src/components/business/BusinessOpeningHours.tsx`

**Características:**
- Exibição compacta dos horários
- Indicador visual "Aberto agora" ou "Fechado"
- Dia atual destacado
- Ícone de relógio

### 3.2 Componente `BusinessAmenities`
**Localização:** `src/components/business/BusinessAmenities.tsx`

**Características:**
- Grid de ícones com labels
- Layout semelhante ao template Brikk (2 colunas)
- Ícones coloridos para facilidades ativas

### 3.3 Componente `BusinessMenu`
**Localização:** `src/components/business/BusinessMenu.tsx`

**Características:**
- Abas para categorias (como no Brikk: Entradas, Pratos, Sobremesas)
- Cards de itens com imagem, nome, descrição e preço
- Tags de destaque visuais
- Layout responsivo

---

## FASE 4: Correção do Sistema de Mapa

### 4.1 Problema Atual
O sistema atual usa apenas cidade/estado para geocodificação:
```typescript
const geocoded = await geocodeLocation(data.city, data.state);
```

Isso resulta em coordenadas genéricas do centro da cidade, não refletindo o endereço real do negócio.

### 4.2 Solução

#### 4.2.1 Atualizar `useGeocoding.ts`
Adicionar função `geocodeFullAddress` que usa o endereço completo:
```typescript
const geocodeFullAddress = async (
  address: string, 
  city: string, 
  state: string, 
  postalCode?: string
): Promise<GeocodingResult | null> => {
  const query = `${address}, ${city}, ${state}${postalCode ? `, ${postalCode}` : ''}, Brazil`;
  // ... chamada API Nominatim
}
```

#### 4.2.2 Atualizar `DashboardEmpresa.tsx`
Chamar geocodificação com endereço completo ao salvar:
```typescript
const geocoded = await geocodeFullAddress(
  data.address, 
  data.city, 
  data.state, 
  data.postal_code
);
```

#### 4.2.3 Adicionar botão "Atualizar Localização"
No dashboard, permitir que o dono do negócio force a re-geocodificação.

#### 4.2.4 Melhorar feedback visual
- Mostrar preview do mapa no dashboard durante edição
- Permitir ajuste manual do marcador (arrastar)

---

## FASE 5: Atualização do Dashboard da Empresa

### 5.1 Nova Aba "Horários e Facilidades"
Adicionar nova aba ao `DashboardEmpresa.tsx`:
- Horários de Funcionamento
- Facilidades oferecidas

### 5.2 Nova Aba "Cardápio/Catálogo"
Adicionar nova aba ao `DashboardEmpresa.tsx`:
- Gerenciador de categorias
- Lista de produtos/serviços

### 5.3 Melhorias de UX Responsiva
- TabsList com scroll horizontal em mobile
- Cards empilhados em telas pequenas
- Formulários em coluna única em mobile
- Botões de ação acessíveis (tamanho mínimo 44x44px)

---

## FASE 6: Atualização da Página Pública

### 6.1 Reorganização do Layout `DiretorioEmpresa.tsx`

**Sidebar (direita):**
1. Horários de Funcionamento (com indicador "Aberto agora")
2. Contatos
3. Endereço
4. Mapa
5. Estatísticas

**Conteúdo Principal (esquerda):**
1. Header com logo, nome, badges
2. Descrição
3. Facilidades (grid de ícones)
4. Cardápio/Catálogo (se houver)
5. Galeria
6. Formulário de contato
7. Avaliações

---

## FASE 7: Atualização da Documentação

### 7.1 Arquivos a Atualizar
- `docs/_active/05-negocios/diretorio-associadas.md` - Adicionar FASE 6
- Criar novo arquivo `docs/_active/05-negocios/perfil-negocios-upgrade.md`

### 7.2 Conteúdo da Nova Documentação
- Descrição das novas funcionalidades
- Estrutura do banco de dados
- Componentes criados
- Instruções de uso para o dono do negócio
- Screenshots/mockups

### 7.3 Registrar Alterações Recentes
Documentar as remoções feitas:
- Remoção da integração Ayrshare/Redes Sociais
- Correções no slider de parceiros
- Sincronização de reviews nos cards da home

---

## Estrutura de Arquivos (Novos)

```
src/
├── components/business/
│   ├── OpeningHoursEditor.tsx    # Cadastro horários
│   ├── OpeningHoursDisplay.tsx   # Exibição horários
│   ├── AmenitiesEditor.tsx       # Cadastro facilidades
│   ├── AmenitiesDisplay.tsx      # Exibição facilidades
│   ├── MenuEditor.tsx            # Cadastro cardápio
│   ├── MenuDisplay.tsx           # Exibição cardápio
│   └── LocationEditor.tsx        # Editor de localização
├── hooks/
│   ├── useBusinessAmenities.ts   # Hook para facilidades
│   └── useBusinessMenu.ts        # Hook para cardápio
└── pages/
    └── DashboardEmpresa.tsx      # Atualizado com novas abas

supabase/migrations/
└── XXXXXX_business_profile_upgrade.sql

docs/_active/05-negocios/
├── diretorio-associadas.md       # Atualizado
└── perfil-negocios-upgrade.md    # Novo
```

---

## Cronograma Sugerido

| Etapa | Descrição | Estimativa |
|-------|-----------|------------|
| 1 | Migração do banco de dados | 1 iteração |
| 2 | Componentes de cadastro (horários, facilidades) | 1-2 iterações |
| 3 | Componente de cardápio/catálogo | 1 iteração |
| 4 | Correção do mapa/geocodificação | 1 iteração |
| 5 | Atualização da página pública | 1 iteração |
| 6 | Documentação | 1 iteração |

---

## Detalhes Técnicos

### Dependências Existentes Utilizadas
- `@dnd-kit` - Para drag-and-drop no cardápio
- `react-hook-form` + `zod` - Validação de formulários
- `lucide-react` - Ícones para facilidades
- `Nominatim API` - Geocodificação gratuita

### Considerações de Performance
- Lazy loading de imagens do cardápio
- Cache de geocodificação para evitar chamadas repetidas
- Paginação de itens do cardápio se necessário

### Considerações de Acessibilidade
- Labels em todos os campos
- Contraste adequado
- Navegação por teclado nos editores
- Aria-labels descritivos
