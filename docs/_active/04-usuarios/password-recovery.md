
# Recuperação de Senha (Supabase)

Este portal implementa:
- Link "Esqueceu a senha?" (rota `/forgot-password`)
- Página de redefinição (rota `/reset-password`)
- Métodos no hook de autenticação para enviar email e atualizar a senha

## Fluxo

1. Usuária acessa `/forgot-password` e informa o email.
2. Enviamos `resetPasswordForEmail` via Supabase com `redirectTo` para `/reset-password`.
3. Ao abrir o link recebido por email, a usuária é autenticada automaticamente (evento `PASSWORD_RECOVERY`) e pode definir a nova senha em `/reset-password`.
4. Após salvar, redirecionamos para `/auth`.

## Configurações necessárias no Supabase

- Authentication > URL Configuration:
  - Adicionar a URL do site (produção e desenvolvimento) nos Allowed Redirect URLs, ex:
    - `http://localhost:5173/reset-password`
    - `https://SEU-DOMINIO/reset-password`

Sem isso, o link pode não autenticar corretamente ao redirecionar.

## Acessibilidade

- Campos com Label associados e textos descritivos.
- Feedback via toasts e estados de carregamento nos botões.

