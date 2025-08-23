# Configuração de Assets e Imagens

## Logos do Projeto

### Imagens Fornecidas

As seguintes imagens foram fornecidas para o projeto:
1. **Logo Horizontal** - Logo com texto lateral
2. **Logo Circular** - Apenas o símbolo circular  
3. **Logo Vertical** - Logo com texto embaixo

### Localização Recomendada

As imagens devem ser colocadas em:
```
src/assets/
├── logo-horizontal.png
├── logo-circular.png
└── logo-vertical.png
```

### Implementação Atual

Foi criado o componente `LogoComponent` em `src/components/layout/LogoComponent.tsx` que:
- Atualmente usa um logo temporário em CSS/HTML
- Está preparado para receber as imagens reais
- Suporta diferentes variantes e tamanhos

### Como Atualizar

1. **Adicionar as imagens** ao diretório `src/assets/`
2. **Importar as imagens** no componente LogoComponent:
   ```typescript
   import logoHorizontal from '@/assets/logo-horizontal.png';
   import logoCircular from '@/assets/logo-circular.png';
   import logoVertical from '@/assets/logo-vertical.png';
   ```
3. **Substituir o conteúdo temporário** por elementos `<img>`

### Upload para Supabase Storage

Para usar as imagens via Supabase Storage:
1. Criar bucket público para assets
2. Fazer upload das imagens
3. Usar URLs do Supabase no componente

## Status Atual

✅ Componente LogoComponent criado  
✅ Header atualizado para usar o componente  
⏳ Imagens precisam ser adicionadas manualmente  
⏳ URLs das imagens precisam ser configuradas  

## Próximos Passos

1. Adicionar as 3 imagens de logo ao projeto
2. Atualizar o componente LogoComponent para usar as imagens reais
3. Testar em diferentes tamanhos e dispositivos