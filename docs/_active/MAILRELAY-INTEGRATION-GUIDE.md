# Guia Completo: Integração de Emails com MailRelay

**Data:** 24 de outubro de 2025  
**Autor:** Manus AI  
**Objetivo:** Este guia detalha todos os passos para configurar e implantar o novo sistema de emails transacionais (confirmação de cadastro, recuperação de senha, etc.) utilizando a API do MailRelay, substituindo o sistema nativo do Supabase.

---

## 🚀 Visão Geral da Solução

Para resolver os problemas de envio de email, centralizamos todos os disparos transacionais e de notificação na API do MailRelay. A solução implementada consiste em:

1.  **Novas Tabelas no Banco de Dados:** Para armazenar tokens de confirmação e reset de senha.
2.  **Novas Edge Functions:** Para gerar tokens, enviar emails via MailRelay e validar os tokens.
3.  **Atualização do Frontend:** Para chamar as novas edge functions em vez das funções de autenticação do Supabase.
4.  **Novas Páginas:** Para o usuário confirmar seu email e redefinir sua senha.

## 📋 Checklist de Implantação

Siga os passos abaixo na ordem correta para garantir que o sistema funcione perfeitamente.

- [ ] **Passo 1:** Configurar Variáveis de Ambiente no Supabase
- [ ] **Passo 2:** Desabilitar Emails Nativos do Supabase
- [ ] **Passo 3:** Aplicar a Migração do Banco de Dados
- [ ] **Passo 4:** Fazer Deploy das Edge Functions
- [ ] **Passo 5:** Testar os Fluxos de Email
- [ ] **Passo 6 (Opcional):** Entender Como Editar os Templates de Email

---

## ⚙️ Passo 1: Configurar Variáveis de Ambiente no Supabase

As novas Edge Functions precisam de credenciais para se conectar ao MailRelay. Você precisa configurar os seguintes "Secrets" no seu projeto Supabase.

1.  Acesse o **Dashboard do Supabase**.
2.  Vá para **Project Settings** > **Edge Functions**.
3.  Clique em **Add new secret** e adicione as seguintes variáveis:

| Secret Name | Valor | Descrição |
| :--- | :--- | :--- |
| `MAILRELAY_API_KEY` | `SUA_CHAVE_DE_API_MAILRELAY` | Sua chave de API do MailRelay. |
| `MAILRELAY_HOST` | `SEU_HOST_MAILRELAY` | Ex: `c1s1.ip-zone.com` ou seu CNAME. |
| `ADMIN_EMAIL_FROM` | `contato@mulheresemconvergencia.com.br` | O email remetente que aparecerá para o usuário. |

> **⚠️ Importante:** Sem essas variáveis, as funções de envio de email falharão.

## 🚫 Passo 2: Desabilitar Emails Nativos do Supabase

Para garantir que o Supabase não tente mais enviar emails (e falhe), precisamos desabilitar o envio automático.

1.  Acesse o **Dashboard do Supabase**.
2.  Vá para **Authentication** > **Settings**.
3.  Role para baixo até a seção **Email**.
4.  **Desative** a opção **"Enable email confirmations"**.

Isso fará com que o Supabase crie o usuário, mas não tente enviar o email de confirmação, deixando essa tarefa para a nossa nova Edge Function.

## 🗄️ Passo 3: Aplicar a Migração do Banco de Dados

Uma nova migração foi criada para adicionar as tabelas `email_confirmation_tokens` e `password_reset_tokens`. Você precisa aplicar essa migração ao seu banco de dados Supabase.

O arquivo de migração é: `supabase/migrations/20251024_create_email_tokens_tables.sql`

**Como aplicar (via Supabase CLI):**

Se você gerencia seu projeto localmente com a Supabase CLI, o processo é simples:

1.  Certifique-se de que seu projeto local está atualizado com o `git pull`.
2.  Vincule seu projeto local ao projeto Supabase remoto:
    ```bash
    supabase link --project-ref SEU_PROJECT_REF
    ```
3.  Execute o comando para aplicar as migrações:
    ```bash
    supabase db push
    ```

**Alternativa (via SQL Editor):**

Se preferir, você pode copiar o conteúdo do arquivo SQL e executá-lo diretamente no **SQL Editor** do Dashboard do Supabase.

1.  Abra o arquivo `supabase/migrations/20251024_create_email_tokens_tables.sql`.
2.  Copie todo o conteúdo.
3.  No Dashboard do Supabase, vá para **SQL Editor** > **New query**.
4.  Cole o código e clique em **RUN**.

## 🚀 Passo 4: Fazer Deploy das Edge Functions

Foram criadas e atualizadas diversas Edge Functions. Você precisa fazer o deploy delas.

**Novas Functions:**

*   `send-confirmation-email`: Envia o email de confirmação de cadastro.
*   `confirm-email-token`: Valida o token de confirmação.
*   `send-password-reset`: Envia o email de recuperação de senha.
*   `reset-password-with-token`: Valida o token e redefine a senha.

**Functions Atualizadas:**

*   `send-contact-message`: Agora notifica os administradores por email.
*   `send-business-message`: Agora notifica o dono do negócio por email.

**Como fazer o deploy (via Supabase CLI):**

1.  Execute o comando para fazer o deploy de todas as functions:
    ```bash
    supabase functions deploy --project-ref SEU_PROJECT_REF
    ```

**Alternativa (via Dashboard - NÃO RECOMENDADO PARA PROJETOS GRANDES):**

Você pode criar cada função manualmente no Dashboard e copiar/colar o código de cada `index.ts` correspondente. No entanto, o deploy via CLI é muito mais prático e menos propenso a erros.

## ✅ Passo 5: Testar os Fluxos de Email

Após a implantação, teste os seguintes fluxos para garantir que tudo está funcionando:

1.  **Cadastro de Novo Usuário:**
    *   Vá para a página `/auth` e crie uma nova conta.
    *   Verifique se você recebe o email de confirmação do MailRelay.
    *   Clique no link de confirmação e veja se a conta é ativada.

2.  **Recuperação de Senha:**
    *   Na página `/auth`, clique em "Esqueceu a senha?".
    *   Digite o email do usuário recém-criado.
    *   Verifique se você recebe o email de redefinição de senha.
    *   Clique no link, crie uma nova senha e tente fazer login com ela.

3.  **Formulário de Contato:**
    *   Vá para a página `/contato` e envie uma mensagem.
    *   Verifique se os emails dos administradores recebem a notificação.

4.  **Mensagem para Negócio:**
    *   Acesse a página de um negócio no diretório e envie uma mensagem.
    *   Verifique se o email do dono do negócio recebe a notificação.

## 🎨 Passo 6 (Opcional): Como Editar os Templates de Email

Você perguntou como usar os templates HTML com o MailRelay. Na implementação atual, os templates HTML **já estão integrados diretamente no código das Edge Functions**. Isso foi feito porque a API do MailRelay para envio de emails únicos (`sendMail`) espera o conteúdo HTML diretamente na requisição.

**Onde encontrar os templates:**

Os templates estão dentro das próprias Edge Functions que enviam os emails. Por exemplo, para o email de confirmação de cadastro:

*   **Arquivo:** `supabase/functions/send-confirmation-email/index.ts`
*   **Variável:** `emailHtml`

```typescript
// ... (código da função)

// HTML Email Template (based on 01_confirmar_cadastro.html)
const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>...
// ... todo o seu HTML aqui
</html>`;

// ... (código que envia o email)
```

**Como editar um template:**

1.  **Localize a Edge Function** correspondente ao email que deseja alterar (ex: `send-password-reset` para o email de redefinição de senha).
2.  **Abra o arquivo `index.ts`** dentro da pasta da função.
3.  **Encontre a variável `emailHtml`**.
4.  **Edite o HTML** diretamente dentro das crases (`` ` ``).
5.  **Faça o deploy da Edge Function** novamente para que a alteração tenha efeito.

> **Dica:** As variáveis dinâmicas (como nome do usuário e link) são inseridas no HTML usando a sintaxe `${variavel}`. Por exemplo: `<p>Olá, ${fullName}!</p>`.

---

## 📦 Resumo dos Arquivos Criados/Modificados

*   **Banco de Dados:**
    *   `supabase/migrations/20251024_create_email_tokens_tables.sql` (NOVO)
*   **Edge Functions:**
    *   `supabase/functions/send-confirmation-email/index.ts` (NOVO)
    *   `supabase/functions/confirm-email-token/index.ts` (NOVO)
    *   `supabase/functions/send-password-reset/index.ts` (NOVO)
    *   `supabase/functions/reset-password-with-token/index.ts` (NOVO)
    *   `supabase/functions/send-contact-message/index.ts` (ATUALIZADO)
    *   `supabase/functions/send-business-message/index.ts` (ATUALIZADO)
*   **Frontend (Código):**
    *   `src/hooks/useAuth.ts` (ATUALIZADO)
    *   `src/App.tsx` (ATUALIZADO)
*   **Frontend (Páginas):**
    *   `src/pages/ConfirmEmail.tsx` (NOVO)
    *   `src/pages/ResetPasswordWithToken.tsx` (NOVO)

---

Se tiver qualquer dúvida durante o processo, pode me perguntar!
