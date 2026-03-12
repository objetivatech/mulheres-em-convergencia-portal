

# Auditoria Completa da Gamificação CONECTA+ — Plano de Correções

## Problemas Identificados

### Problema 1 (CRÍTICO): Usuários sem equipe = zero pontos
A função `conecta_update_all_user_points(_user_id)` faz um loop em `conecta_team_members WHERE user_id = _user_id`. Como a tabela `conecta_teams` está vazia (zero equipes, zero membros), o loop nunca executa e **nenhum ponto é gravado** em `conecta_monthly_points`.

### Problema 2: Triggers duplicados
Existem dois triggers por tabela executando a mesma função:
- `conecta_on_one_on_one_insert` + `trg_conecta_one_on_one_insert` (ambos chamam `conecta_handle_one_on_one_insert`)
- Idem para testimonials, business_deals, referrals, attendances

Resultado: quando existirem equipes, cada ação vai disparar o cálculo **duas vezes**.

### Problema 3: `conecta_profiles.points` nunca é atualizado
O frontend lê `conecta_profiles.points` para exibir a pontuação no dashboard, perfil e stats. Porém os triggers só escrevem em `conecta_monthly_points` — nunca atualizam `conecta_profiles.points` nem `conecta_profiles.rank`.

### Problema 4: Cálculo de presença depende de `team_id`
A query de presenças em `conecta_calculate_monthly_points` filtra por `m.team_id = _team_id OR m.team_id IS NULL`. Se o membro não está em nenhuma equipe, presenças com `team_id` definido são ignoradas.

---

## Plano de Correções

### 1. Migration SQL — Corrigir toda a mecânica

**a) Remover triggers duplicados:**
```sql
DROP TRIGGER IF EXISTS conecta_on_one_on_one_insert ON conecta_one_on_ones;
DROP TRIGGER IF EXISTS conecta_on_testimonial_insert ON conecta_testimonials;
DROP TRIGGER IF EXISTS conecta_on_business_deal_insert ON conecta_business_deals;
DROP TRIGGER IF EXISTS conecta_on_referral_insert ON conecta_referrals;
DROP TRIGGER IF EXISTS conecta_on_attendance_insert ON conecta_attendances;
```

**b) Reescrever `conecta_calculate_monthly_points` sem dependência de `team_id`:**
- Remover parâmetro `_team_id`
- Na query de presenças, contar TODAS as presenças do mês (sem filtro de equipe)
- Manter todas as demais regras iguais

**c) Reescrever `conecta_update_monthly_points` sem `team_id`:**
- Gravar em `conecta_monthly_points` com `team_id = NULL` (representando pontuação global)
- Após gravar, atualizar `conecta_profiles SET points = new_points, rank = new_rank WHERE id = _user_id`

**d) Simplificar `conecta_update_all_user_points`:**
- Em vez de iterar equipes, chamar diretamente `conecta_update_monthly_points(_user_id)` uma vez

**e) Criar função de recalculação em massa:**
```sql
CREATE FUNCTION conecta_recalculate_all_points(_year_month TEXT DEFAULT NULL)
```
Itera todos os usuários em `conecta_profiles` e recalcula seus pontos.

### 2. Recalcular pontos existentes
Executar a função de recalculação para o mês atual, para que o 1-on-1 já registrado (user `f546cc73...`) receba seus 25 pontos.

### 3. Atualizar frontend (hook `useConectaRanking`)
- A query de ranking deve funcionar com `team_id IS NULL` (pontuação global)
- Remover filtro `team_id` ou ajustar para buscar registros globais

### 4. Atualizar `conecta_monthly_points` constraint
- Verificar o UNIQUE constraint atual (`user_id, team_id, year_month`) — precisa aceitar `team_id = NULL` corretamente (usar COALESCE ou constraint parcial)

### 5. Documentação
- Atualizar `docs/_active/12-conecta/conecta-gamificacao.md` com a nova mecânica sem dependência de equipes

---

## Resumo das Mudanças

| Componente | Ação |
|------------|------|
| 5 triggers duplicados | Remover |
| `conecta_calculate_monthly_points` | Reescrever sem `_team_id` |
| `conecta_update_monthly_points` | Reescrever + sincronizar `conecta_profiles` |
| `conecta_update_all_user_points` | Simplificar (chamada direta) |
| `conecta_recalculate_all_points` | Criar (recalculação em massa) |
| `useConectaRanking.ts` | Ajustar query para pontuação global |
| `conecta-gamificacao.md` | Atualizar documentação |

