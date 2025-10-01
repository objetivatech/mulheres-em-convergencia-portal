# Deploy no Cloudflare Pages

## Problema Identificado

O erro `lockfile had changes, but lockfile is frozen` ocorre porque:
1. O Cloudflare Pages usa `bun install --frozen-lockfile` por padrão
2. O lockfile precisa estar 100% sincronizado com package.json
3. Existem warnings de peer dependencies que podem causar mudanças no lockfile

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

### Passo 3: Redirects para RSS e Sitemap

O arquivo `public/_redirects` já está configurado corretamente e funciona no Cloudflare Pages:

```
/rss.xml https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/generate-rss 200
/sitemap.xml https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/generate-sitemap 200
```

### Passo 4: Configuração Avançada (Opcional)

Se o erro persistir, você pode:

1. **Opção A - Usar npm em vez de bun:**
   - O Cloudflare detecta automaticamente bun.lockb
   - Delete o arquivo `bun.lockb` do repositório para forçar uso do npm
   - Commit e push das mudanças

2. **Opção B - Configurar Custom Build:**
   - No painel do Cloudflare Pages, vá em Settings > Build configurations
   - Desabilite "Use default build command"
   - Use: `npm ci && npm run build`

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

### Erro: "lockfile had changes"
- **Solução:** Use npm em vez de bun (veja Passo 4, Opção A)

### Erro: "peer dependency warnings"
- **Solução:** Estas são apenas warnings e não devem impedir o build com npm

### RSS/Sitemap retornam 404
- **Solução:** Verifique se o arquivo `public/_redirects` está sendo copiado para o build
- Confirme que está no diretório `public/` (não `dist/`)

### Build timeout
- **Solução:** O build pode demorar na primeira vez. Aguarde até 10 minutos.

## Status Atual

✅ Arquivo `_redirects` configurado corretamente
✅ Variáveis de ambiente documentadas
✅ Build commands otimizados para Cloudflare Pages
✅ RSS e Sitemap apontando para Supabase Edge Functions

## Próximos Passos

1. Configure as variáveis de ambiente no painel do Cloudflare
2. Ajuste o build command para usar npm
3. Faça um novo deploy
4. Teste as URLs de RSS e Sitemap
5. Configure o domínio customizado após validação
