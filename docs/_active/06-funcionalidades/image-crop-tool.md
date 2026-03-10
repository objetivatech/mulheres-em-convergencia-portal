# Ferramenta de Recorte de Imagem (Image Crop Tool)

## Visão Geral

Componente reutilizável `ImageCropUploader` que permite ao usuário recortar imagens antes do upload, garantindo dimensões corretas para cada contexto.

## Componente

**Arquivo:** `src/components/ui/ImageCropUploader.tsx`

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `value` | `string` | Não | URL da imagem atual |
| `onChange` | `(url: string \| null) => void` | Sim | Callback ao alterar imagem |
| `dimensions` | `ImageDimensions` | Sim | Largura e altura ideais |
| `folder` | `string` | Não | Pasta no R2 (default: 'uploads') |
| `label` | `string` | Não | Rótulo do campo |
| `previewHeight` | `string` | Não | Classe Tailwind de altura (default: 'h-48') |

### Presets de Dimensões

```typescript
IMAGE_PRESETS = {
  blogFeatured:    { width: 1200, height: 630  }, // 1.91:1
  ambassadorPhoto: { width: 400,  height: 400  }, // 1:1
  conectaBanner:   { width: 1200, height: 300  }, // 4:1
  conectaMeeting:  { width: 800,  height: 600  }, // 4:3
  businessLogo:    { width: 400,  height: 400  }, // 1:1
  businessCover:   { width: 1200, height: 675  }, // 16:9
  groupImage:      { width: 800,  height: 450  }, // 16:9
}
```

### Fluxo

1. Usuário seleciona ou arrasta uma imagem
2. Modal de recorte abre com aspect ratio fixo conforme `dimensions`
3. Usuário ajusta a área de recorte
4. Ao confirmar, a imagem é redimensionada para as dimensões exatas, convertida para WebP, e enviada ao R2
5. URL retornada via `onChange`

### Uso

```tsx
import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';

<ImageCropUploader
  value={bannerUrl}
  onChange={setBannerUrl}
  dimensions={IMAGE_PRESETS.conectaBanner}
  folder="conecta-banners"
  label="Banner do perfil"
/>
```

## Dependência

- `react-image-crop` — Biblioteca de recorte de imagem
- `react-dropzone` — Já existente no projeto para drag-and-drop
