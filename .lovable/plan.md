
# Migracao de Storage: Supabase para Cloudflare R2

## Contexto

O projeto usa 4 buckets no Supabase Storage:
- **blog-images**: imagens dos posts do blog (maior volume esperado)
- **branding**: logos do portal (3 arquivos)
- **ambassador-materials**: materiais das embaixadoras (banners, PDFs, fotos)
- **partner-logos**: logos de parceiros do diretorio

A migracao mantera o Supabase para DB, Auth e Edge Functions. O Cloudflare R2 assumira todo o armazenamento de arquivos.

---

## Estrategia: Edge Function como Proxy de Upload

A abordagem mais simples e funcional e criar uma **unica Edge Function** (`r2-storage`) que faz o papel de proxy para o R2, usando a API S3-compativel do Cloudflare. Toda a logica de upload/delete fica centralizada nessa funcao.

No lado do frontend, criamos um **unico hook** (`useR2Storage`) que substitui as chamadas ao `supabase.storage` por chamadas a essa Edge Function. Os demais hooks (`useImageUpload`, `useAmbassadorMaterials`, etc.) passam a usar o novo hook.

```text
+------------------+       +---------------------+       +----------------+
|   Frontend       | ----> |  Edge Function      | ----> |  Cloudflare R2 |
|   useR2Storage   |       |  r2-storage         |       |  (S3 API)      |
+------------------+       +---------------------+       +----------------+
```

---

## Requisitos do Cloudflare R2

O usuario precisara configurar no painel do Cloudflare:

1. **Criar um bucket R2** (ex: `mulheres-convergencia-storage`)
2. **Gerar credenciais de API R2** (Access Key ID + Secret Access Key) em R2 > Manage R2 API Tokens
3. **Habilitar acesso publico** no bucket (R2 > bucket > Settings > Public Access) para que as URLs das imagens sejam acessiveis sem autenticacao
4. **Anotar o Account ID** do Cloudflare e o **endpoint S3** (formato: `https://<account-id>.r2.cloudflarestorage.com`)

Nenhuma assinatura paga e necessaria - o plano gratuito do R2 inclui 10GB de armazenamento e 10 milhoes de leituras/mes.

---

## Implementacao

### 1. Secrets no Supabase

Adicionar 4 secrets nas Edge Functions:
- `R2_ACCESS_KEY_ID` - chave de acesso
- `R2_SECRET_ACCESS_KEY` - chave secreta
- `R2_ENDPOINT` - endpoint S3 (ex: `https://<account-id>.r2.cloudflarestorage.com`)
- `R2_PUBLIC_URL` - URL publica do bucket (ex: `https://pub-xxxx.r2.dev` ou dominio customizado)
- `R2_BUCKET_NAME` - nome do bucket (ex: `mulheres-convergencia-storage`)

### 2. Edge Function: `r2-storage`

Uma funcao que aceita 3 operacoes:
- **upload**: recebe o arquivo via FormData, faz upload para o R2 usando a API S3 (via `aws4fetch` para assinar requests), retorna a URL publica
- **delete**: recebe o path do arquivo e remove do R2
- **list**: lista arquivos em um prefixo (opcional, util para admin)

A funcao usa a biblioteca `aws4fetch` (disponivel via esm.sh) que assina requests para APIs compativeis com S3.

### 3. Hook: `useR2Storage`

Novo hook que substitui as chamadas diretas ao `supabase.storage`:
- `uploadFile(file, folder)` - envia arquivo para a Edge Function, retorna URL publica
- `deleteFile(url)` - extrai o path da URL e solicita exclusao
- `uploading` - estado de loading

### 4. Atualizacao dos Hooks Existentes

| Hook/Componente | Mudanca |
|---|---|
| `useImageUpload.ts` | Substituir `supabase.storage.from('blog-images')` por `useR2Storage` |
| `useAmbassadorMaterials.ts` | Substituir `uploadFile`/`deleteFile` por `useR2Storage` |
| `AdminPublicPageManager.tsx` | Substituir upload de fotos por `useR2Storage` |
| `LogoComponent.tsx` | Apontar URLs para R2 ao inves de `supabase.storage.from('branding')` |
| `optimize-image/index.ts` | Redirecionar uploads para R2 ao inves do Supabase Storage |

### 5. Migracao dos Arquivos Existentes

Para migrar os arquivos ja existentes no Supabase Storage para o R2:
- Criar uma Edge Function auxiliar (`migrate-to-r2`) que lista todos os objetos dos buckets do Supabase, baixa cada um e faz upload para o R2 mantendo a mesma estrutura de pastas
- Apos a migracao, uma query SQL atualiza todas as URLs no banco de dados (colunas `file_url`, `photo_url`, `image_url`, etc.) substituindo o dominio do Supabase pelo dominio do R2
- Essa funcao sera executada uma unica vez e pode ser removida depois

### 6. Compatibilidade de URLs

Para evitar links quebrados durante a transicao:
- As URLs novas usarao o formato: `{R2_PUBLIC_URL}/{folder}/{filename}`
- O folder replica a estrutura dos buckets: `blog-images/`, `branding/`, `ambassador-materials/`, `partner-logos/`
- URLs antigas (Supabase) continuam funcionando enquanto os arquivos existirem la

---

## Arquivos

### Novos
- `supabase/functions/r2-storage/index.ts` - Edge Function proxy para R2
- `supabase/functions/migrate-to-r2/index.ts` - Funcao de migracao unica
- `src/hooks/useR2Storage.ts` - Hook centralizado de storage
- `src/lib/storage.ts` - Utilitarios de URL do storage

### Modificados
- `supabase/config.toml` - Adicionar configuracao das novas funcoes
- `src/hooks/useImageUpload.ts` - Usar R2 ao inves de Supabase Storage
- `src/hooks/useAmbassadorMaterials.ts` - Usar R2 para upload/delete
- `src/components/admin/ambassadors/AdminPublicPageManager.tsx` - Usar R2
- `src/components/layout/LogoComponent.tsx` - URLs do R2
- `supabase/functions/optimize-image/index.ts` - Upload para R2

### Passos do Usuario (manual)
1. Criar bucket no Cloudflare R2 e habilitar acesso publico
2. Gerar credenciais de API R2
3. Adicionar os 5 secrets no Supabase (via painel)
4. Apos deploy, executar a funcao de migracao uma vez
5. Verificar que as imagens estao funcionando
6. (Opcional) Remover arquivos do Supabase Storage apos confirmar
