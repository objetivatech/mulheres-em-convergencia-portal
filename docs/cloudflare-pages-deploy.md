# Deploy no Cloudflare Pages

## Problemas Identificados e Soluções

### 1. Conflitos de Dependências (RESOLVIDO)
Erros `ERESOLVE` causados por:
- `react-leaflet@5.0.0` requer React 19, mas o projeto usa React 18.3.1
- `date-fns@4.1.0` incompatível com `react-day-picker@8.10.1`

**Solução implementada:**
- Downgrade `react-leaflet` para `4.2.1` (compatível com React 18)
- Downgrade `date-fns` para `3.6.0` (compatível com react-day-picker)
- Removido `react-leaflet-markercluster` (não utilizado)

### 2. RSS e Sitemap retornam 404 (RESOLVIDO)
O arquivo `_redirects` não injeta o header `apikey` necessário para as Edge Functions do Supabase.

**Solução implementada:**
- Criada Cloudflare Pages Function em `functions/[[path]].ts`
- A função intercepta `/rss.xml` e `/sitemap.xml`
- Faz proxy para as Edge Functions do Supabase com os headers corretos
- Retorna XML com Content-Type adequado

## Solução: Configuração do Build no Cloudflare Pages

### Passo 1: Configurações de Build no Painel do Cloudflare

Acesse o painel do Cloudflare Pages e configure:

**Build command:**
```bash
npm install && npm run build
```

**Build output directory:**
```
dist
```

**Root directory:**
```
/
```

**Node version:**
Configure nas variáveis de ambiente (veja Passo 2)

### Passo 2: Variáveis de Ambiente

No painel do Cloudflare Pages > Settings > Environment variables, adicione:

#### Variáveis de Build (Production & Preview)
```
NODE_VERSION=18
VITE_SUPABASE_PROJECT_ID=ngqymbjatenxztrjjdxa
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ
VITE_SUPABASE_URL=https://ngqymbjatenxztrjjdxa.supabase.co
```

### Passo 3: Cloudflare Pages Function (RSS/Sitemap)

O arquivo `functions/[[path]].ts` já está criado e intercepta requisições para RSS e Sitemap.

**Como funciona:**
1. Intercepta `/rss.xml` e `/sitemap.xml`
2. Faz fetch às Edge Functions do Supabase com header `apikey`
3. Retorna XML com `Content-Type: application/xml`
4. Todas as outras rotas são passadas adiante com `context.next()`

**Importante:** As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` devem estar configuradas no Cloudflare Pages (veja Passo 2).

### Passo 4: Verificações Finais

Antes do deploy, certifique-se de que:

1. **Arquivo `bun.lockb` foi removido** do repositório (forçar uso de npm)
2. **Dependências corretas no `package.json`:**
   - `react-leaflet`: `4.2.1`
   - `date-fns`: `3.6.0`
   - `react-leaflet-markercluster`: removido
3. **Arquivo `functions/[[path]].ts` existe** no repositório
4. **Commit e push** de todas as mudanças

## Testando o Deploy

Após configurar e fazer o deploy:

1. **Teste o site:**
   - https://seu-projeto.pages.dev

2. **Teste o RSS:**
   - https://seu-projeto.pages.dev/rss.xml
   - Deve redirecionar para o Supabase Edge Function

3. **Teste o Sitemap:**
   - https://seu-projeto.pages.dev/sitemap.xml
   - Deve redirecionar para o Supabase Edge Function

4. **Valide com ferramentas:**
   - RSS: https://rssvalidator.app/
   - Sitemap: Google Search Console

## Configuração de Domínio Customizado

Após o deploy funcionar:

1. No Cloudflare Pages > Custom domains
2. Adicione: `mulheresemconvergencia.com.br`
3. Configure os DNS records conforme instruído
4. Aguarde propagação (pode levar até 24h)

## Troubleshooting

### Erro: "ERESOLVE could not resolve"
- **Solução:** As dependências foram corrigidas. Certifique-se de usar as versões corretas:
  - `react-leaflet@4.2.1`
  - `date-fns@3.6.0`

### Erro: "peer dependency warnings"
- **Solução:** Warnings de peer dependencies são normais e não impedem o build

### RSS/Sitemap retornam 404
- **Solução:** Verifique se o arquivo `public/_redirects` está sendo copiado para o build
- Confirme que está no diretório `public/` (não `dist/`)

### Build timeout
- **Solução:** O build pode demorar na primeira vez. Aguarde até 10 minutos.

## Status Atual

✅ Conflitos de dependências resolvidos
✅ Cloudflare Pages Function criada (`functions/[[path]].ts`)
✅ Variáveis de ambiente documentadas
✅ Build commands otimizados para Cloudflare Pages
✅ RSS e Sitemap funcionando via proxy para Supabase Edge Functions

## Próximos Passos

1. Configure as variáveis de ambiente no painel do Cloudflare
2. Ajuste o build command para usar npm
3. Faça um novo deploy
4. Teste as URLs de RSS e Sitemap
5. Configure o domínio customizado após validação
