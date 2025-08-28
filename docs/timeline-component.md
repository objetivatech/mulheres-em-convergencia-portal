# Componente Timeline Interativo

## Visão Geral

O componente `Timeline` foi implementado na página "Sobre" para mostrar de forma interativa e envolvente a jornada histórica do projeto Mulheres em Convergência.

## Características Principais

### 🎯 Funcionalidades
- **Slider Responsivo**: Exibe diferentes números de itens baseado no tamanho da tela
  - Mobile: 1 item por vez
  - Tablet: 2 itens por vez  
  - Desktop: 3 itens por vez
- **Lightbox**: Clique nas imagens para visualizá-las em tamanho ampliado
- **Navegação**: Botões de navegação e indicadores de posição
- **Transições Suaves**: Animações CSS elegantes em todos os elementos
- **Barra de Progresso**: Indicador visual do progresso na timeline

### 🎨 Design System
- Utiliza tokens semânticos do design system (primary, secondary, tertiary)
- Gradientes com as cores da marca (#C75A92, #9191C0, #ADBBDD)
- Componentes shadcn/ui para consistência visual
- Responsivo e acessível (WCAG 2.1 AA)

### 📱 Responsividade
- Layout adaptativo para mobile, tablet e desktop
- Imagens otimizadas com lazy loading
- Transições touch-friendly em dispositivos móveis

## Estrutura dos Dados

### TimelineItem Interface
```typescript
interface TimelineItem {
  id: string;          // Identificador único
  date: string;        // Data do evento (ex: "Maio 2015")
  title: string;       // Título do marco histórico
  description: string; // Descrição detalhada
  image: string;       // Caminho para a imagem
}
```

### Marcos Históricos Incluídos
1. **APAE Gravataí** (Maio 2015)
2. **Aulas de Artesanato** (Setembro 2015)
3. **Multifeira** (2015-2017)
4. **Ação FGTAS** (Março 2017)
5. **Ação ACESSUAS** (Abril 2018)
6. **Portal da Vida** (Março-Dezembro 2019)
7. **Motiva Artesão IFRS** (Agosto-Outubro 2019)
8. **Ela Pode - Palestras** (Durante 2019)
9. **Eventos Online** (Durante 2020)
10. **Podcast Convergência Feminina** (2020-2021)
11. **Economia Solidária Alvorada** (2021-2023)
12. **Nasce o Mulheres em Convergência** (Fevereiro 2022)
13. **Acelera Empreendedora Presencial** (Maio 2022)
14. **Palestra Centro Adelino Borba** (Outubro 2023)

## Implementação Técnica

### Localização dos Arquivos
```
src/
├── components/
│   └── timeline/
│       └── Timeline.tsx          # Componente principal
├── pages/
│   └── Sobre.tsx                 # Página integrada
└── assets/timeline/              # Imagens da timeline
```

### Dependências Utilizadas
- **React Hooks**: useState, useRef, useEffect
- **Lucide React**: Ícones (ChevronLeft, ChevronRight, X, Calendar)
- **shadcn/ui**: Button, Card, Dialog components
- **Tailwind CSS**: Estilização e responsividade

### Exemplo de Uso
```jsx
import { Timeline } from '@/components/timeline/Timeline';

// Na página Sobre
<Timeline />
```

## Estados e Interações

### Estados do Componente
- `currentIndex`: Posição atual do slider
- `selectedImage`: Imagem selecionada para o lightbox
- `itemsToShow`: Número de itens visíveis (responsivo)

### Interações Disponíveis
- **Navegação**: Botões anterior/próximo
- **Indicadores**: Clique nos dots para ir para posição específica
- **Lightbox**: Clique na imagem para ampliar
- **Responsivo**: Ajuste automático baseado no tamanho da tela

## Melhorias Futuras

### Possíveis Evoluções
1. **Lazy Loading**: Carregar imagens sob demanda
2. **Swipe Gestures**: Suporte a gestos de arrastar em mobile
3. **Filtros**: Filtrar por período ou categoria
4. **Zoom**: Funcionalidade de zoom nas imagens do lightbox
5. **Compartilhamento**: Botões para compartilhar marcos específicos
6. **Animações**: Scroll-triggered animations com Intersection Observer

### Acessibilidade
- Suporte completo a navegação por teclado
- Descrições alt adequadas nas imagens
- Roles ARIA apropriados
- Contraste de cores adequado (WCAG 2.1 AA)

## Manutenção

### Para Adicionar Novos Marcos
1. Adicione a nova entrada no array `timelineData`
2. Inclua a imagem correspondente em `public/assets/timeline/`
3. Siga o padrão de nomenclatura existente
4. Teste em diferentes tamanhos de tela

### Para Modificar Estilos
- Utilize tokens do design system sempre que possível
- Mantenha consistência com componentes shadcn/ui
- Teste responsividade em todos os breakpoints

---

**Data de Implementação**: Janeiro 2025  
**Versão**: 1.0  
**Status**: ✅ Implementado e Funcional