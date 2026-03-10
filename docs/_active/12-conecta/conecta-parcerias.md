# CONECTA+ - Parcerias entre Membros

## Visão Geral

Recurso para registrar parcerias formadas entre membros do CONECTA+. Diferente de negócios fechados (que envolvem valores), as parcerias representam colaborações para criar novos serviços ou produtos em conjunto.

## Tabela: `conecta_partnerships`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | ID único |
| partner_a_id | uuid (FK → auth.users) | Quem registrou |
| partner_b_id | uuid (FK → auth.users) | Parceira |
| title | text | Nome da parceria/serviço |
| description | text | Descrição do que oferecem |
| category | text | servico, produto, projeto, evento, outro |
| photo_url | text | Imagem opcional |
| created_at | timestamptz | Data de criação |

**Constraint:** `partner_a_id != partner_b_id`

## Pontuação

- **+15 pts** para ambas as parceiras ao registrar
- Calculado automaticamente via trigger `trg_conecta_partnership_insert`
- Incluído na função `conecta_calculate_monthly_points`

## RLS Policies

- SELECT: Qualquer autenticado pode ver todas as parcerias
- INSERT: Apenas como `partner_a_id` (quem registra)
- DELETE: Apenas `partner_a_id` pode remover

## Rota

- `/conecta/parcerias` — Página de listagem e formulário
- Sidebar: item "Parcerias" no grupo "Atividades"

## Componentes

- `src/pages/conecta/ConectaParcerias.tsx` — Página principal
- `src/hooks/useConectaPartnerships.ts` — Hook de dados
- Formulário com seleção de membro, título, categoria e descrição
