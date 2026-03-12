# CONECTA+ - Sistema de Gamificação

## Regras de Pontuação

| Ação | Pontos | Descrição |
|------|--------|-----------|
| Reunião 1-a-1 | 25 pts | Por reunião registrada |
| Depoimento enviado | 15 pts | Por depoimento escrito para outra membro |
| Indicação enviada | 20 pts | Por indicação/lead compartilhado |
| Presença em encontro | 20 pts | Por encontro com presença confirmada |
| Negócio fechado | 5 pts | Por cada R$ 100 de valor |
| Convite aceito + presente | 15 pts | Por convidada que compareceu a um encontro |
| Resposta no Conselho 24/7 | 5 pts | Apenas para quem responde (não o autor do post) |
| Parceria registrada | 15 pts | Por parceria criada (ambos os lados) |

## Rankings

| Rank | Pontos Mínimos |
|------|---------------|
| Iniciante | 0 |
| Bronze | 50 |
| Prata | 200 |
| Ouro | 500 |
| Diamante | 1000 |

## Arquitetura Técnica

### Cálculo de Pontos

Os pontos são calculados **mensalmente de forma global** (sem dependência de equipe) através da função SQL `conecta_calculate_monthly_points(user_id, year_month)`. Essa função consulta diretamente as tabelas-fonte:

- `conecta_one_on_ones` (por `user_id`)
- `conecta_testimonials` (por `from_user_id`)
- `conecta_business_deals` (por `closed_by_user_id`, soma `value`)
- `conecta_referrals` (por `from_user_id`)
- `conecta_attendances` (join com `conecta_meetings`, **todas** as presenças sem filtro de equipe)
- `conecta_invitations` + `conecta_attendances` (convites aceitos presentes)
- `conecta_helpdesk_replies` (excluindo respostas em posts próprios)
- `conecta_partnerships` (como `partner_a_id` ou `partner_b_id`)

### Fluxo de Pontuação

1. Usuário realiza ação (ex: registra 1-a-1)
2. Trigger `AFTER INSERT` dispara handler (ex: `conecta_handle_one_on_one_insert`)
3. Handler adiciona entrada no feed via `conecta_add_activity_feed()`
4. Handler chama `conecta_update_all_user_points(user_id, year_month)`
5. `conecta_update_all_user_points` chama `conecta_update_monthly_points(user_id, year_month)`
6. `conecta_update_monthly_points`:
   - Calcula pontos via `conecta_calculate_monthly_points()`
   - Determina rank via `conecta_get_rank_from_points()`
   - Faz UPSERT em `conecta_monthly_points` (com `team_id = NULL` para pontuação global)
   - **Sincroniza** `conecta_profiles.points` e `conecta_profiles.rank`

### Triggers Ativos (um por tabela)

| Trigger | Tabela | Handler |
|---------|--------|---------|
| `trg_conecta_one_on_one_insert` | `conecta_one_on_ones` | `conecta_handle_one_on_one_insert()` |
| `trg_conecta_testimonial_insert` | `conecta_testimonials` | `conecta_handle_testimonial_insert()` |
| `trg_conecta_business_deal_insert` | `conecta_business_deals` | `conecta_handle_business_deal_insert()` |
| `trg_conecta_referral_insert` | `conecta_referrals` | `conecta_handle_referral_insert()` |
| `trg_conecta_attendance_insert` | `conecta_attendances` | `conecta_handle_attendance_insert()` |
| `trg_conecta_helpdesk_reply_insert` | `conecta_helpdesk_replies` | `conecta_handle_helpdesk_reply_insert()` |
| `trg_conecta_partnership_insert` | `conecta_partnerships` | `conecta_handle_partnership_insert()` |

> **Nota**: Triggers duplicados (`conecta_on_*_insert`) foram removidos na migração de auditoria (2026-03-12).

### Tabelas de Armazenamento

- **`conecta_monthly_points`**: Pontuação consolidada por user/mês com rank. Campo `team_id` é nullable (NULL = pontuação global).
  - Unique index: `(user_id, COALESCE(team_id, '00000000-...'), year_month)`
- **`conecta_profiles`**: `points` e `rank` são sincronizados automaticamente pelos triggers (reflete o mês atual).
- **`conecta_points_history`**: Log granular de alterações de pontos (não utilizado atualmente pelos triggers, disponível para auditoria).

### Funções de Recalculação

- `conecta_recalculate_all_points(year_month)`: Recalcula pontos de **todos** os membros para um mês específico. Retorna quantidade de perfis processados.
- Uso: `SELECT conecta_recalculate_all_points('2026-03');`

### Frontend

- `useConectaRanking.ts`: Busca ranking mensal filtrando `team_id IS NULL` (pontuação global) ou por equipe específica.
- `ConectaProfileStats.tsx`: Exibe stats no perfil (lê de `conecta_profiles.points`)
- `useConectaStats.ts`: Busca contadores detalhados para o dashboard
- `RankBadge.tsx`: Badge visual do rank atual
- `ScoringRulesCard.tsx`: Exibe regras de pontuação (compact e full)

### Correções Aplicadas (2026-03-12)

1. **Removida dependência de equipes**: Pontuação agora é global — funciona sem necessidade de `conecta_teams`/`conecta_team_members`.
2. **Removidos triggers duplicados**: 5 triggers redundantes que causariam cálculo duplo.
3. **Sincronização de perfil**: `conecta_profiles.points` e `rank` agora são atualizados automaticamente a cada ação.
4. **Handlers corrigidos**: `testimonial` e `referral` handlers agora passam `year_month` corretamente.
5. **Presenças sem filtro de equipe**: Todas as presenças do mês são contabilizadas.
