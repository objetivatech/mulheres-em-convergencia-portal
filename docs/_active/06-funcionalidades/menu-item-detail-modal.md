# Modal de Detalhes do Item do Cardápio

## Visão Geral

Os itens do cardápio/catálogo de produtos agora podem ser clicados para exibir um modal com detalhes completos, permitindo que empreendedoras apresentem melhor seus produtos e serviços.

## Componentes

### MenuItemDetailModal

**Arquivo:** `src/components/business/MenuItemDetailModal.tsx`

Modal responsivo que exibe:
- Imagem em tamanho maior
- Nome do produto com badge de destaque
- Descrição completa (sem truncamento)
- Preço destacado

### Responsividade

- **Desktop:** Dialog centralizado
- **Mobile:** Sheet (bottom drawer) para melhor UX touch

```tsx
// Mobile usa Sheet
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom" className="h-[85vh]">
    ...
  </SheetContent>
</Sheet>

// Desktop usa Dialog
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-md">
    ...
  </DialogContent>
</Dialog>
```

## Layout do Modal

```text
┌─────────────────────────────────┐
│                          [X]    │
│   ┌─────────────────────┐      │
│   │                     │      │
│   │    📷 Imagem        │      │
│   │    (aspect 4:3)     │      │
│   │                     │      │
│   └─────────────────────┘      │
│                                 │
│   Nome do Produto [Badge]       │
│                                 │
│   Descrição completa do         │
│   produto ou serviço, sem       │
│   limite de linhas, exibindo    │
│   todo o conteúdo cadastrado... │
│                                 │
│   ─────────────────────         │
│            R$ 99,90             │
└─────────────────────────────────┘
```

## MenuDisplay Atualizado

**Arquivo:** `src/components/business/MenuDisplay.tsx`

Alterações:
- Card do item agora é um `<button>` clicável
- Estado `selectedItem` controla qual item está no modal
- Hover indica interatividade (border-primary/30)

```tsx
<button
  type="button"
  onClick={onClick}
  className="... hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
>
```

## Badges de Destaque

| Label | Cor |
|-------|-----|
| novo | Azul |
| popular | Laranja |
| promocao | Vermelho |
| destaque | Roxo |
| vegano | Verde |
| vegetariano | Verde-esmeralda |

## Arquivos

| Arquivo | Tipo |
|---------|------|
| `MenuItemDetailModal.tsx` | Novo |
| `MenuDisplay.tsx` | Modificado |
