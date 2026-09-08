# 20 — Recuperação de senha

Atualizado: 08/09/2026 · Banco novo `tysvpeprhokdijquprkd` (MeC-v6)

## Documento técnico

O pedido em `/esqueci-senha` chama `send-password-reset`, que cria um token aleatório de 64 caracteres, válido por uma hora, e envia o link `/redefinir-senha?token=...`. A função `reset-password-with-token` valida esse token e altera a senha pelo Auth administrativo.

As duas funções aceitam chamadas sem sessão porque a usuária ainda não consegue entrar. A proteção é feita por token imprevisível, expiração, uso único e validação de entrada. Um novo pedido invalida links anteriores; pedidos repetidos em até cinco minutos não enviam outro e-mail.

## Operação e diagnóstico

1. Confirme que o link abre `/redefinir-senha` com o parâmetro `token`.
2. Consulte os registros de `send-password-reset` para confirmar o envio.
3. Consulte os registros de `reset-password-with-token` para confirmar a tentativa de troca.
4. Um link usado, expirado ou substituído por pedido mais recente deve ser rejeitado.
5. Nunca copie tokens para chamados, documentos ou registros públicos.

## Manual simples

1. Abra **Entrar** e escolha **Esqueceu a senha?**.
2. Informe seu e-mail uma única vez e aguarde alguns minutos.
3. Abra somente a mensagem mais recente e clique em **Redefinir senha**.
4. Digite a nova senha duas vezes e conclua.
5. Se o link tiver expirado, volte ao primeiro passo e solicite outro.

Se o botão for pressionado mais de uma vez em poucos minutos, apenas uma mensagem será enviada. Isso evita duplicidade e mantém válido somente o link mais recente.