# Migração: Remoção do hCaptcha e desativação do Bot Protection

Com base na decisão do projeto, o hCaptcha foi removido e o Supabase Bot Protection deve permanecer desativado. Este guia descreve o que fazer e como diagnosticar eventuais problemas após a migração.

## Passo a passo

1) Desativar no Supabase
- Authentication > Settings > Security > Bot Protection
- Desative o toggle e remova qualquer Site/Secret Key configurada
- Salve

2) Limpar referências no código
- Não é mais necessário adicionar widgets ou chaves do hCaptcha no frontend
- O arquivo `src/lib/constants.ts` não expõe mais HCAPTCHA_SITE_KEY
- Formulários passaram a usar honeypot, tempo mínimo e limites de tentativas

3) Verificar o fluxo
- Auth (/auth): login/cadastro com proteções alternativas
- Forgot Password: sem captcha, segue fluxo do Supabase normalmente
- Contato: Edge Function com verificações adicionais e rate limiting por email

## Proteções alternativas ativas
- Honeypot (campo oculto `website`)
- Tempo mínimo de preenchimento (1.2s)
- Rate limiting local (Auth) e por email (Contato)
- Validações de formato e conteúdo
- Verificação de origem/CORS nas Edge Functions

## Troubleshooting pós-migração
- “Muitas tentativas”: aguarde o tempo indicado (rate limit local)
- “Envio muito rápido”: preencha o formulário normalmente (evita automação)
- Erros de email/senha: verifique formatação e requisitos mínimos

Se desejar reativar o hCaptcha no futuro, basta reabilitar o Bot Protection no Supabase e reintroduzir o widget no frontend.
