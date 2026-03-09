
# Plano: 4 Melhorias no Portal

## 1. Seção de Embaixadoras na Homepage

**Localização:** Após `FeaturedPosts`, antes de `FinalCTA`

**Novo componente:** `src/components/home/AmbassadorsShowcase.tsx`
- Design inspirado em bloco de depoimentos/testemunhos
- Carrossel horizontal com até 6 embaixadoras
- Cada card simplificado: avatar circular + nome + localização (sem bio completa)
- Botão CTA "Conheça nossas Embaixadoras" → `/embaixadoras`
- Reutiliza `usePublicAmbassadors` hook existente

**Alteração:** `src/pages/Index.tsx` - adicionar componente na ordem correta

---

## 2. HTML no Campo de Descrição de Eventos

**Problema atual:** Descrição usa `<Textarea>` e renderiza como texto plano (`whitespace-pre-wrap`)

**Alterações:**

| Arquivo | Mudança |
|---------|---------|
| `EventsManagement.tsx` | Substituir `Textarea` por `TinyMCESelfHosted` no campo descrição |
| `EventDetailPage.tsx` | Renderizar com `dangerouslySetInnerHTML` + DOMPurify sanitização |
| `ConectaEncontros.tsx` | Mesmo tratamento para exibição de descrição (se aplicável) |

**Segurança:** DOMPurify já está instalado no projeto e usado em BlogEditor

---

## 3. Modal de Detalhes nos Itens do Cardápio

**Arquivo:** `src/components/business/MenuDisplay.tsx`

**Implementação:**
- Adicionar estado `selectedItem` para controlar modal
- Envolver `MenuItemCard` com `onClick` handler
- Criar Dialog/Sheet com:
  - Imagem em tamanho maior (se existir)
  - Nome do item com badge de destaque
  - Descrição completa (sem truncamento)
  - Preço destacado
  - Botão fechar

```text
┌─────────────────────────────────┐
│          [X]                    │
│   ┌─────────────────────┐      │
│   │    📷 Imagem        │      │
│   │    (300x200)        │      │
│   └─────────────────────┘      │
│   Nome do Produto [Novo]        │
│   ─────────────────────         │
│   Descrição completa do         │
│   produto ou serviço sem        │
│   limite de linhas...           │
│                                 │
│          R$ 99,90               │
└─────────────────────────────────┘
```

---

## 4. Preview no Editor do Blog

**Arquivo:** `src/pages/BlogEditor.tsx`

**Implementação:**
- Adicionar estado `showPreview` (boolean)
- Botão "Pré-visualizar" (ícone Eye) ao lado de "Salvar"
- Dialog/Sheet em fullscreen mostrando:
  - Título do post
  - Imagem destacada
  - Conteúdo renderizado com mesma classe `prose` do Post.tsx
  - Data e autor (se selecionado)

**Vantagem:** Autor vê exatamente como ficará o post antes de publicar

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/home/AmbassadorsShowcase.tsx` |
| Editar | `src/pages/Index.tsx` |
| Editar | `src/components/admin/crm/EventsManagement.tsx` |
| Editar | `src/pages/EventDetailPage.tsx` |
| Editar | `src/components/business/MenuDisplay.tsx` |
| Editar | `src/pages/BlogEditor.tsx` |
| Criar | `docs/_active/06-funcionalidades/homepage-ambassadors.md` |

---

## Sugestões Adicionais

1. **Animação no carrossel de embaixadoras:** Usar Embla Carousel (já instalado) para auto-scroll suave
2. **Contador de caracteres no TinyMCE de eventos:** Ajudar admin a não exceder limite visual
3. **Responsividade do modal de cardápio:** Usar Sheet (bottom drawer) em mobile para melhor UX
