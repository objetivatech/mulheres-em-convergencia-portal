# Preview no Editor de Blog

## Visão Geral

O editor de blog agora possui um botão de pré-visualização que permite aos autores verem exatamente como o post ficará antes de publicar.

## Funcionalidade

### Botão de Preview

Localizado na barra de ações do editor, ao lado de "Salvar Rascunho":

```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => setShowPreview(true)}
>
  <Eye className="w-4 h-4 mr-2" />
  Pré-visualizar
</Button>
```

### Dialog de Preview

Modal fullscreen (max-w-4xl) que exibe:

1. **Imagem Destacada** - Se configurada
2. **Badge de Categoria** - Se selecionada
3. **Título** - Com fonte Nexa
4. **Resumo** - Em itálico
5. **Conteúdo** - Com classes `prose` idênticas ao Post publicado
6. **Tags** - Se selecionadas

## Estilização

O preview usa as mesmas classes CSS do componente Post.tsx:

```tsx
<article 
  className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-nexa prose-a:text-primary"
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(content) 
  }}
/>
```

Isso garante que o autor veja exatamente como ficará o post publicado.

## Layout do Preview

```text
┌─────────────────────────────────────────────────┐
│  Pré-visualização do Post                  [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │           Imagem Destacada              │   │
│  │            (aspect-video)               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Categoria]                                    │
│                                                 │
│  Título do Post                                 │
│                                                 │
│  Resumo em itálico...                          │
│                                                 │
│  Conteúdo formatado do post com todos os       │
│  estilos aplicados corretamente, incluindo     │
│  títulos, listas, links e formatação...        │
│                                                 │
│  ─────────────────────────────────────────     │
│  [tag1] [tag2] [tag3]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Fluxo do Autor

1. Escreve o conteúdo no editor
2. Clica em "Pré-visualizar"
3. Revisa a formatação no modal
4. Fecha o modal e ajusta se necessário
5. Publica quando satisfeito

## Arquivo Modificado

`src/pages/BlogEditor.tsx`:
- Adicionado estado `showPreview`
- Adicionado botão de preview
- Adicionado Dialog com conteúdo formatado
