# Mecânica de Convites do CONECTA+

## Visão Geral

O sistema de convites permite que membros do CONECTA+ convidem pessoas para conhecer a comunidade através de **links únicos** e **códigos de convite**.

## Fluxo Completo

### 1. Criação do Convite (Membro)

- Membro acessa `/conecta/convites` e clica "Novo Convite"
- Informa nome e email (opcional) da convidada
- Sistema gera código único (`CONECTA-XXXXXX`) e link de convite
- Se email informado, envia convite automaticamente via Edge Function `send-conecta-email`

### 2. Link de Convite

**Formato**: `https://mulheresemconvergencia.lovable.app/conecta/convite/{code}`

- Rota pública acessível sem autenticação
- Página de landing exibe: nome da anfitriã, descrição do CONECTA+, benefícios do convite, botão de aceitar
- Se usuária não estiver logada, redireciona para login/cadastro com redirect de volta

### 3. Aceitação do Convite

- Usuária logada clica "Aceitar Convite"
- Sistema atualiza: `accepted_by`, `accepted_at`, `status = 'accepted'`
- Envia notificação por email à anfitriã (`guest_registered`)
- Redireciona para `/conecta`

### 4. Compartilhamento

Na página de convites, o membro pode:
- **Copiar link** do convite
- **Copiar código** do convite
- **Compartilhar via WhatsApp** (mensagem pré-formatada com link)

## Acessos do Convidado

| Recurso | Acesso |
|---------|--------|
| Dashboard CONECTA+ | ✅ |
| Perfil do membro | ✅ |
| Diretório de membros | ✅ |
| Conteúdos gratuitos | ✅ |
| Academy (aulas gratuitas/preview) | ✅ |
| Eventos online (check-in) | ✅ (1 evento apenas) |
| Indicações e negócios | ❌ |
| Ranking completo | ❌ |
| Academy completo | ❌ |

## Componentes

- **Landing page**: `src/pages/conecta/ConectaConviteLanding.tsx`
- **Página de convites**: `src/pages/conecta/ConectaConvites.tsx`
- **Hook**: `src/hooks/useConectaInvitations.ts`
- **Edge Function**: `supabase/functions/send-conecta-email/index.ts` (action: `invitation`)

## Email do Convite

Template com identidade visual MeC incluindo:
- Botão CTA "Aceitar Convite" com link direto
- Código de convite em destaque
- Link como texto para cópia
