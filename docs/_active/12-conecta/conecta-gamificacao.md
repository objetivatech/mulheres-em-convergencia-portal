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

Os pontos são calculados **mensalmente por equipe** através da função SQL `conecta_calculate_monthly_points(user_id, team_id, year_month)`. Essa função consulta diretamente as tabelas-fonte:

- `conecta_one_on_ones` (por `user_id`)
- `conecta_testimonials` (por `from_user_id`)
- `conecta_business_deals` (por `closed_by_user_id`, soma `value`)
- `conecta_referrals` (por `from_user_id`)
- `conecta_attendances` (join com `conecta_meetings`)
- `conecta_invitations` + `conecta_attendances` (convites aceitos presentes)
- `conecta_helpdesk_replies` (excluindo respostas em posts próprios)

### Triggers Automáticos

Cada ação dispara um trigger `AFTER INSERT` que:
1. Adiciona entrada no feed de atividades via `conecta_add_activity_feed()`
2. Recalcula pontos via `conecta_update_all_user_points()` → `conecta_update_monthly_points()`

**Triggers ativos:**
- `trg_conecta_one_on_one_insert` → `conecta_handle_one_on_one_insert()`
- `trg_conecta_testimonial_insert` → `conecta_handle_testimonial_insert()`
- `trg_conecta_business_deal_insert` → `conecta_handle_business_deal_insert()`
- `trg_conecta_referral_insert` → `conecta_handle_referral_insert()`
- `trg_conecta_attendance_insert` → `conecta_handle_attendance_insert()`
- `trg_conecta_helpdesk_reply_insert` → `conecta_handle_helpdesk_reply_insert()`

### Tabelas de Armazenamento

- **`conecta_monthly_points`**: Pontuação consolidada por user/team/mês com rank
- **`conecta_points_history`**: Log granular de alterações de pontos

### Frontend

- `ScoringRulesCard.tsx`: Exibe regras de pontuação (compact e full)
- `useConectaStats.ts`: Busca contadores para o dashboard do usuário
- `ConectaProfileStats.tsx`: Exibe stats no perfil
- `RankBadge.tsx`: Badge visual do rank atual
