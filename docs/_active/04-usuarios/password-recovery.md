
# Recuperação de Senha (fluxo atual)

Este portal implementa:
- Link "Esqueceu a senha?" (rota `/forgot-password`)
- Página de redefinição (rota `/reset-password`)
- Métodos no hook de autenticação para enviar email e atualizar a senha

## Fluxo

1. Usuária acessa `/esqueci-senha` e informa o e-mail.
2. A função `send-password-reset` cria um token de uso único e envia o link por e-mail.
3. O link abre `/redefinir-senha`, onde a nova senha é enviada à função `reset-password-with-token`.
4. Após salvar, a usuária é direcionada para `/entrar`.

## Configurações necessárias no Supabase

- As funções `send-password-reset` e `reset-password-with-token` são públicas porque a usuária ainda não iniciou uma sessão.
- A segurança depende do token aleatório, expiração em uma hora, uso único e invalidação dos links anteriores.
- A documentação técnica e operacional atual está em `docs/_reboot/20-recuperacao-de-senha.md`.

## Acessibilidade

- Campos com Label associados e textos descritivos.
- Feedback via toasts e estados de carregamento nos botões.

