
# Configuração do hCaptcha

## Erro: "captcha protection: request disallowed (sitekey-secret-mismatch)"

Isso ocorre quando a Site Key usada no frontend não corresponde à Secret Key configurada no Supabase Auth (Authentication > Settings > Security > Bot Protection) ou quando o domínio não está autorizado no painel do hCaptcha.

## Passo a passo para corrigir

1. Painel do hCaptcha
   - Em Sites, selecione sua site key.
   - Verifique a allowlist de domínios. Adicione:
     - `localhost` (para desenvolvimento)
     - Seu domínio de produção, ex: `seu-dominio.com`
   - Copie a Site Key correta.

2. Supabase
   - Em Authentication > Settings > Security > Bot Protection
   - Provider: hCaptcha
   - Cole a Site Key e a Secret Key correspondentes (da mesma propriedade criada no hCaptcha).
   - Salve.

3. Frontend
   - No arquivo `src/pages/Auth.tsx`, usamos:
     - Chave de teste automaticamente no `localhost`: `10000000-ffff-ffff-ffff-000000000001`
     - Sua chave real em produção: substitua a constante pela sua Site Key real (se ainda não for a correta).

4. Teste
   - Em desenvolvimento (localhost), a chave de teste deve funcionar sem erro.
   - Em produção, ao resolver o captcha, o login/cadastro devem funcionar sem o erro 400.

## Dicas de diagnóstico

- Se ver 400 em `auth/v1/token?grant_type=password` com mensagem `sitekey-secret-mismatch`, quase sempre é a Site Key incorreta ou Secret Key não correspondente no Supabase.
- Certifique-se de que não há espaços extras e que a site key usada no frontend é exatamente a mesma salva no Supabase.
- Verifique o domínio no dashboard do hCaptcha.

