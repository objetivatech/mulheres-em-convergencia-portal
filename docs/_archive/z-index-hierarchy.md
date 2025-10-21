# Hierarquia de Z-Index do Sistema

## 📚 Visão Geral

Este documento define a hierarquia oficial de `z-index` para todos os componentes do portal **Mulheres em Convergência**. O objetivo é prevenir conflitos de sobreposição e garantir uma experiência de usuário consistente.

---

## 🎯 Camadas Definidas

### Escala Oficial

| Camada | Z-Index | Componentes | Uso |
|--------|---------|-------------|-----|
| **Base** | `z-0` a `z-40` | Conteúdo normal, Cards, Imagens | Elementos padrão da página |
| **Navegação** | `z-[900]` | Mobile menu, Header sticky | Navegação principal |
| **Overlay** | `z-[1000]` | Dialog Overlay, Modal Backdrop | Fundo escurecido de modais |
| **Content** | `z-[1001]` | Dialog Content, Modal Content | Conteúdo de modais e dialogs |
| **Dropdowns** | `z-[1100]` | Select, DropdownMenu | Dropdowns dentro de modais |
| **Toasts** | `z-[9999]` | Toast notifications, Alerts | Notificações temporárias |

---

## 🔧 Componentes Específicos

### Dialog (Modais)

**Arquivo**: `src/components/ui/dialog.tsx`

```tsx
// DialogOverlay
className="fixed inset-0 z-[1000] bg-black/70 pointer-events-none ..."

// DialogContent
className="fixed z-[1001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ..."
```

**Razão**: 
- Overlay em `z-[1000]` cria fundo escuro
- Content em `z-[1001]` garante que aparece sobre o overlay
- `pointer-events-none` no overlay previne bloqueio de cliques

---

### Select (Dropdowns de Seleção)

**Arquivo**: `src/components/ui/select.tsx`

```tsx
// SelectContent
className="relative z-[1100] max-h-96 min-w-[8rem] ..."
```

**Razão**: 
- `z-[1100]` garante que dropdown aparece **sobre** Dialog Content
- Essencial para formulários dentro de modais funcionarem corretamente

---

### DropdownMenu

**Arquivo**: `src/components/ui/dropdown-menu.tsx`

```tsx
// DropdownMenuContent
className="z-[1100] min-w-[8rem] ..."

// DropdownMenuSubContent
className="z-[1100] min-w-[8rem] ..."
```

**Razão**: 
- Mesma lógica do Select: deve aparecer sobre modais
- Crítico para menus de ações dentro de dialogs

---

## ⚠️ Regras Críticas

### 🚫 NUNCA Faça

1. **Não use `z-50` ou valores arbitrários** em componentes que podem aparecer dentro de modais
2. **Não adicione `isolate`** no Dialog Content (cria novo stacking context)
3. **Não use `pointer-events-auto`** em overlays sem necessidade
4. **Não altere z-index de componentes base** sem revisar TODOS os usos

### ✅ SEMPRE Faça

1. **Consulte esta documentação** antes de alterar z-index
2. **Teste em modais** quando modificar dropdowns/selects
3. **Valide em mobile** após mudanças de z-index
4. **Documente exceções** com comentários no código

---

## 🧪 Cenários de Teste

### Checklist Obrigatório

Ao modificar z-index, valide:

- [ ] **Formulário de assinatura**: Selects de estado/cidade funcionam?
- [ ] **Formulário de endereço**: Dropdowns de tipo de endereço/contato?
- [ ] **Notificações de jornada**: Selects de estágio/tipo?
- [ ] **Mobile menu**: Não conflita com modais abertos?
- [ ] **Toasts**: Aparecem sobre tudo?

---

## 📋 Casos Comuns e Soluções

### Problema: Dropdown invisível dentro de modal

**Sintoma**: Select/DropdownMenu não aparece ao clicar

**Causa**: z-index do dropdown < z-index do DialogContent

**Solução**:
```tsx
// Antes (ERRADO)
className="z-50 ..."

// Depois (CORRETO)
className="z-[1100] ..."
```

---

### Problema: Overlay bloqueando cliques

**Sintoma**: Não consigo interagir com conteúdo do modal

**Causa**: `pointer-events-auto` ou z-index invertido

**Solução**:
```tsx
// DialogOverlay
className="... pointer-events-none" // Não bloqueia

// DialogContent  
// Radix já trata cliques corretamente, não precisa pointer-events-auto
```

---

### Problema: Modal não centralizado em mobile

**Sintoma**: Modal cortado ou desalinhado em iOS/Android

**Solução**:
```tsx
// Usar transform centralizado
className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"

// Evitar posicionamento condicional por breakpoint (md:left-1/2)
```

---

## 🛠️ Debugging

### Como identificar conflito de z-index

1. **Abra DevTools** (F12)
2. **Inspecione elemento** invisível/cortado
3. **Verifique z-index** no painel "Computed"
4. **Compare com hierarquia** desta documentação
5. **Ajuste conforme tabela** acima

### Console útil

```javascript
// Listar todos os z-index da página
document.querySelectorAll('*').forEach(el => {
  const z = window.getComputedStyle(el).zIndex;
  if (z !== 'auto') console.log(el, z);
});
```

---

## 📝 Histórico de Mudanças

### 2025-01-XX - Correção Crítica

**Problema**: Dropdowns não funcionavam em modais de assinatura

**Mudanças**:
- `select.tsx`: `z-50` → `z-[1100]`
- `dropdown-menu.tsx`: `z-50` → `z-[1100]` (Content e SubContent)
- `dialog.tsx`: Padronização de overlay/content

**Impacto**: ✅ Resolveu 3 problemas críticos reportados

---

## 🔗 Referências

- [MDN: CSS Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- [Tailwind Z-Index](https://tailwindcss.com/docs/z-index)
- [Radix UI Portal](https://www.radix-ui.com/primitives/docs/utilities/portal)

---

## 🎯 Conclusão

**Regra de Ouro**: 

> Sempre que modificar z-index de um componente de UI base (Dialog, Select, Dropdown), você DEVE:
> 1. Consultar esta documentação
> 2. Testar o formulário de assinatura
> 3. Validar em mobile (iOS + Android)
> 4. Documentar a mudança aqui

**Responsável**: Time de Frontend  
**Última Atualização**: Janeiro 2025  
**Status**: ✅ Ativo e Obrigatório
