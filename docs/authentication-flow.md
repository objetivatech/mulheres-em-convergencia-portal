# Fluxo de Autenticação (sem hCaptcha)

Este documento descreve o fluxo de autenticação atual, sem uso de hCaptcha. Proteções alternativas foram implementadas para reduzir automações e abuso.

## Fluxo resumido
- /auth com abas: Entrar e Cadastrar
- Redireciona usuários já logados para a página inicial
- Esqueceu a senha e redefinição de senha mantêm o fluxo padrão do Supabase

## Proteções alternativas no Auth
- Honeypot (input oculto `website`): envio é bloqueado se preenchido
- Tempo mínimo de preenchimento: rejeita submissões “instantâneas” (1.2s)
- Rate limiting local por dispositivo:
  - Login: até 10 tentativas por 10 minutos
  - Cadastro: até 5 tentativas por 10 minutos
- Validações adicionais de email e senha

## Componentes principais
- Página: `src/pages/Auth.tsx`
- Hook: `src/hooks/useAuth.ts`
- Proteção de rotas: `src/components/auth/ProtectedRoute.tsx`

## Boas práticas ativas
- Tokens e sessão gerenciados pelo Supabase com refresh automático
- RLS no banco para isolamento de dados por usuário
- Feedback de erros e estados de carregamento na UI

## Observações
- Bot Protection do Supabase está desativado por decisão de UX
- Caso detecte abuso, podemos elevar limites, adicionar validações, ou reativar hCaptcha
