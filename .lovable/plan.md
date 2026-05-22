## Objetivo

Adicionar um indicador visual de força da senha e bloquear cadastros/alterações quando a pontuação for inferior a 80/100, em todos os formulários do portal que criam ou alteram senha.

## Escopo (arquivos identificados)

Formulários onde a regra será aplicada:

1. `src/pages/Auth.tsx` — cadastro de novo usuário (sign-up).
2. `src/pages/ResetPassword.tsx` — redefinição via sessão autenticada.
3. `src/pages/ResetPasswordWithToken.tsx` — redefinição via token de email.
4. `src/components/user/ChangeEmailDialog.tsx` — quando exige senha nova/confirmação.
5. `src/pages/ConfiguracoesContaPage.tsx` — alteração de senha do perfil.
6. `src/components/admin/AddUserDialog.tsx` — criação de usuários pelo admin.
7. `src/components/subscriptions/CustomerInfoDialog.tsx` — se gerar senha do cliente.

Formulários que apenas pedem senha para login (não criação) ficam de fora: apenas onde há definição/alteração de senha.

## Componentes a criar

### 1. `src/lib/passwordStrength.ts`

Função pura `scorePassword(pwd: string): { score: number; checks: PasswordChecks; label: string }`.

Critérios (pontuação 0–100, soma ponderada):

- Comprimento ≥ 8 → 15 pts; ≥ 12 → +15; ≥ 16 → +10 (máx 40).
- Letra minúscula → 10 pts.
- Letra maiúscula → 15 pts.
- Número → 15 pts.
- Caractere especial (`!@#$%^&*()_+-=[]{};':"\\|,.<>/?~`) → 20 pts.
- Penalidades: sequências repetidas (`aaaa`, `1111`) ou sequenciais (`1234`, `abcd`) → −15 pts; senha em blacklist comum (`123456`, `senha`, `password`, etc.) → score = 0.

Labels: 0–39 "Fraca", 40–69 "Média", 70–79 "Boa", 80–100 "Forte".
Constante exportada `MIN_PASSWORD_SCORE = 80`.

### 2. `src/components/auth/PasswordStrengthMeter.tsx`

- Barra de progresso (Progress shadcn) colorida via tokens semânticos (`bg-destructive`, `bg-warning`, `bg-primary`, `bg-success` — adicionar tokens faltantes em `index.css` / `tailwind.config.ts` se necessário).
- Lista de requisitos com ícones Check/X (lucide) mostrando o que falta: comprimento mínimo, maiúscula, minúscula, número, caractere especial.
- Texto curto: "Força: Forte (85/100)".
- Props: `password: string`, opcional `onValidityChange?: (isStrong: boolean) => void`.

## Integração nos formulários

Em cada formulário listado:

- Importar `PasswordStrengthMeter` e renderizar abaixo do(s) campo(s) de senha (apenas quando o usuário começou a digitar).
- Importar `scorePassword` e `MIN_PASSWORD_SCORE`.
- Desabilitar o botão de submit enquanto `score < 80` (além das validações já existentes, como confirmação de senha).
- No handler de submit, validar novamente e exibir `toast` em PT-BR caso não atinja o mínimo: "Senha não atende aos requisitos mínimos de segurança."
- Preservar comportamentos atuais (confirmação de senha, captcha, recuperação, etc.) — somente adiciona uma camada de validação.

## Não-objetivos

- Não altera políticas no Supabase Auth (a regra é client-side; o backend continua aceitando o que o Auth permitir).
- Não altera formulários de login.
- Não mexe em fluxos do CRM, eventos, blog ou outros módulos.

## Verificação

- Preview manual em cada um dos 7 formulários: digitar senhas fracas e fortes, confirmar bloqueio < 80 e liberação ≥ 80.
- Build TS sem erros.
- Documentação rápida em `docs/_active/04-usuarios/password-strength-policy.md` descrevendo a regra e o limiar 80.

**IMPORTANTE**:

É preciso adicionar indicadores visuais em todos os formulário, tanto para o sucesso quanto para a falha na criação da senha. Devem haver mensagens para o usuário poder entender o que está ocorrendo. Essas mensagens indicativas devem aparecer logo abaixo do campo preenchido.