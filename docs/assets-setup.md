
# Configuração de Assets e Imagens

## Logos do Projeto

### Imagens Fornecidas

As seguintes imagens foram fornecidas para o projeto:
1. **Logo Horizontal** - Logo com texto lateral
2. **Logo Circular** - Apenas o símbolo circular  
3. **Logo Vertical** - Logo com texto embaixo

### Localização

As imagens estão no repositório em:
```
src/assets/
├── logo-horizontal.png
├── logo-circular.png
└── logo-vertical.png
```

Também preparamos um bucket público no Supabase Storage para servir as mesmas imagens via CDN:
- Bucket: `branding`
- Paths esperados:
  - `logo-horizontal.png`
  - `logo-circular.png`
  - `logo-vertical.png`

### Implementação Atual

- O componente `LogoComponent` agora:
  - Tenta carregar a imagem do Supabase Storage (`branding/<arquivo>.png`)
  - Se a imagem não existir no Storage, faz fallback automático para o arquivo local em `src/assets`
  - Suporta variantes: `horizontal`, `circular`, `vertical`
  - Tamanhos: `sm`, `md`, `lg`

- Header e Footer usam o `LogoComponent`.
- O favicon é definido via Helmet e usa o `logo-circular.png`.

### Como publicar no Supabase Storage

1. Acesse o painel do Supabase: Storage > branding
2. Faça upload dos arquivos:
   - `logo-horizontal.png`
   - `logo-circular.png`
   - `logo-vertical.png`
3. Confirme que o bucket `branding` é público (já criado por migração).
4. Após o upload, o portal passará a usar automaticamente as versões do Storage.

### Teste

- Remova/renomeie temporariamente os arquivos do Storage para ver o fallback local funcionar.
- Recarregue a página e verifique o logo no Header, Footer e o favicon.

## Status Atual

✅ LogoComponent atualizado  
✅ Header e Footer usam os logos  
✅ Favicon configurado via Helmet  
✅ Bucket `branding` criado no Supabase  
⏳ Fazer upload dos arquivos no Storage (opcional)  

