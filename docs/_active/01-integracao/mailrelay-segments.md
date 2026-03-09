# Sincronização de Roles como Segmentos no Mailrelay

## Visão Geral

O sistema sincroniza automaticamente as **roles** dos usuários do portal como **grupos (segmentos)** no Mailrelay. Isso permite criar campanhas de email segmentadas por tipo de usuário.

---

## Mapeamento Role → Grupo

| Role (`user_roles`) | Grupo no Mailrelay |
|---------------------|-------------------|
| `admin` | [Role] Administradoras |
| `blog_editor` | [Role] Editoras do Blog |
| `business_owner` | [Role] Empresárias (Membros) |
| `subscriber` | [Role] Assinantes |
| `ambassador` | [Role] Embaixadoras |
| `student` | [Role] Alunas |
| `customer` | [Role] Clientes |
| `community_member` | [Role] Comunidade |
| `donor` | [Role] Doadoras |
| `sponsor` | [Role] Patrocinadoras |
| `mentor` | [Role] Mentoras |
| `volunteer` | [Role] Voluntárias |
| `staff` | [Role] Equipe |
| `partner` | [Role] Parceiras |
| `project_client` | [Role] Clientes de Projeto |

---

## Edge Function: `mailrelay-subscribers`

### Action: `sync_segments`

Sincroniza roles de todos os usuários como grupos no Mailrelay.

**Fluxo:**
1. Busca/cria grupos no Mailrelay para cada role (prefixo `[Role]`)
2. Busca todos os `user_roles` com join em `profiles` para obter emails
3. Para cada usuário:
   - Mapeia roles → group_ids do Mailrelay
   - Busca subscriber existente no Mailrelay
   - Cria ou atualiza subscriber com `group_ids` mesclados

**Chamada:**
```typescript
const { data } = await supabase.functions.invoke('mailrelay-subscribers', {
  body: null,
  headers: {},
});
// URL: ?action=sync_segments
```

### Action: `sync_to_mailrelay` (melhorado)

A sincronização regular agora também atribui grupos por role:

1. Coleta emails de todas as fontes
2. Busca/cria grupos no Mailrelay para cada role
3. Para cada subscriber pendente:
   - Busca `user_id` pelo email em `profiles`
   - Busca roles do `user_id` em `user_roles`
   - Mapeia roles → `group_ids`
   - Cria/atualiza subscriber com `group_ids`

---

## Logs

Todas as operações de sincronização são registradas em `mailrelay_sync_log`:

```json
{
  "operation_type": "sync_segments",
  "entity_type": "subscriber",
  "operation": "role_segments",
  "status": "success",
  "request_data": { "total_users": 42, "roles_mapped": 8 },
  "response_data": { "synced": 40, "failed": 2, "groups_created": 8 }
}
```

---

## Casos de Uso

### Campanha para Potenciais Membros
- Filtrar grupo `[Role] Comunidade` (community_member)
- Enviar promoção de adesão ao plano de membro

### Newsletter Exclusiva para Membros
- Filtrar grupo `[Role] Empresárias (Membros)` (business_owner)
- Conteúdo exclusivo, novidades do CONECTA+

### Comunicação com Embaixadoras
- Filtrar grupo `[Role] Embaixadoras` (ambassador)
- Relatórios de vendas, novos materiais

---

## Considerações Técnicas

1. **Cache de grupos:** O mapa `role → group_id` é mantido em memória durante cada execução
2. **Merge de grupos:** Ao atualizar subscriber, grupos existentes são preservados (merge, não substituição)
3. **Criação sob demanda:** Grupos são criados no Mailrelay automaticamente se não existirem
4. **Prefixo `[Role]`:** Distingue grupos automáticos de grupos manuais criados no Mailrelay
