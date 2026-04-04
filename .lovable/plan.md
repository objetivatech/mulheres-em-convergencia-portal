

# Plano: Remoção Completa do Ayrshare

## Escopo

Remover todas as referências ao Ayrshare do código e documentação. As edge functions e componentes React do Ayrshare já foram deletados anteriormente — restam apenas referências residuais.

## Alterações

### 1. `supabase/functions/publish-scheduled-posts/index.ts`
Remover o bloco inteiro (linhas 47-62) que verifica `AYRSHARE_API_KEY` e invoca `ayrshare-auto-post`. A publicação agendada continuará funcionando normalmente — apenas o cross-posting social deixará de ser tentado.

### 2. `src/App.tsx`
Remover o comentário na linha 200: `{/* Rotas removidas: AdminAyrshare, AdminSocialMedia */}`

### 3. `docs/_active/01-integracao/ayrshare-integration.md`
Deletar o arquivo inteiro.

### 4. `docs/_active/ARQUITETURA-PORTAL-COMPLETA.md`
- Remover "Ayrshare" do diagrama de integrações externas
- Remover as edge functions `ayrshare-auto-post` e `ayrshare-test-post` das listagens
- Remover a rota `/admin/ayrshare`
- Remover a linha da tabela de integrações referente ao Ayrshare
- Remover menções de conexão com Ayrshare API nas interconexões

### 5. `docs/_active/01-integracao/social-media-automation.md`
Remover a menção "substituindo o AyrShare" do texto introdutório.

### 6. `docs/_active/CHANGELOG-2025-10-21.md`
Remover a menção "AyrShare" da lista de integrações.

### 7. `docs/_active/ATUALIZACAO-URLS-PORTUGUES.md`
Remover a linha `/admin/ayrshare`.

### 8. `docs/_archive/sistema-correcoes-finais-completas.md`
Arquivo de arquivo — remover ou anotar as seções do Ayrshare como descontinuadas.

## Impacto Zero nas Mecânicas

- **Blog agendado**: continua funcionando (pg_cron → Edge Function → publica posts). Apenas o trecho de cross-posting social é removido.
- **Nenhum componente React** depende do Ayrshare (já foram removidos anteriormente).
- **Nenhuma rota** aponta para Ayrshare (já redirecionadas/removidas).
- O sistema de social media automation próprio (`social-media-automation.md`) permanece intacto.

