# Upgrade do Perfil de Negócios

## Visão Geral

Este upgrade traz funcionalidades avançadas para enriquecer o perfil das empresas no diretório, inspiradas no template Brikk. As principais adições incluem:

1. **Horários de Funcionamento** - Cadastro detalhado de dias e horários de atendimento
2. **Facilidades/Amenidades** - Lista visual de recursos oferecidos pelo negócio
3. **Correção do Mapa** - Geocodificação por endereço completo para marcação precisa

---

## Novas Funcionalidades

### 1. Horários de Funcionamento

**Componente:** `OpeningHoursEditor.tsx`

**Características:**
- Interface para cada dia da semana (Segunda a Domingo)
- Toggle para "Aberto/Fechado" em cada dia
- Suporte a múltiplos períodos por dia (ex: 09:00-12:00, 14:00-18:00)
- Botões "Copiar para dias úteis" e "Copiar para todos os dias"
- Layout responsivo

**Estrutura de Dados (JSONB):**
```json
{
  "monday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "tuesday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "wednesday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "thursday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "friday": { "open": true, "periods": [{"start": "09:00", "end": "18:00"}] },
  "saturday": { "open": false, "periods": [] },
  "sunday": { "open": false, "periods": [] }
}
```

**Exibição Pública:** `OpeningHoursDisplay.tsx`
- Indicador visual "Aberto agora" ou "Fechado"
- Dia atual destacado
- Próxima mudança de status (ex: "Abre às 09:00")

---

### 2. Facilidades/Amenidades

**Componente:** `AmenitiesEditor.tsx`

**Facilidades Pré-definidas (por categoria):**

| Categoria | Facilidades |
|-----------|-------------|
| Pagamentos | Cartão de Crédito, Cartão de Débito, PIX |
| Conectividade | Wi-Fi Gratuito |
| Estacionamento | Estacionamento Próprio, Gratuito, Bicicletário |
| Acessibilidade | Acessível para Cadeirantes, Fraldário |
| Conforto | Ar Condicionado, Área Externa, Área para Fumantes |
| Pets | Aceita Pets, Pet Friendly |
| Serviços | Delivery, Retirada no Local, Reservas Online, Agendamento Online |
| Segurança | Ambiente Seguro |

**Funcionalidades:**
- Seleção por checkbox com ícones visuais
- Possibilidade de adicionar facilidades customizadas
- Interface em grid responsivo

**Exibição Pública:** `AmenitiesDisplay.tsx`
- Grid de ícones com labels
- Versão inline disponível para badges

---

### 3. Correção do Sistema de Geocodificação

**Problema Anterior:**
O sistema usava apenas cidade/estado para geocodificação, resultando em coordenadas genéricas do centro da cidade.

**Solução Implementada:**
Nova função `geocodeFullAddress` no hook `useGeocoding.ts`:

```typescript
const geocodeFullAddress = async (
  address: string, 
  city: string, 
  state: string, 
  postalCode?: string
): Promise<GeocodingResult | null>
```

**Benefícios:**
- Marcação precisa no mapa baseada no endereço completo
- Fallback automático para cidade/estado se endereço não for encontrado
- Cache em memória para evitar chamadas repetidas à API

---

## Estrutura do Banco de Dados

### Tabela `business_amenities`

```sql
CREATE TABLE business_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT, -- nome do ícone (lucide-react)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, name)
);
```

### Tabela `business_menu_categories`

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

### Tabela `business_menu_items`

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
  highlight_label TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Políticas RLS

Todas as tabelas possuem:
- **Leitura pública** para itens ativos
- **Gerenciamento pelo dono** (INSERT, UPDATE, DELETE)
- **Gerenciamento por admins**

---

## Componentes Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/business/OpeningHoursEditor.tsx` | Editor de horários no dashboard |
| `src/components/business/OpeningHoursDisplay.tsx` | Exibição pública de horários |
| `src/components/business/AmenitiesEditor.tsx` | Editor de facilidades no dashboard |
| `src/components/business/AmenitiesDisplay.tsx` | Exibição pública de facilidades |

---

## Alterações no Dashboard

**Nova aba "Horários" no `DashboardEmpresa.tsx`:**
- Editor de horários de funcionamento
- Editor de facilidades/amenidades
- Botão único para salvar todas as configurações

**Melhorias de UX Responsiva:**
- TabsList com scroll horizontal em mobile
- Formulários adaptáveis para telas pequenas
- Ícones e labels otimizados para mobile

---

## Uso pelo Dono do Negócio

### Configurar Horários:
1. Acesse o Dashboard da Empresa
2. Clique na aba "Horários"
3. Para cada dia da semana:
   - Ative/desative usando o switch
   - Defina horários de abertura e fechamento
   - Adicione múltiplos períodos se necessário (ex: manhã e tarde)
4. Use "Copiar para dias úteis" para agilizar
5. Clique em "Salvar Horários e Facilidades"

### Adicionar Facilidades:
1. Na mesma aba "Horários"
2. Role até "Facilidades Oferecidas"
3. Marque as opções desejadas
4. Adicione facilidades personalizadas se necessário
5. Clique em "Salvar Horários e Facilidades"

---

## Dependências Utilizadas

- `lucide-react` - Ícones para facilidades
- `@radix-ui/react-switch` - Toggle para dias abertos/fechados
- `@radix-ui/react-checkbox` - Seleção de facilidades
- `Nominatim API` - Geocodificação gratuita (OpenStreetMap)

---

## Considerações Técnicas

### Performance
- Cache de geocodificação em memória
- Lazy loading de componentes pesados
- Otimização de re-renders com estados locais

### Acessibilidade
- Labels em todos os campos
- Aria-labels descritivos
- Navegação por teclado funcional
- Contraste adequado de cores

### Responsividade
- Mobile-first design
- Breakpoints em sm (640px) e md (768px)
- Touch targets mínimos de 44x44px

---

*Documentação criada em: Fevereiro 2026*
*Versão: 1.0*
