
## Plano Definitivo para RSS e Sitemap Canônicos no domínio `mulheresemconvergencia.com.br`

### Diagnóstico da varredura
Encontrei um desalinhamento claro entre a infraestrutura e a aplicação:

- O projeto já possui um proxy correto em `functions/[[path]].ts` para atender:
  - `/rss.xml`
  - `/sitemap.xml`
  - `/llms-full.txt`
- Porém, o frontend foi alterado para usar URLs diretas do Supabase em:
  - `src/lib/constants.ts`
  - `src/components/layout/Footer.tsx`
  - `src/pages/Admin.tsx`
- O arquivo `public/_redirects` ainda aponta diretamente para o Supabase, criando uma segunda estratégia de roteamento e deixando a arquitetura inconsistente.
- Há documentação ainda ensinando ou exibindo URLs `supabase.co/functions/v1/...`, o que reforça o uso do endpoint errado.

Isso confirma a raiz do problema: a camada pública correta deveria ser sempre o domínio oficial, mas o sistema ficou com fontes de verdade conflitantes.

## Objetivo da correção
Restaurar uma arquitetura única e definitiva em que:

- o endereço público e canônico seja sempre:
  - `https://mulheresemconvergencia.com.br/rss.xml`
  - `https://mulheresemconvergencia.com.br/sitemap.xml`
- o Supabase continue apenas como backend interno de geração
- o Admin, rodapé, meta tags e documentos usem somente o domínio oficial
- não haja risco de bagunçar Search Console, rastreamento, distribuição SEO ou consumo por agregadores

## Correções a implementar

### 1. Reverter os links públicos para o domínio oficial
Ajustar `src/lib/constants.ts` para que `RSS_FEED_URL` e `SITEMAP_URL` sejam derivados de `PRODUCTION_DOMAIN`, não do Supabase.

Resultado esperado:
- o Admin passa a abrir/copiar o domínio canônico
- o rodapé passa a exibir o domínio canônico
- nenhuma interface pública expõe endpoint interno do Supabase

### 2. Manter o proxy do Cloudflare/Pages como única ponte para o Supabase
Preservar `functions/[[path]].ts` como mecanismo oficial de entrega pública.

Revisão prevista:
- confirmar que `/rss.xml` e `/sitemap.xml` são interceptados antes de qualquer fallback do SPA
- garantir `Content-Type` correto para XML
- manter cache apropriado
- manter headers de autenticação só no lado servidor

### 3. Eliminar conflito de roteamento
Revisar `public/_redirects` para não competir com a Pages Function.

Ajuste proposto:
- remover ou neutralizar as regras de `/rss.xml` e `/sitemap.xml` no `_redirects` se estiverem redundantes com `functions/[[path]].ts`
- deixar apenas uma estratégia oficial de publicação

Isso evita comportamento inconsistente entre deploys, ambientes e domínio customizado.

### 4. Corrigir a área administrativa
Atualizar `src/pages/Admin.tsx` para:
- visualizar RSS e Sitemap no domínio oficial
- copiar as URLs canônicas corretas
- exibir textos alinhados com a arquitetura real

### 5. Corrigir o rodapé
Atualizar `src/components/layout/Footer.tsx` para manter os links públicos no domínio oficial, sem qualquer referência ao Supabase.

### 6. Revisar referências SEO no HTML estático
Validar que o `index.html` continue apontando para:
- `<link rel="alternate" ... href="https://mulheresemconvergencia.com.br/rss.xml" />`

Se necessário, revisar também qualquer referência complementar a sitemap/RSS em arquivos públicos.

### 7. Limpeza documental completa
Atualizar a documentação para refletir a arquitetura correta:

- `docs/_active/06-funcionalidades/cloudflare-pages-deploy.md`
- `docs/_active/06-funcionalidades/rss-sitemap-schema.md`
- `docs/_active/DEPLOY-RSS-FUNCTION.md`

Remover instruções que incentivem uso público de URLs `supabase.co/functions/v1/...`.

### 8. Validação final obrigatória
Após a implementação, validar explicitamente:

- `https://mulheresemconvergencia.com.br/rss.xml`
- `https://mulheresemconvergencia.com.br/sitemap.xml`

E confirmar:
- abre no domínio oficial
- não cai em SPA/404
- retorna XML
- Admin copia a URL correta
- rodapé abre a URL correta
- Search Console pode consumir o sitemap canônico sem desvio para Supabase

## Resultado esperado
Ao final, o portal ficará com uma arquitetura limpa e estável:

```text
Usuário / Google / agregadores
        ↓
https://mulheresemconvergencia.com.br/rss.xml
https://mulheresemconvergencia.com.br/sitemap.xml
        ↓
Cloudflare Pages Function
        ↓
Supabase Edge Functions (interno)
```

Assim, o domínio oficial volta a ser a única referência pública, sem exposição indevida de endpoints internos e sem ruído para métricas, SEO e indexação.
