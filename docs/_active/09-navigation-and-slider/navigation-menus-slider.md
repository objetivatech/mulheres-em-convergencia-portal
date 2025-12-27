# Navegação, Menus e Slider Dinâmico

## Visão Geral

Este documento descreve as funcionalidades de gerenciamento de navegação e o slider dinâmico de eventos/LPs na página inicial.

---

## 1. Gerenciador de Navegação (NavigationManager)

### Localização
- **Componente**: `src/components/admin/NavigationManager.tsx`
- **Acesso**: Admin > Configuração do Site > Navegação e Menus

### Funcionalidades

#### 1.1 Suporte a Submenus
- Itens do menu principal podem ter **submenus** (itens filhos)
- Use o botão 📁 (FolderPlus) ao lado de cada item para adicionar submenus
- Submenus aparecem indentados e com borda tracejada

#### 1.2 Menus Editáveis

| Chave | Descrição |
|-------|-----------|
| `main_navigation` | Menu principal no cabeçalho |
| `footer_navigation` | Links de navegação no rodapé |
| `footer_legal` | Links jurídicos (termos, privacidade, cookies) |

#### 1.3 Recursos
- **Drag & Drop**: Reordenar itens arrastando
- **Ativar/Desativar**: Toggle para cada item
- **Edição inline**: Label e URL editáveis diretamente

### Tabela no Banco
```sql
-- Estrutura: navigation_menus
id, menu_key, menu_name, menu_items (JSONB), active
```

---

## 2. Footer Dinâmico

### Hook
- **Arquivo**: `src/hooks/useFooterNavigation.ts`
- Carrega `footer_navigation` e `footer_legal` automaticamente
- Fallbacks incluídos caso não haja dados

### Componente
- **Arquivo**: `src/components/layout/Footer.tsx`
- Usa o hook `useFooterNavigation` para links dinâmicos

---

## 3. Slider de Eventos e LPs

### Componentes
- **Slider**: `src/components/home/EventsAndLPsSlider.tsx`
- **Hook**: `src/hooks/useEventsAndLPs.ts`

### Comportamento Dinâmico
1. Busca **eventos publicados** com `date_start >= hoje`
2. Busca **landing pages ativas** da tabela `landing_pages`
3. Ordena: itens `featured` primeiro, depois por data

### Tabela: landing_pages
```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_id TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Adicionando uma Nova LP ao Slider
1. Crie a LP (página + dados)
2. Insira registro na tabela `landing_pages`:
```sql
INSERT INTO landing_pages (slug, title, description, active, featured)
VALUES ('minha-lp', 'Título da LP', 'Descrição curta', true, true);
```

---

## 4. Integração na Home

O slider foi adicionado à página inicial (`src/pages/Index.tsx`) logo após o Hero:

```tsx
<Hero />
<EventsAndLPsSlider />  {/* Novo slider dinâmico */}
<BusinessShowcase ... />
```

---

## 5. Considerações de Segurança

- **RLS**: `landing_pages` tem políticas para leitura pública (ativas) e gestão por admins
- Menus de navegação são públicos (não contêm dados sensíveis)

---

## Arquivos Relacionados

| Arquivo | Propósito |
|---------|-----------|
| `src/components/admin/NavigationManager.tsx` | Painel de gestão de menus |
| `src/hooks/useFooterNavigation.ts` | Hook para menus do rodapé |
| `src/hooks/useEventsAndLPs.ts` | Hook para dados do slider |
| `src/components/home/EventsAndLPsSlider.tsx` | Componente do slider |
| `src/components/layout/Footer.tsx` | Footer com menus dinâmicos |
| `src/pages/Index.tsx` | Página inicial com slider |
