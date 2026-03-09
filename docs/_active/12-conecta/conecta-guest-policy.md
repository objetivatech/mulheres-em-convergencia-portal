# CONECTA+ - Política de Acesso de Convidados

## Visão Geral

Este documento descreve a política de acesso para convidados no CONECTA+, incluindo criação automática de conta e controle de participação em eventos.

---

## Níveis de Acesso

| Nível | Descrição | Acesso a Eventos Online | Acesso a Eventos Presenciais |
|-------|-----------|------------------------|------------------------------|
| `convidado` | Usuário criado via inscrição em evento | 1 evento online (único) | Ilimitado |
| `membro` | Assinante pagante | Ilimitado | Ilimitado |
| `facilitadora` | Membro com funções de facilitação | Ilimitado | Ilimitado |
| `admin` | Administradora do sistema | Ilimitado | Ilimitado |

---

## Regra Principal: Restrição APENAS para Eventos ONLINE

> ⚠️ **IMPORTANTE:** A restrição de participação única para convidados aplica-se **exclusivamente a eventos com `format = 'online'`**. Eventos presenciais (`format = 'presencial'` ou `'hibrido'`) não possuem essa restrição.

### Justificativa

- Eventos online têm custo marginal mais alto (licenças de plataforma, moderação remota)
- Eventos presenciais funcionam como porta de entrada e networking, sendo estratégicos para conversão
- Convidados que comparecem presencialmente têm maior probabilidade de se tornarem membros

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
         ┌─────────────────────┐
         │ Evento é ONLINE?    │
         └─────────┬───────────┘
                   │
          ┌───────┴───────┐
         SIM             NÃO
          │               │
   Verifica bloqueio   Prossegue
   de convidado        normalmente
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

## Controle de Acesso — Eventos Online

### Regra

> Convidados podem participar de **apenas 1 evento online**. Após confirmação de presença (check-in) em evento online, ficam bloqueados para novos eventos online até se tornarem membros. **Eventos presenciais não são afetados.**

### Implementação Técnica

#### Campo de Controle
```sql
conecta_profiles.first_event_attended_at (timestamptz)
```

Este campo é preenchido automaticamente quando:
1. Admin realiza check-in (`checked_in_at` em `event_registrations`)
2. Trigger `trg_update_guest_attendance` verifica:
   - O evento é `format = 'online'`?
   - O usuário é `conecta_role = 'convidado'`?
   - O campo `first_event_attended_at` ainda está NULL?
3. Se todas as condições forem verdadeiras, atualiza o campo

#### Trigger SQL

```sql
CREATE OR REPLACE FUNCTION update_guest_first_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_format text;
BEGIN
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Buscar formato do evento
    SELECT format INTO v_format FROM events WHERE id = NEW.event_id;
    
    -- Só marca se o evento for ONLINE
    IF v_format = 'online' THEN
      UPDATE conecta_profiles
      SET first_event_attended_at = NEW.checked_in_at
      WHERE id = NEW.user_id
        AND conecta_role = 'convidado'
        AND first_event_attended_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Validação na Inscrição

```typescript
// Edge Function: create-event-registration
// Só verifica bloqueio se o evento atual é ONLINE
if (event.format === 'online' 
    && conectaProfile?.conecta_role === 'convidado' 
    && conectaProfile?.first_event_attended_at) {
  return { error: "GUEST_EVENT_LIMIT_REACHED" };
}
```

### Mensagem de Bloqueio

Quando convidado tenta se inscrever em evento online após já ter participado:

> "Você já participou de um evento online como convidada. Para participar de mais eventos online, torne-se membro!"

---

## Cenários de Uso

### Cenário 1: Primeira Inscrição em Evento Online
1. Maria se inscreve no evento online "Workshop de Networking"
2. Sistema cria conta com `conecta_role = 'convidado'`
3. Maria recebe email com credenciais
4. Maria comparece ao evento online
5. Admin faz check-in
6. `first_event_attended_at` é preenchido

### Cenário 2: Tentativa de Segundo Evento Online
1. Maria tenta se inscrever em outro evento **online**
2. Sistema detecta `format = 'online'` + `conecta_role = 'convidado'` + `first_event_attended_at` preenchido
3. Retorna erro com mensagem sobre tornar-se membro
4. Maria é direcionada para página de planos

### Cenário 3: Inscrição em Evento Presencial (SEM BLOQUEIO)
1. Maria tenta se inscrever em evento **presencial**
2. Sistema verifica `format = 'presencial'` → **NÃO** aplica bloqueio
3. Inscrição é criada normalmente
4. Maria pode participar do evento presencial mesmo sendo convidada

### Cenário 4: Convidado se Torna Membro
1. Maria assina plano de membro
2. Sistema atualiza `conecta_role = 'membro'`
3. Maria agora pode se inscrever em eventos online e presenciais ilimitados
4. Campo `first_event_attended_at` permanece como histórico

---

## FAQ

### P: E se o convidado não comparecer ao evento online?
**R:** O bloqueio só ocorre após check-in confirmado. Se não comparecer, pode se inscrever em outro evento online.

### P: Convidado pode cancelar inscrição e se inscrever em outro?
**R:** Sim, desde que não tenha feito check-in. O cancelamento remove a inscrição e libera nova tentativa.

### P: Convidado bloqueado para online pode ir em eventos presenciais?
**R:** **Sim!** A restrição é exclusiva para eventos online. Eventos presenciais estão sempre liberados para convidados.

### P: Como reverter o bloqueio manualmente?
**R:** Admin pode atualizar via Supabase Dashboard:
```sql
UPDATE conecta_profiles 
SET first_event_attended_at = NULL 
WHERE id = '<user_id>';
```

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
│ first_event: ∅  │  ← Pode se inscrever (online e presencial)
└────────┬────────┘
         │ Check-in em evento ONLINE
         ↓
┌─────────────────┐
│   CONVIDADO     │
│ first_event: ✓  │  ← BLOQUEADO para novos eventos ONLINE
│                 │  ← Eventos presenciais continuam OK
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
2. **Condição de formato:** O bloqueio verifica `event.format === 'online'` tanto no trigger quanto na Edge Function
3. **Idempotência:** Inscrições duplicadas retornam sucesso sem criar duplicatas
4. **Audit trail:** Campo `first_event_attended_at` serve como registro histórico
5. **Não-destrutivo:** Dados de convidados são mantidos mesmo após upgrade para membro
