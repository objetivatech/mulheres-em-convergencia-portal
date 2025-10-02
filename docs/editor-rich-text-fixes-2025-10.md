# Correções do Editor Rico - Outubro 2025

## Problemas Identificados e Resolvidos

### 1. Erro de React Runtime
**Sintoma:** `TypeError: Cannot read properties of null (reading 'useEffect')` no `QueryClientProvider`

**Causa:** Múltiplas instâncias de React sendo carregadas por dependências conflitantes (especialmente após adicionar `@dnd-kit/*` e outras libs que suportam React 18/19).

**Solução:**
- **vite.config.ts**: Adicionado `resolve.dedupe: ["react", "react-dom"]` para garantir uma única instância
- **Recomendação futura**: Se o erro persistir, adicionar `overrides` em package.json:
  ```json
  {
    "overrides": {
      "react": "18.3.1",
      "react-dom": "18.3.1"
    }
  }
  ```

### 2. TinyMCE Não Carregava
**Sintoma:** Editor não aparecia, textarea simples ficava visível

**Causa:** 
- O componente tentava carregar `/tinymce_8.1.2/tinymce/js/tinymce/tinymce.min.js`
- Porém o repositório só tinha `public/tinymce_8.1.2.zip` (arquivos não extraídos)
- Script retornava 404 e editor nunca inicializava

**Solução:**
- **Estratégia de carregamento com fallback em cascata + timeout**:
  1. **CDN primeiro** (jsDelivr): `https://cdn.jsdelivr.net/npm/tinymce@8.1.2/tinymce.min.js`
     - Timeout de **5 segundos** para não travar se CDN estiver lento
  2. **Self-hosted fallback**: `/tinymce_8.1.2/tinymce/js/tinymce/tinymce.min.js` (se CDN falhar ou timeout)
     - Configura `tinymce.baseURL = '/tinymce_8.1.2/tinymce'` para resolver plugins/skins
  3. **Textarea visível**: Já estava presente como último recurso
- **Correção crítica de UI**: Removido `skin: false` e `theme: 'silver'` que causavam UI invisível em TinyMCE 8

**Vantagens da abordagem CDN-first:**
- ✅ Funciona imediatamente sem assets locais
- ✅ CDN tem cache global e é mais rápido
- ✅ Plugins carregam automaticamente do CDN
- ✅ Compatível com Cloudflare Pages (sem restrições a CDNs externos)
- ✅ Fallback local mantém redundância
- ✅ Timeout garante que não trava se CDN estiver lento

### 3. Conteúdo Não Sincronizava em Posts Existentes
**Sintoma:** Ao editar post existente, editor ficava vazio ou com conteúdo desatualizado

**Causa:** TinyMCE não remontava ao trocar entre posts, mantendo instância anterior

**Solução:**
- **BlogEditor.tsx**: Adicionado `key={id || 'new'}` ao componente `TinyMCESelfHosted`
- Força remount completo ao mudar de post, garantindo:
  - Nova instância do TinyMCE
  - Novo `editorId` único
  - Conteúdo correto carregado via `init_instance_callback`

## Arquivos Modificados

### vite.config.ts
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
  dedupe: ["react", "react-dom"], // ✅ Garante única instância de React
},
```

### src/components/blog/TinyMCESelfHosted.tsx
- Carregamento CDN-first com timeout de 5s e fallback self-hosted
- **Removido** `skin: false` e `theme: 'silver'` (causavam UI invisível)
- Configura `tinymce.baseURL` quando usa self-hosted para resolver plugins/skins
- Upload de imagens via Supabase (`blog-images` bucket)
- Sincronização bidirecional de conteúdo (prop → editor e editor → onChange)
- Logs de debug para rastrear origem do carregamento (CDN vs self-hosted)

### src/pages/BlogEditor.tsx
```tsx
<TinyMCESelfHosted
  key={id || 'new'} // ✅ Força remount ao trocar posts
  value={field.value}
  onChange={field.onChange}
  height={500}
  placeholder="Digite o conteúdo do seu post..."
/>
```

## Notas para Cloudflare Pages

### ✅ Assets Self-Hosted (Opcional)
Se quiser usar 100% self-hosted (sem CDN):
1. Extrair `public/tinymce_8.1.2.zip` para `public/tinymce_8.1.2/`
2. Manter estrutura: `public/tinymce_8.1.2/tinymce/js/tinymce/tinymce.min.js`
3. O fallback self-hosted funcionará automaticamente

### ✅ CDN Funciona Normalmente
- Cloudflare Pages **permite** CDNs externos (jsDelivr, Unpkg, etc.)
- Não há bloqueio ou CORS issues
- CDN é servido via HTTPS com certificado válido

### ✅ Cache e Performance
- CDN: Cache global, carregamento mais rápido para usuários
- Self-hosted: Servido pelo Cloudflare CDN após primeiro acesso
- Ambos funcionam bem, CDN-first é recomendado

## Troubleshooting

### Editor não aparece
1. **Abrir console do browser** (F12 → Console)
2. **Verificar erros de carregamento**:
   - `Failed to load script`: CDN e self-hosted falharam
   - Confirmar que `/tinymce_8.1.2.zip` foi extraído (se usar self-hosted)
3. **Verificar rede** (F12 → Network → Filter: tinymce):
   - CDN deve retornar 200 OK
   - Se falhar, fallback tenta self-hosted
4. **Textarea visível**: Editor falhou, mas formulário ainda funciona

### Conteúdo não carrega em posts existentes
- ✅ Já corrigido com `key={id || 'new'}`
- Se problema persistir, verificar:
  - Hook `useBlogPost(id)` retorna `content` correto
  - `form.reset()` é chamado no `useEffect` do BlogEditor
  - `init_instance_callback` está setando conteúdo via `editor.setContent(value)`

### Erro "Cannot read properties of null (reading 'useEffect')"
- ✅ Já mitigado com `dedupe` no Vite
- Se persistir após clear cache:
  1. Adicionar `overrides` em package.json (ver seção 1)
  2. Deletar `node_modules` e reinstalar
  3. Verificar se alguma dependência força React 19

### Imagens não fazem upload
- Confirmar que bucket `blog-images` existe no Supabase Storage
- Verificar permissões de upload (RLS policies)
- Hook `useImageUpload` deve ter configuração correta de Storage

### Dependências Removidas (Limpeza)
- `@tinymce/tinymce-react` (não usado)
- `react-quill` (não usado)
- `react-trumbowyg` (não usado)

Isso reduz o bundle size e elimina potenciais conflitos de versão.

## Status Final

✅ **React runtime estável** (dedupe configurado)  
✅ **TinyMCE carrega via CDN** com fallback self-hosted e timeout  
✅ **UI do editor visível** (skin padrão oxide carregando corretamente)  
✅ **Editor funcional** para criar e editar posts  
✅ **Conteúdo sincronizado** corretamente em edição  
✅ **Upload de imagens** integrado  
✅ **Compatível com Cloudflare Pages**  
✅ **Dependências não utilizadas removidas**

## Testes Realizados

- [x] Home (/) carrega sem erros de React
- [x] `/admin/blog/novo` - Criar novo post com conteúdo rico
- [x] `/admin/blog/editar/:id` - Editar post existente (conteúdo carrega)
- [x] Upload de imagens no editor
- [x] Salvar e recarregar post (persistência)
- [x] Editor responsivo e funcional

## Próximos Passos (Futuro)

- [ ] Adicionar timeout visual (loading spinner) enquanto TinyMCE carrega
- [ ] Implementar fallback para Quill/Trumbowyg se TinyMCE falhar completamente
- [ ] Extrair `tinymce_8.1.2.zip` para self-host 100% offline
- [ ] Adicionar testes E2E para editor (Playwright/Cypress)
