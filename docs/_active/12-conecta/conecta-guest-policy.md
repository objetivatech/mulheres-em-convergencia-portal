# CONECTA+ - Política de Acesso de Convidados

## Visão Geral

Este documento descreve a política de acesso para convidados no CONECTA+, incluindo criação automática de conta e controle de participação em eventos.

---

## Níveis de Acesso

| Nível | Descrição | Acesso a Eventos |
|-------|-----------|------------------|
| `convidado` | Usuário criado via inscrição em evento | 1 evento (único) |
| `membro` | Assinante pagante | Ilimitado |
| `facilitadora` | Membro com funções de facilitação | Ilimitado |
| `admin` | Administradora do sistema | Ilimitado |

---

## Fluxo: Inscrição em Evento Público

### 1. Visitante Anônimo se Inscreve

```
/eventos/:slug → Formulário de inscrição
                 ↓
         Edge Function: create-event-registration
                 ↓
         ┌───────────────────┐
         │ Email já existe?  │
         └─────────┬─────────┘
                   │
          ┌───────┴───────┐
          ↓               ↓
       [SIM]           [NÃO]
          │               │
   Usa conta         Cria conta
   existente         + profile
          │          + conecta_profile
          │               │
          └───────┬───────┘
                  ↓
         Cria event_registration
                  ↓
         Envia email confirmação
         (com credenciais se novo)
```

### 2. Email de Boas-Vindas (Novos Usuários)

Quando uma conta é criada automaticamente, o email inclui:

- Confirmação da inscrição no evento
- Detalhes do evento (data, local, link)
- **Credenciais de acesso ao CONECTA+:**
  - Email do usuário
  - Senha temporária (12 caracteres)
  - Link direto para o portal
- Recomendação para alterar a senha

---

## Controle de Acesso Único

### Regra

> Convidados podem participar de **apenas 1 evento**. Após confirmação de presença (check-in), ficam bloqueados para novos eventos até se tornarem membros.

### Implementação Técnica

#### Campo de Controle
```sql
conecta_profiles.first_event_attended_at (timestamptz)
```

Este campo é preenchido automaticamente quando:
1. Admin realiza check-in (`checked_in_at` em `event_registrations`)
2. Trigger `trg_update_guest_attendance` detecta que é convidado
3. Campo atualizado apenas se ainda estiver NULL

#### Validação na Inscrição

```typescript
// Edge Function: create-event-registration
if (conectaProfile?.conecta_role === 'convidado' 
    && conectaProfile?.first_event_attended_at) {
  // Retorna erro 403
  return { error: "GUEST_EVENT_LIMIT_REACHED" };
}
```

### Mensagem de Bloqueio

Quando convidado tenta se inscrever após já ter participado:

> "Você já participou de um evento como convidada. Para participar de mais eventos, torne-se membro!"

---

## Cenários de Uso

### Cenário 1: Primeira Inscrição
1. Maria se inscreve no evento "Encontro de Networking"
2. Sistema cria conta com `conecta_role = 'convidado'`
3. Maria recebe email com credenciais
4. Maria comparece ao evento
5. Admin faz check-in
6. `first_event_attended_at` é preenchido

### Cenário 2: Tentativa de Segunda Inscrição
1. Maria tenta se inscrever em outro evento
2. Sistema detecta `conecta_role = 'convidado'` + `first_event_attended_at` preenchido
3. Retorna erro com mensagem sobre tornar-se membro
4. Maria é direcionada para página de planos

### Cenário 3: Convidado se Torna Membro
1. Maria assina plano de membro
2. Sistema atualiza `conecta_role = 'membro'`
3. Maria agora pode se inscrever em eventos ilimitados
4. Campo `first_event_attended_at` permanece como histórico

---

## FAQ

### P: E se o convidado não comparecer ao evento?
**R:** O bloqueio só ocorre após check-in confirmado. Se não comparecer, pode se inscrever em outro evento.

### P: Convidado pode cancelar inscrição e se inscrever em outro?
**R:** Sim, desde que não tenha feito check-in. O cancelamento remove a inscrição e libera nova tentativa.

### P: Como reverter o bloqueio manualmente?
**R:** Admin pode atualizar `conecta_profiles.first_event_attended_at = NULL` via Supabase Dashboard ou executar:
```sql
UPDATE conecta_profiles 
SET first_event_attended_at = NULL 
WHERE id = '<user_id>';
```

### P: O que acontece com inscrições feitas antes desta política?
**R:** Usuários existentes não são afetados até fazerem check-in em um novo evento. A política é aplicada prospectivamente.

---

## Diagrama de Estados

```
┌─────────────────┐
│   VISITANTE     │
│   (anônimo)     │
└────────┬────────┘
         │ Inscrição em evento
         ↓
┌─────────────────┐
│   CONVIDADO     │
│ first_event: ∅  │  ← Pode se inscrever
└────────┬────────┘
         │ Check-in confirmado
         ↓
┌─────────────────┐
│   CONVIDADO     │
│ first_event: ✓  │  ← BLOQUEADO para novos eventos
└────────┬────────┘
         │ Assina plano
         ↓
┌─────────────────┐
│    MEMBRO       │
│ first_event: ✓  │  ← Acesso ilimitado
└─────────────────┘
```

---

## Considerações de Segurança

1. **Validação server-side:** O controle é feito na Edge Function, não no frontend
2. **Idempotência:** Inscrições duplicadas retornam sucesso sem criar duplicatas
3. **Audit trail:** Campo `first_event_attended_at` serve como registro histórico
4. **Não-destrutivo:** Dados de convidados são mantidos mesmo após upgrade para membro
