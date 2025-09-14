# Editor Trumbowyg - Configuração e Correções

## Visão Geral

O Portal Mulheres em Convergência utiliza o **Trumbowyg** como editor rico para o blog, configurado com localização completa em português brasileiro.

## Correção do SVG Path

### Problema Identificado
```javascript
// Erro no console:
// "You must define svgPath: https://goo.gl/CfTY9U"
```

### Solução Implementada
```typescript
$editor.trumbowyg({
  lang: 'pt_br',
  svgPath: 'https://cdn.jsdelivr.net/npm/trumbowyg@2.31.0/dist/ui/icons.svg',
  // ... resto da configuração
});
```

## Configuração Completa

### Plugins Instalados
- ✅ **cleanpaste**: Limpeza automática de formatação
- ✅ **colors**: Cores de texto e fundo
- ✅ **emoji**: Suporte a emojis
- ✅ **fontfamily**: Seleção de fontes
- ✅ **fontsize**: Tamanhos de fonte
- ✅ **history**: Undo/Redo
- ✅ **table**: Tabelas completas

### Fontes Configuradas
```typescript
fontfamily: {
  fontList: [
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' }, // Fonte do portal
    { name: 'Quicksand', family: 'Quicksand, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    // ... outras fontes
  ]
}
```

### Tamanhos de Fonte
```typescript
fontsize: {
  sizeList: ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '60px']
}
```

## Toolbar Personalizada

### Botões Configurados
```typescript
btns: [
  ['viewHTML'],                    // Visualizar HTML
  ['undo', 'redo'],               // Histórico
  ['formatting'],                  // Formatação (H1, H2, etc.)
  ['fontfamily'],                 // Família da fonte
  ['fontsize'],                   // Tamanho da fonte
  ['foreColor', 'backColor'],     // Cores
  ['strong', 'em', 'del'],        // Negrito, itálico, riscado
  ['superscript', 'subscript'],   // Sobrescrito, subscrito
  ['link'],                       // Links
  ['insertImage'],                // Imagens
  ['emoji'],                      // Emojis
  ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'], // Alinhamento
  ['unorderedList', 'orderedList'], // Listas
  ['horizontalRule'],             // Linha horizontal
  ['removeformat'],               // Remover formatação
  ['table']                       // Tabelas
]
```

## Integração com Upload de Imagens

### Hook Personalizado
```typescript
const { uploadImage } = useImageUpload();
```

O editor está integrado com o sistema de upload de imagens do Supabase Storage, utilizando o bucket `blog-images`.

## Estilos Personalizados

### Design System Integration
```css
.trumbowyg-box {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
}

.trumbowyg-button-pane {
  background: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
}

.trumbowyg-editor {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Montserrat', system-ui, sans-serif;
  line-height: 1.6;
  padding: 1rem;
}
```

## Localização (PT-BR)

### Configuração de Idioma
```typescript
lang: 'pt_br'
```

### Arquivo de Tradução
```typescript
await import('trumbowyg/dist/langs/pt_br.min.js');
```

## Fallback para Falhas

### Sistema de Segurança
Se o Trumbowyg falhar ao carregar, o editor automaticamente gera um `<textarea>` simples como fallback:

```typescript
// Fallback to simple textarea
if (editorRef.current) {
  editorRef.current.innerHTML = `<textarea 
    style="width: 100%; min-height: ${height}px; padding: 1rem; border: 1px solid hsl(var(--border)); border-radius: 8px;" 
    placeholder="${placeholder}">${value}</textarea>`;
}
```

## Cleanup e Performance

### Destruição Limpa
```typescript
return () => {
  if (editorRef.current && typeof window !== 'undefined' && (window as any).$) {
    try {
      const $editor = (window as any).$(editorRef.current) as any;
      if ($editor.data && $editor.data('trumbowyg')) {
        $editor.trumbowyg('destroy');
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};
```

## Arquivos Envolvidos

- `src/components/blog/TrumbowygEditor.tsx` - Componente principal
- `src/pages/BlogEditor.tsx` - Página que usa o editor
- `src/hooks/useImageUpload.ts` - Upload de imagens

## Dependências

```json
{
  "trumbowyg": "^2.31.0",
  "react-trumbowyg": "^1.1.0",
  "jquery": "^3.7.1",
  "@types/jquery": "^3.5.29"
}
```

---

**Resultado**: Editor rico totalmente funcional, com todos os ícones carregando corretamente e integração completa com o sistema de blog do portal.