# Bot Protection desativado (hCaptcha removido)

Este projeto não utiliza mais hCaptcha. O Supabase Bot Protection foi desativado e substituído por proteções alternativas no frontend e nas Edge Functions.

## O que mudou
- Removemos o uso de hCaptcha nas páginas públicas (Auth, Forgot Password e Contato)
- Atualizamos o código para usar:
  - Honeypot (campo oculto) nos formulários
  - Tempo mínimo de preenchimento antes de permitir envio
  - Rate limiting local por dispositivo (tentativas) no fluxo de Auth
  - Validações adicionais de conteúdo
  - No contato (Edge Function): verificação de origem, limite por email, e logs

## Como desativar o Bot Protection no Supabase
1. Acesse o painel do Supabase
2. Vá em Authentication > Settings > Security > Bot Protection
3. Desative a opção (toggle) e remova quaisquer chaves do hCaptcha, se existirem
4. Salve as alterações

Observações:
- Não é necessário manter Site Key/Secret Key de hCaptcha
- O arquivo `src/lib/constants.ts` não expõe mais a HCAPTCHA_SITE_KEY

## Onde estão as proteções alternativas
- Auth (`src/pages/Auth.tsx`)
  - Honeypot: input oculto `website`
  - Tempo mínimo de preenchimento (1.2s)
  - Rate limiting local (10 tentativas em 10 min para login, 5/10 min para cadastro)
  - Validações simples (email/senha)
- Contato (`supabase/functions/send-contact-message/index.ts`)
  - Honeypot, verificação de origem, tempo mínimo, validação de conteúdo
  - Rate limiting por email e janela de tempo
  - Logs detalhados

## Reativar hCaptcha (opcional)
Se desejar futuramente:
- Reative Bot Protection em Authentication > Settings > Security > Bot Protection
- Atualize o frontend para incluir o widget (não recomendado no momento)

## Links úteis
- Supabase: Authentication > Providers (para configurar fornecedores e segurança)
- Supabase: Edge Functions (logs e monitoramento das funções)
