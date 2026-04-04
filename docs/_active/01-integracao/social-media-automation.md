# Sistema de Automação de Redes Sociais

## Visão Geral

Sistema próprio de publicação automatizada em redes sociais. Permite conectar múltiplas plataformas (LinkedIn, Facebook, Instagram, Pinterest) e publicar posts do blog automaticamente ou manualmente.

**Status:** ✅ LinkedIn implementado | 🚧 Meta e Pinterest em desenvolvimento

---

## Arquitetura

### Componentes Principais

```
┌──────────────────────────────────────────┐
│        Interface Administrativa          │
│     /admin/redes-sociais                 │
│  - Conectar contas                       │
│  - Gerenciar conexões                    │
│  - Selecionar páginas LinkedIn          │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│         Edge Functions                    │
│  - social-oauth-linkedin (OAuth)         │
│  - social-post-linkedin (Publicação)     │
│  - social-oauth-meta (Em breve)          │
│  - social-post-meta (Em breve)           │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│         Tabelas Supabase                 │
│  - social_accounts (Contas conectadas)   │
│  - social_posts (Histórico publicações)  │
└──────────────────────────────────────────┘
```

### Tabelas do Banco de Dados

#### `social_accounts`
Armazena credenciais e informações das contas conectadas.

```sql
- id: uuid
- user_id: uuid (quem conectou)
- platform: string (linkedin, facebook, instagram, pinterest)
- platform_user_id: string (ID pessoal)
- platform_page_id: string (ID página/organização - opcional)
- account_name: string
- account_email: string
- access_token: string (criptografado)
- refresh_token: string (quando disponível)
- token_expires_at: timestamp
- is_active: boolean
- metadata: jsonb (organization_pages, permissões, etc.)
- created_at: timestamp
- updated_at: timestamp
```

#### `social_posts`
Registra todas as publicações feitas através do sistema.

```sql
- id: uuid
- user_id: uuid
- blog_post_id: uuid (se for publicação de blog)
- content: text
- media_urls: text[]
- platforms: text[] (onde foi publicado)
- status: string (draft, scheduled, publishing, published, failed)
- scheduled_for: timestamp (para agendamentos futuros)
- published_at: timestamp
- platform_post_ids: jsonb {linkedin: "id", facebook: "id"}
- platform_responses: jsonb (respostas das APIs)
- error_message: text
- is_republish: boolean
- republish_count: integer
- created_at: timestamp
- updated_at: timestamp
```

---

## LinkedIn - Integração Completa

### 1. Fluxo OAuth

#### Passo 1: Iniciar Autorização
```typescript
// Usuário clica em "Conectar LinkedIn"
GET /functions/v1/social-oauth-linkedin/authorize

// Retorna URL de autorização
{
  "authUrl": "https://www.linkedin.com/oauth/v2/authorization?...",
  "state": "99167317-d65e-498a-9753-acfd19801ca2"
}
```

#### Passo 2: Callback do LinkedIn
```
// LinkedIn redireciona para:
/functions/v1/social-oauth-linkedin/callback?code=XXX&state=YYY

// Edge function valida e redireciona para:
/admin/redes-sociais?linkedin_code=XXX&linkedin_state=YYY
```

#### Passo 3: Conectar Conta
```typescript
// AdminSocialMedia.tsx detecta parâmetros e chama:
POST /functions/v1/social-oauth-linkedin/connect
Authorization: Bearer <user_token>
{
  "code": "authorization_code"
}

// Edge function:
// 1. Troca code por access_token
// 2. Busca informações do usuário
// 3. Busca páginas de organização (se houver)
// 4. Salva no banco de dados
// 5. Retorna account_id e lista de páginas
```

### 2. Seleção de Página ou Perfil

Se o usuário administra páginas de negócio no LinkedIn:

```typescript
// Modal LinkedInPageSelector é exibido
- Opção 1: Perfil Pessoal
- Opção 2: Página "Empresa XYZ"
- Opção 3: Página "Organização ABC"

// Ao selecionar, atualiza social_accounts:
UPDATE social_accounts 
SET platform_page_id = 'urn:li:organization:123456'
WHERE id = account_id
```

### 3. Publicação em Posts

```typescript
POST /functions/v1/social-post-linkedin
Authorization: Bearer <user_token>
{
  "content": "Texto do post",
  "media_urls": ["https://..."], // opcional
  "account_id": "uuid" // opcional, usa conta padrão se omitido
}

// Edge function:
// 1. Busca conta ativa do usuário
// 2. Verifica se token expirou
// 3. Monta payload UGC Posts API v2
// 4. Define author como perfil OU organização
// 5. Publica no LinkedIn
// 6. Retorna resultado
```

#### Exemplo de Payload UGC

**Para perfil pessoal:**
```json
{
  "author": "urn:li:person:abc123",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Conteúdo do post"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Para página de organização:**
```json
{
  "author": "urn:li:organization:123456",
  // ... restante igual
}
```

### 4. Desconectar Conta

```typescript
// Usuário clica no ícone de lixeira
DELETE FROM social_accounts WHERE id = account_id

// Modal de confirmação previne exclusão acidental
```

---

## Integração com Blog

### 1. Publicação Manual de Post do Blog

No painel do blog (`/admin/blog`), posts publicados exibem o botão **"Publicar nas Redes"**.

```typescript
// Componente: PublishToSocialButton
- Busca contas conectadas
- Mostra modal com checkboxes das plataformas
- Permite customizar conteúdo
- Publica em paralelo nas plataformas selecionadas
- Registra em social_posts com blog_post_id
```

**Fluxo:**
1. Editor clica em "Publicar nas Redes"
2. Seleciona LinkedIn, Facebook, Instagram
3. Opcionalmente edita o texto (padrão: excerpt + link)
4. Sistema publica em paralelo
5. Exibe resultado: "Publicado em 3 de 3 redes" ou erros

### 2. Republicação de Posts Antigos

Posts já publicados podem ser republicados:
- Mesmo botão "Publicar nas Redes"
- `is_republish: true` no registro
- `republish_count` incrementado
- Útil para divulgação recorrente

### 3. Auto-Publicação (Planejado - Não Implementado)

**Opção A: Trigger no Banco**
```sql
CREATE TRIGGER auto_publish_to_social
AFTER UPDATE ON blog_posts
FOR EACH ROW
WHEN (NEW.status = 'published' AND OLD.status != 'published')
EXECUTE FUNCTION publish_to_social_networks();
```

**Opção B: Webhook no Frontend**
```typescript
// Em useUpdateBlogPost hook
onSuccess: async (post) => {
  if (post.status === 'published') {
    await autoPublishToSocial(post.id);
  }
}
```

---

## Gestão de Tokens

### LinkedIn
- **Validade:** 60 dias
- **Renovação:** Não suportada (usuário precisa reconectar)
- **Expiração:** Sistema detecta token expirado e exibe "Reconectar"

### Facebook/Instagram (Meta)
- **Validade:** 60 dias (short-lived) ou permanente (long-lived)
- **Renovação:** Automática com refresh_token
- **Planejado:** Sistema renovará automaticamente antes de expirar

### Pinterest
- **Validade:** 1 ano
- **Renovação:** Com refresh_token
- **Planejado:** Renovação automática

---

## Interface de Administração

### Página: `/admin/redes-sociais`

#### Seção 1: Conectar Redes Sociais
```
┌────────────────────────────────────────┐
│  [LinkedIn]  [Facebook]  [Instagram]   │
│  [Pinterest]                           │
└────────────────────────────────────────┘
```

- Botões ficam desabilitados após conectar
- Mostram "LinkedIn Conectado" quando ativos
- Plataformas não implementadas mostram toast "Em breve"

#### Seção 2: Contas Conectadas
```
┌────────────────────────────────────────┐
│ 🔵 Maria Silva                   [🗑️]  │
│    LinkedIn • Página de negócio        │
│    Conectado em 15/11/2025             │
│    [Trocar Página]  [Reconectar]       │
└────────────────────────────────────────┘
```

- Badge "Ativo" (verde) ou "Expirado" (vermelho)
- Botão "Trocar Página" (apenas se houver páginas)
- Botão "Reconectar" (se token expirado)
- Botão lixeira (desconectar conta)

---

## Segurança

### RLS (Row Level Security)

```sql
-- Usuários só veem suas próprias contas
CREATE POLICY "Users can view their own accounts"
ON social_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Usuários só podem inserir/atualizar suas contas
CREATE POLICY "Users can manage their own accounts"
ON social_accounts FOR ALL
USING (auth.uid() = user_id);
```

### Criptografia
- `access_token` armazenado como string (Supabase gerencia criptografia em repouso)
- Tokens nunca retornados ao frontend
- Edge functions usam `SUPABASE_SERVICE_ROLE_KEY` para acesso

### Rate Limiting
- APIs de redes sociais têm limites próprios
- LinkedIn: ~100 posts/dia por usuário
- Erros 429 (rate limit) tratados e exibidos ao usuário

---

## Monitoramento e Debug

### Logs nas Edge Functions
Todas as edge functions incluem logs detalhados:

```typescript
console.log('🚀 Starting LinkedIn OAuth...');
console.log('✅ Access token received');
console.log('❌ Failed to publish:', error);
```

### Consultar Logs
```bash
# Ver logs da função OAuth
supabase functions logs social-oauth-linkedin

# Ver logs de publicação
supabase functions logs social-post-linkedin
```

### Tabela de Status de Posts

Consultar histórico de publicações:
```sql
SELECT 
  sp.id,
  sp.content,
  sp.platforms,
  sp.status,
  sp.published_at,
  sp.error_message,
  bp.title as blog_title
FROM social_posts sp
LEFT JOIN blog_posts bp ON sp.blog_post_id = bp.id
WHERE sp.user_id = '<user_id>'
ORDER BY sp.created_at DESC;
```

---

## Próximos Passos

### Meta (Facebook + Instagram)
1. ✅ Criar app Meta Business
2. 🚧 Implementar OAuth 2.0
3. 🚧 Buscar páginas e contas Instagram
4. 🚧 Publicar via Graph API

### Pinterest
1. 🔜 Criar app Pinterest
2. 🔜 Implementar OAuth
3. 🔜 Publicar pins via API

### Melhorias Gerais
- [ ] Agendamento de posts (scheduler cron job)
- [ ] Analytics integrado (visualizações, engajamento)
- [ ] Preview de posts antes de publicar
- [ ] Templates de posts
- [ ] Histórico detalhado de publicações
- [ ] Webhook para renovação automática de tokens

---

## Troubleshooting

### Erro: "Token de acesso expirado"
**Solução:** Clicar em "Reconectar" na conta

### Erro: "Nenhuma conta LinkedIn conectada"
**Causa:** RLS impedindo acesso ou conta não salva
**Solução:** Verificar logs do edge function `/connect`

### Erro: "Falha ao obter URL de autorização"
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Verificar `LINKEDIN_CLIENT_ID` e `LINKEDIN_CLIENT_SECRET`

### Posts não aparecem no LinkedIn
**Causa:** Usando `platform_page_id` incorreto
**Solução:** Trocar para perfil pessoal ou verificar permissões da página

---

## Variáveis de Ambiente (Edge Functions)

```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=<seu_client_id>
LINKEDIN_CLIENT_SECRET=<seu_client_secret>

# Meta OAuth (futuro)
META_APP_ID=<seu_app_id>
META_APP_SECRET=<seu_app_secret>

# Pinterest OAuth (futuro)
PINTEREST_APP_ID=<seu_app_id>
PINTEREST_APP_SECRET=<seu_app_secret>
```

Configurar via:
```bash
supabase secrets set LINKEDIN_CLIENT_ID=xxx
supabase secrets set LINKEDIN_CLIENT_SECRET=yyy
```

---

## Referências

- [LinkedIn OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [LinkedIn UGC Post API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api)
- [LinkedIn Organization Access](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/organizations/organization-access-control)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api/)
- [Pinterest API](https://developers.pinterest.com/docs/api/v5/)

---

**Última atualização:** 2025-11-26  
**Autor:** Sistema de Automação de Redes Sociais
