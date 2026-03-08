# CONECTA+ - Ambiente de Networking

## Visão Geral

O CONECTA+ é o módulo de networking integrado ao portal MeC, inspirado na plataforma Gente Networking. Permite que empreendedoras registrem reuniões 1-a-1, troquem depoimentos, registrem negócios e indicações, participem de encontros em grupo e compitam em um ranking mensal gamificado.

## Níveis de Acesso

| Nível | Quem são | Acesso |
|-------|----------|--------|
| Admin | Admins MeC (`is_admin = true`) | Total + painel admin |
| Membro | Assinantes de planos ativos | Completo: reuniões, negócios, convites, ranking |
| Convidado | Qualquer usuário logado | Limitado: perfil, encontros (visualizar), conteúdos |

## Banco de Dados

15 tabelas com prefixo `conecta_` no mesmo Supabase do portal. Enums próprios (`conecta_role`, `conecta_rank`). Todas com RLS e SECURITY DEFINER functions.

## Sistema de Pontuação

| Atividade | Pontos |
|-----------|--------|
| Reunião 1-a-1 | 25 |
| Presença em encontro | 20 |
| Indicação | 20 |
| Depoimento | 15 |
| Convidado com presença | 15 |
| Negócio fechado | 5/R$100 |

### Ranks
- Iniciante: 0-49
- Bronze: 50-199
- Prata: 200-499
- Ouro: 500-999
- Diamante: 1000+

## Arquivos Principais

- `src/hooks/useConectaAccess.ts` - Hook de controle de acesso
- `src/components/conecta/ConectaLayout.tsx` - Layout com sidebar
- `src/components/conecta/ConectaSidebar.tsx` - Menu lateral
- `src/components/conecta/ConectaHeader.tsx` - Header do ambiente
- `src/pages/conecta/ConectaDashboard.tsx` - Dashboard principal
- `src/pages/conecta/ConectaPlaceholder.tsx` - Placeholder para módulos futuros
