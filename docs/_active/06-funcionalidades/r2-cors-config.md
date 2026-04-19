# Configuração de CORS no Cloudflare R2

Para permitir uploads diretos do navegador para o R2 (necessário para arquivos
maiores que 10 MB no MeC Academy), o bucket R2 precisa ter CORS configurado.

## Como aplicar (uma única vez)

1. Acesse o painel da Cloudflare → **R2** → selecione o bucket usado pelo portal.
2. Aba **Settings** → seção **CORS Policy** → **Add CORS policy**.
3. Cole o JSON abaixo:

```json
[
  {
    "AllowedOrigins": [
      "https://mulheresemconvergencia.com.br",
      "https://www.mulheresemconvergencia.com.br",
      "https://mulheresemconvergencia.lovable.app",
      "https://*.lovable.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Salve.

## Por que isso é necessário

Arquivos grandes (PDFs de cursos, vídeos, etc.) não passam pela Edge Function
`r2-storage` — a Edge Function apenas **assina** uma URL temporária (válida por
10 minutos) e o navegador faz `PUT` direto no R2. Sem CORS configurado, o
navegador bloqueia esse `PUT`.

## Limites por pasta

| Pasta | Tamanho máx. | Tipos permitidos |
|---|---|---|
| `academy-materials` | 200 MB | PDF, JPG, PNG, WebP |
| `ambassador-materials` | 10 MB | PDF, JPG, PNG, WebP |
| `blog-images`, `branding`, `partner-logos`, etc. | 50 MB | Qualquer |

## Fluxo técnico

- Arquivos **< 10 MB**: upload via Edge Function (multipart) — fluxo legado.
- Arquivos **> 10 MB**: edge assina URL `PUT` → navegador envia direto ao R2
  com barra de progresso. Sem limites de CPU/memória da Edge Function.
