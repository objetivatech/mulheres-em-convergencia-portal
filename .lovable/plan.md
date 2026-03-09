

# Plano: 4 Melhorias — Regra de Eventos Online, Segmentos Mailrelay, Pontuação no Perfil, Documentação de Fluxos

## 1. Limitar Restrição de Convidado Apenas a Eventos ONLINE

**Problema:** A restrição atual bloqueia convidados de TODOS os eventos após primeiro check-in. Deveria ser apenas para eventos com `format = 'online'`.

**Alterações:**

### Edge Function `create-event-registration/index.ts`
- Adicionar condição: verificar se o evento atual é `format === 'online'` antes de aplicar bloqueio
- Verificar se `first_event_attended_at` foi marcado em evento online (não presencial)

### Migration SQL (trigger)
- Atualizar `update_guest_first_attendance()` para só marcar `first_event_attended_at` quando o evento associado é online:
```sql
-- Buscar formato do evento antes de atualizar
SELECT format INTO v_format FROM events 
WHERE id = (SELECT event_id FROM event_registrations WHERE id = NEW.id);
IF v_format = 'online' THEN ...
```

### Frontend
- Atualizar mensagem de bloqueio para mencionar "eventos online"

---

## 2. Sincronizar Roles como Segmentos/Grupos no Mailrelay

**Conceito:** Ao sincronizar contatos para o Mailrelay, buscar as roles do usuário na tabela `user_roles` e mapeá-las como **groups** (segmentos) no Mailrelay. Isso permite campanhas segmentadas por role.

### Edge Function `mailrelay-subscribers/index.ts`

**Nova action:** `sync_segments` — Cria grupos no Mailrelay para cada role existente (`admin`, `business_owner`, `subscriber`, `ambassador`, etc.)

**Alteração em `syncSubscribersFromSupabase`:**
1. Ao sincronizar cada subscriber, buscar suas roles via join `profiles.email → user_roles`
2. Mapear cada role para um grupo Mailrelay (criar se não existir)
3. Atribuir `group_ids` ao criar/atualizar subscriber no Mailrelay

**Fluxo:**
```text
1. Buscar/criar grupos no Mailrelay para cada app_role
2. Para cada subscriber sendo sincronizado:
   a. Buscar user_id pelo email na tabela profiles
   b. Buscar roles do user_id em user_roles
   c. Mapear roles → group_ids do Mailrelay
   d. Incluir group_ids no payload de criação/atualização
```

**Cache de grupos:** Manter mapa `role → mailrelay_group_id` em memória durante a execução para evitar chamadas repetidas à API.

---

## 3. Bloco de Pontuação no Perfil Conecta+

### `ConectaPerfil.tsx`

Adicionar novo Card **"Minhas Pontuações"** no modo visualização (após o pitch), contendo:

- Pontuação total e rank atual (já disponível em `conectaProfile`)
- Estatísticas detalhadas do `useConectaStats`:
  - Reuniões 1-a-1 realizadas
  - Depoimentos enviados / recebidos
  - Indicações enviadas / recebidas
  - Negócios fechados (quantidade + valor)
  - Presenças em encontros
- Posição no ranking mensal (buscar do `useConectaRanking`)

**Layout:** Grid 2x3 com mini-cards, cada um com ícone + valor + label. Card maior no topo com pontuação total + rank badge.

---

## 4. Documentação Detalhada dos Fluxos de Usuário

### Novo arquivo: `docs/_active/12-conecta/conecta-user-flows.md`

Documentação completa cobrindo:

1. **Fluxo do Convidado:**
   - Como chega: convite por membro OU inscrição em evento
   - Criação automática de conta (evento) ou aceite de convite
   - Acesso limitado: 1 evento online, funcionalidades restritas
   - Path para se tornar membro

2. **Fluxo do Membro:**
   - Acesso via assinatura (role `business_owner`)
   - Todas as funcionalidades: indicações, depoimentos, negócios, helpdesk
   - Convites ilimitados, eventos ilimitados

3. **Fluxo do Facilitador/Admin:**
   - Gestão de encontros, check-in, moderação helpdesk

4. **Mapa de Rotas:**
   - `/conecta` → Dashboard
   - `/conecta/encontros` → Encontros + Eventos sincronizados
   - `/conecta/perfil` → Perfil com pontuação
   - `/conecta/helpdesk` → Conselho 24/7
   - etc.

5. **Regras de Acesso por Funcionalidade** (tabela)

6. **Fluxo de Convites** (passo a passo com emails)

7. **Fluxo de Eventos** (inscrição → check-in → bloqueio convidado)

### Atualizar: `conecta-fluxos-revisados.md` e `conecta-guest-policy.md`
- Refletir nova regra "apenas online"
- Adicionar seção sobre segmentos Mailrelay

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/create-event-registration/index.ts` |
| Migration | Atualizar trigger `update_guest_first_attendance` |
| Editar | `supabase/functions/mailrelay-subscribers/index.ts` |
| Editar | `src/pages/conecta/ConectaPerfil.tsx` |
| Criar | `docs/_active/12-conecta/conecta-user-flows.md` |
| Editar | `docs/_active/12-conecta/conecta-fluxos-revisados.md` |
| Editar | `docs/_active/12-conecta/conecta-guest-policy.md` |

---

## Sugestão de Melhoria

**Dashboard de segmentos no admin:** Após implementar a sincronização de roles→grupos no Mailrelay, adicionar na página de Newsletter um indicador visual mostrando quantos contatos existem por segmento/role, facilitando a criação de campanhas direcionadas.

