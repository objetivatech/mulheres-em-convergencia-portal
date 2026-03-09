# Descrições de Eventos com HTML

## Visão Geral

Os eventos agora suportam descrições formatadas em HTML, permitindo uma apresentação mais rica e profissional nas páginas de eventos.

## Implementação

### Editor (Admin)

**Arquivo:** `src/components/admin/crm/EventsManagement.tsx`

O campo de descrição utiliza o editor TinyMCE ao invés de Textarea:

```tsx
<TinyMCESelfHosted
  value={formData.description}
  onChange={(value) => setFormData({ ...formData, description: value })}
  height={250}
  placeholder="Descrição detalhada do evento..."
/>
```

### Exibição (Frontend)

**Arquivo:** `src/pages/EventDetailPage.tsx`

A descrição é renderizada com sanitização DOMPurify:

```tsx
<div 
  className="prose prose-sm max-w-none text-muted-foreground"
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(event.description || '') 
  }}
/>
```

## Recursos do Editor

O TinyMCE oferece:
- Títulos (H2, H3, H4)
- Negrito, itálico, sublinhado
- Listas ordenadas e não-ordenadas
- Links
- Alinhamento de texto
- Citações (blockquote)

## Segurança

- DOMPurify sanitiza todo HTML antes da renderização
- Scripts maliciosos são removidos automaticamente
- Apenas tags HTML seguras são permitidas

## Compatibilidade

A mesma biblioteca TinyMCE é usada no:
- Editor de Blog (`BlogEditor.tsx`)
- Descrições de Eventos (`EventsManagement.tsx`)

Isso garante consistência na experiência de edição.

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `EventsManagement.tsx` | TinyMCE no campo descrição |
| `EventDetailPage.tsx` | Renderização HTML com DOMPurify |
