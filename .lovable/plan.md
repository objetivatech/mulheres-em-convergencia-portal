## Plano: Unificação de "Meus Dados" + Troca de Email Verificada + Fim do Refresh ao Mudar de Aba

### Diagnóstico

#### 1. Duplicação "Meus Dados"
Hoje existem DOIS pontos de entrada para "Meus Dados", levando a telas diferentes:

- **Botão "Meus Dados" (QuickCard na Visão Geral)** → `/configuracoes/dados-pessoais` (`DadosPessoaisPage.tsx`)
  - Possui 4 abas: **Perfil** (nome, CPF, telefone, email read-only, cidade, estado, bio), **Endereços** (CRUD completo), **Contatos** (CRUD com email/telefone/whatsapp e contato principal), **Histórico** (atividades).
  - Mais completo, mas não tem foto, redes sociais, public_bio.

- **Aba "Meus Dados" (no UserDashboard)** → renderiza `ProfileEditForm`
  - Tem: foto (avatar com crop), nome (read-only), bio privada, telefone, cidade/estado, **redes sociais** (LinkedIn, Instagram, Website).
  - Não tem: CPF, endereços, contatos múltiplos, histórico, public_bio.

Resultado: usuária vê duas telas com dados parcialmente sobrepostos.

#### 2. Troca de email não funciona de fato
Validei no banco com a usuária Elisangela:
```
profiles.email             = mulheresemconvergencia@gmail.com  (antigo, ainda em destaque)
user_contacts (principal)  = juntas@mulheresemconvergencia.com.br (novo)
auth.users.email           = mulheresemconvergencia@gmail.com  (antigo, controla login)
```

A aba "Contatos" só grava em `user_contacts`. **Não toca em `auth.users.email` nem em `profiles.email`**, não envia email de confirmação e não dispara verificação. Por isso:
- O nome continua exibindo o email antigo (vem de `profiles.email` / `user.email`).
- Login, recuperação de senha, newsletter, notificações Mailrelay, CRM, certificados, alertas Conecta+ continuam usando o email antigo.
- Não há nenhuma validação de propriedade do novo email — qualquer pessoa poderia "tornar principal" um email que não é dela.

#### 3. Refresh ao trocar de aba/janela
Em `src/App.tsx`:
```ts
const queryClient = new QueryClient();
```
Sem opções, o React Query usa o padrão `refetchOnWindowFocus: true`. Toda vez que a usuária volta para a aba do navegador, **todas** as queries ativas re-executam, gerando o "refresh" visível e irritante.

---

### Solução

#### Parte 1 — Unificar "Meus Dados" em uma única página

Manter como base o **layout do botão Quick** (`/configuracoes/dados-pessoais` com 4 abas), pois é o mais completo. Complementar a aba **Perfil** com tudo que existe no `ProfileEditForm` (foto com crop, public_bio, redes sociais).

A nova aba **Perfil** terá esta estrutura:

```text
┌─ Foto e Identificação ─────────────────────────┐
│ [Avatar c/ crop]   Nome (read-only - vem CPF)  │
│                    CPF (read-only - SSOT)       │
└────────────────────────────────────────────────┘

┌─ Informações Básicas ──────────────────────────┐
│ Telefone         | Cidade | Estado              │
│ Bio (privada)                                   │
│ Bio pública (exibida no CONECTA+/Embaixadora)   │
└────────────────────────────────────────────────┘

┌─ Email Principal ──────────────────────────────┐
│ [valor atual]  [Botão: Alterar Email]           │
│ ⚠ Trocar email exige verificação por link       │
└────────────────────────────────────────────────┘

┌─ Redes Sociais ────────────────────────────────┐
│ LinkedIn | Instagram | Website                  │
└────────────────────────────────────────────────┘
```

As demais abas permanecem: **Endereços**, **Contatos** (telefones/WhatsApp adicionais — sem email!), **Histórico**.

**Importante:** a aba "Contatos" deixará de aceitar email como tipo de contato. Email é único e gerenciado pelo bloco "Email Principal" da aba Perfil.

**Ações:**
- Atualizar `src/pages/DadosPessoaisPage.tsx`: incorporar avatar, public_bio, redes sociais e bloco "Email Principal" na aba Perfil.
- Em `UserDashboard.tsx`: remover a aba "Meus Dados" do TabsList e o `<TabsContent value="meus-dados">`. O botão QuickCard "Meus Dados" continua apontando para `/configuracoes/dados-pessoais`.
- Remover `src/components/user/ProfileEditForm.tsx` (código já migrado).
- Em `src/components/user/ContactFormDialog.tsx`: remover a opção `email` do select de tipo de contato (ficam phone, whatsapp, other).
- Manter rota `/configuracoes/dados-pessoais` como rota oficial.

#### Parte 2 — Troca de email com verificação real

Implementar fluxo seguro em duas etapas usando o sistema de auth do Supabase + email de confirmação enviado pela plataforma de emails do portal (Mailrelay/Edge Function existente).

**Passo a passo do fluxo:**

1. Usuária clica em **"Alterar Email"** na aba Perfil.
2. Modal pede o novo email + senha atual (re-autenticação leve).
3. Sistema valida formato e confere se o email não está em uso por outra conta.
4. Sistema gera token único, grava em nova tabela `email_change_requests` (id, user_id, current_email, new_email, token, expires_at, status), e envia email de confirmação **para o novo endereço** com link `/confirmar-email?token=…`.
5. Usuária acessa o link no novo email → edge function `confirm-email-change` valida o token, e:
   - Atualiza `auth.users.email` via Admin API (service role).
   - Atualiza `profiles.email` (trigger de SSOT).
   - Atualiza/insere registro em `user_contacts` marcando o novo como `is_primary=true, verified=true` e o antigo como `is_primary=false`.
   - Dispara sincronização Mailrelay para mover assinaturas/segmentos do email antigo para o novo.
   - Atualiza CRM (`crm_leads.email` onde corresponde via CPF) — preserva histórico e jornada.
   - Marca request como `confirmed`.
6. Usuária recebe toast de sucesso + email-resumo notificando a alteração tanto no antigo quanto no novo endereço (controle anti-fraude).
7. Token expira em 24h; tentativas pendentes anteriores são canceladas ao solicitar nova troca.

**Ações técnicas:**
- Migration SQL: criar tabela `email_change_requests` com RLS (própria usuária lê/insere; service role atualiza).
- Edge Function `request-email-change`: valida senha, cria request, envia email de confirmação via Mailrelay para o novo endereço.
- Edge Function `confirm-email-change`: valida token, atualiza `auth.users` (admin api), `profiles`, `user_contacts`, sincroniza Mailrelay, atualiza CRM por CPF, envia notificação para email antigo.
- Componente `ChangeEmailDialog` em `src/components/user/`.
- Página `/confirmar-email` (reaproveitar `ConfirmEmail.tsx` ajustando para o novo fluxo).
- Garantir que **todos os pontos** que enviam email continuam funcionando — eles consomem `profiles.email` ou `auth.users.email`, ambos atualizados após confirmação. Já está mapeado: newsletter (Mailrelay sync), notificações Conecta+, certificados de evento, embaixadoras, CRM, helpdesk.
- Remover bloqueio "Email não pode ser alterado" das telas atuais.

**Limpeza dos casos existentes (data hygiene):**
- Para a Elisangela (e qualquer usuária com email principal em `user_contacts` divergente do `profiles.email`): exibir banner avisando "Há uma troca de email pendente — clique para confirmar". Não alterar nada automaticamente sem verificação — segurança em primeiro lugar.

#### Parte 3 — Remover refresh ao trocar de aba/janela

Em `src/App.tsx`, configurar o `QueryClient` global para não refetch automaticamente ao reganhar foco da janela:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000, // 1 min — cache razoável
    },
  },
});
```

Isso elimina o "refresh" ao alternar abas sem comprometer dados, pois:
- Mutations continuam invalidando queries normalmente (os hooks já fazem isso explicitamente).
- Navegação entre páginas ainda dispara as queries necessárias.
- Hooks que precisam de dados em tempo real (notificações Conecta+, real-time subscriptions) usam Supabase Realtime — independente do refetch.

#### Parte 4 — Documentação

Atualizar:
- `mem://architecture/user-profile-ssot` — adicionar regra "email é alterado apenas via fluxo verificado".
- Criar `docs/_active/04-usuarios/troca-de-email-verificada.md` com o fluxo completo.
- Atualizar `docs/_active/04-usuarios/unificacao-perfil-dados.md` com a nova estrutura unificada.

---

### Arquivos tocados

**Frontend**
- `src/App.tsx` — config do QueryClient (sem refetchOnWindowFocus).
- `src/pages/UserDashboard.tsx` — remover aba e conteúdo "Meus Dados".
- `src/pages/DadosPessoaisPage.tsx` — incorporar avatar, public_bio, redes sociais, bloco Email Principal.
- `src/components/user/ContactFormDialog.tsx` — remover tipo "email".
- `src/components/user/ChangeEmailDialog.tsx` — novo componente de troca de email.
- `src/components/user/ProfileEditForm.tsx` — remover (código migrado).
- `src/pages/ConfirmEmail.tsx` ou nova `ConfirmarEmailPage.tsx` — handler do token de confirmação.
- `src/App.tsx` — adicionar rota `/confirmar-email`.

**Backend**
- Migration: tabela `email_change_requests` + RLS.
- Edge Function `request-email-change`.
- Edge Function `confirm-email-change`.

**Documentação**
- `docs/_active/04-usuarios/troca-de-email-verificada.md` (novo).
- `docs/_active/04-usuarios/unificacao-perfil-dados.md` (atualizar).
- `mem://architecture/user-profile-ssot` (atualizar).

---

### Resultado esperado

- Uma única página "Meus Dados" (`/configuracoes/dados-pessoais`) com tudo: foto, identidade, contatos, endereços, redes sociais, email verificado, histórico.
- Troca de email só ocorre após a usuária clicar no link enviado para o **novo endereço** — nenhuma alteração silenciosa, nenhum desalinhamento entre `auth`, `profiles`, Mailrelay e CRM.
- Notificação dupla (antigo e novo email) garante rastreabilidade e segurança contra invasões.
- O portal para de "piscar/recarregar" ao alternar abas do navegador, mantendo a UX fluida.
