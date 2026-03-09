

# Plano: Sincronização de Eventos no CONECTA+ e Controle de Acesso

## Diagnóstico Detalhado

### Problema 1: Dashboard não mostra eventos sincronizados
A query atual no Dashboard (linha 32-43) busca apenas de `conecta_meetings`:
```typescript
const { data: meetings } = useQuery({
  queryKey: ['conecta-upcoming-meetings'],
  queryFn: async () => {
    const { data } = await supabase
      .from('conecta_meetings') // ← Não inclui events!
      ...
```
Existe 1 evento com `conecta_sync = true` no banco que deveria aparecer.

### Problema 2: Interação com eventos incompleta
A página ConectaEncontros já tem lógica de inscrição/desinscrição, porém:
- Falta exibir status de check-in (presença confirmada)
- Falta botão de cancelar inscrição mais visível
- Não há modal de detalhes do evento

### Problema 3: Controle de presença não sincronizado
- Admin marca `checked_in_at` em `event_registrations`
- Conecta+ não exibe quem fez check-in em eventos sincronizados
- Usuário não vê seu próprio status de presença confirmada

### Problema 4: Inscrição em eventos não cria conta no portal
A Edge Function `create-event-registration`:
- Cria registro em `event_registrations` ✓
- Cria lead no CRM ✓
- **NÃO cria usuário em auth.users** ✗
- **NÃO cria profile** ✗
- **NÃO cria conecta_profile** ✗

### Problema 5: Convidados têm acesso ilimitado a eventos
Atualmente não há validação que impeça:
- Convidado que já participou (check-in confirmado) de se inscrever em novos eventos
- Apenas membros pagantes deveriam ter acesso livre

---

## Modelo de Dados Proposto

### Campos que já existem (sem alteração)
- `event_registrations.checked_in_at` → presença confirmada
- `event_registrations.user_id` → link com conta do portal (nullable)
- `conecta_profiles.conecta_role` → 'convidado' | 'membro' | 'admin'

### Campos a adicionar
```text
conecta_profiles:
└── first_event_attended_at (timestamptz, nullable) 
    → marca quando convidado fez 1º check-in
```

---

## Etapas de Implementação

### Etapa 1: Corrigir Dashboard — Exibir Eventos Sincronizados

**Arquivo:** `ConectaDashboard.tsx`

Criar nova query que combina `conecta_meetings` + `events` com `conecta_sync = true`:

```typescript
const { data: upcomingItems } = useQuery({
  queryKey: ['conecta-upcoming-all'],
  queryFn: async () => {
    // 1. Buscar meetings
    const { data: meetings } = await supabase
      .from('conecta_meetings')
      .select('id, title, meeting_date, meeting_time, location')
      .gte('meeting_date', today)
      .order('meeting_date', { ascending: true })
      .limit(3);
    
    // 2. Buscar eventos sincronizados
    const { data: events } = await supabase
      .from('events')
      .select('id, title, date_start, location, format, slug')
      .eq('conecta_sync', true)
      .eq('status', 'published')
      .gte('date_start', now)
      .order('date_start', { ascending: true })
      .limit(3);
    
    // 3. Unificar e ordenar por data
    return [...meetings, ...events].sort(byDate).slice(0,3);
  }
});
```

Renderização diferenciada: meetings manuais vs eventos do portal (badge "Portal").

---

### Etapa 2: Melhorar Interação na Página de Encontros

**Arquivo:** `ConectaEncontros.tsx`

Alterações no `EventCard`:
1. Mostrar badge de status: "Inscrita", "Presença Confirmada" (check-in feito)
2. Botão "Cancelar Inscrição" para eventos futuros (já inscrita)
3. Dialog de detalhes do evento (descrição completa, link de acesso)
4. Exibir lista de participantes que fizeram check-in (apenas para eventos passados)

Nova query para buscar registros com `checked_in_at`:
```typescript
// Junto com a query de eventos, buscar também:
const { data: myRegistrations } = await supabase
  .from('event_registrations')
  .select('id, event_id, checked_in_at, status')
  .eq('user_id', userId);
```

---

### Etapa 3: Sincronizar Presença Admin ↔ Conecta+

**Lógica:**
Os dados já estão na mesma tabela `event_registrations`. A sincronização é automática.

**Implementação:**
1. No Conecta+, mostrar lista de participantes com check-in em eventos passados
2. Badge verde "✓ Presente" para quem tem `checked_in_at`
3. Para facilitadores/admin: botão de check-in direto do Conecta+

**Novo componente:** `EventAttendeesList.tsx`
```text
Lista participantes de um evento:
├── Avatar + Nome
├── Status: Inscrito | Presente (verde)
└── Para admin: botão Check-in
```

---

### Etapa 4: Criar Conta no Portal ao Inscrever-se em Evento

**Arquivo:** `supabase/functions/create-event-registration/index.ts`

Nova lógica após criar registration:

```typescript
// 1. Verificar se já existe usuário pelo email
const { data: existingUser } = await supabaseClient
  .auth.admin.listUsers({ filter: { email } });

let userId = existingUser?.users?.[0]?.id;

if (!userId) {
  // 2. Criar usuário com senha temporária
  const tempPassword = generateTempPassword();
  const { data: newUser } = await supabaseClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // Já confirma email
    user_metadata: { full_name, phone, cpf },
  });
  userId = newUser.user?.id;

  // 3. Criar profile
  await supabaseClient.from('profiles').insert({
    id: userId,
    email,
    full_name,
    phone,
    cpf: cleanCpf,
  });

  // 4. Criar conecta_profile como convidado
  await supabaseClient.from('conecta_profiles').insert({
    id: userId,
    conecta_role: 'convidado',
    is_active: true,
  });

  // 5. Enviar email com credenciais de acesso
  // (Via Mailrelay - template "welcome_guest")
}

// 6. Atualizar registration com user_id
await supabaseClient
  .from('event_registrations')
  .update({ user_id: userId })
  .eq('id', registration.id);
```

**Email de boas-vindas:** Template com:
- Link de acesso ao portal
- Senha temporária (solicitar troca no 1º login)
- Instruções para acessar o CONECTA+

---

### Etapa 5: Controle de Acesso Único para Convidados

**Regra de negócio:**
- Convidado (`conecta_role = 'convidado'`) que JÁ participou de 1 evento (tem `checked_in_at` em qualquer `event_registration`) **não pode** se inscrever em novos eventos
- Ao tentar se inscrever, recebe mensagem: "Você já participou de um evento. Torne-se membro para participar de mais!"
- Apenas membros (`business_owner` role ou conecta_role = 'membro'/'admin') têm acesso livre

**Implementação no Edge Function:**
```typescript
// Antes de criar registration, verificar:
if (userId) {
  const { data: conectaProfile } = await supabaseClient
    .from('conecta_profiles')
    .select('conecta_role, first_event_attended_at')
    .eq('id', userId)
    .single();
  
  // Se é convidado E já participou de evento
  if (conectaProfile?.conecta_role === 'convidado' 
      && conectaProfile?.first_event_attended_at) {
    throw new Error('GUEST_EVENT_LIMIT_REACHED');
  }
}
```

**Atualização no check-in:**
Quando admin faz check-in, atualizar `conecta_profiles.first_event_attended_at`:
```typescript
// No useCheckIn (useEvents.ts)
if (userId && !conectaProfile?.first_event_attended_at) {
  await supabase
    .from('conecta_profiles')
    .update({ first_event_attended_at: new Date().toISOString() })
    .eq('id', userId);
}
```

**Frontend:** Mensagem amigável na tela de inscrição quando bloqueado.

---

### Etapa 6: Migration de Banco de Dados

```sql
-- Adicionar campo para rastrear 1ª participação de convidado
ALTER TABLE conecta_profiles 
ADD COLUMN IF NOT EXISTS first_event_attended_at timestamptz;

-- Trigger para atualizar automaticamente quando check-in é feito
CREATE OR REPLACE FUNCTION update_guest_first_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executa se for UPDATE de checked_in_at (de NULL para valor)
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    -- Atualizar conecta_profile se for convidado e ainda não tem data
    UPDATE conecta_profiles
    SET first_event_attended_at = NEW.checked_in_at
    WHERE id = NEW.user_id
      AND conecta_role = 'convidado'
      AND first_event_attended_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_guest_attendance
AFTER UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_guest_first_attendance();

-- Adicionar events às publicações realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
```

---

### Etapa 7: Documentação

**Atualizar:** `docs/_active/12-conecta/conecta-fluxos-revisados.md`

Adicionar seção:

```markdown
## 11. Integração com Eventos do Portal

**Sincronização:**
- Eventos com `conecta_sync = true` aparecem na dashboard e página Encontros
- Inscrições usam mesma tabela `event_registrations`
- Check-in pelo admin atualiza em tempo real no Conecta+

**Criação de conta automática:**
- Ao se inscrever em evento via /eventos, usuário recebe conta no portal
- Acesso inicial: "convidado" no Conecta+
- Email com senha temporária é enviado

**Controle de acesso único:**
- Convidados podem participar de apenas 1 evento
- Após check-in confirmado, novos eventos são bloqueados
- Membros pagantes têm acesso ilimitado
```

**Criar:** `docs/_active/12-conecta/conecta-guest-policy.md`
- Política detalhada de acesso de convidados
- FAQ para suporte

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `ConectaDashboard.tsx` | Query unificada meetings + events |
| `ConectaEncontros.tsx` | Status de check-in, cancelar inscrição, detalhes |
| `EventAttendeesList.tsx` | Novo componente para lista de presentes |
| `create-event-registration/index.ts` | Criar auth user + profile + conecta_profile |
| `useEvents.ts` | Atualizar first_event_attended_at no check-in |
| Migration | Novo campo + trigger + realtime tables |

---

## Sugestão Adicional: Email de Lembrete Pré-Evento

Aproveitar a implementação para adicionar no `send-conecta-email`:
- Template `event_reminder` enviado 24h antes do evento
- Incluir link de check-in QR code (futuro)
- Lembrete sobre política de cancelamento

