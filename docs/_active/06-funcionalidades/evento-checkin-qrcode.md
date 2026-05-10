# Check-in Presencial e Walk-in

_Última atualização: 09/05/2026_

## Visão Geral
Sistema de check-in presencial para eventos, utilizando QR Code que direciona participantes para uma página de confirmação de presença via CPF. Inclui suporte a **walk-in**: registro de presença de pessoas que não se inscreveram previamente.

## Fluxo

### Admin (Geração do QR Code)
1. No painel Admin > Eventos, ao visualizar detalhes de um evento **presencial** ou **híbrido**, aparece o botão **"QR Check-in"**
2. Ao clicar, um Dialog exibe o QR Code com a URL: `https://mulheresemconvergencia.com.br/evento-checkin/{event_id}`
3. O QR Code pode ser impresso ou projetado no local do evento

### Participante Inscrito (Check-in)
1. Escaneia o QR Code com o celular
2. Abre a página `/evento-checkin/:eventId`
3. Digita seu CPF (formatado automaticamente como 000.000.000-00)
4. Sistema busca inscrição na tabela `event_registrations` pelo CPF + event_id
5. Se encontrado: exibe nome e botão para confirmar presença
6. Ao confirmar: atualiza `checked_in_at` e `status = 'attended'`
7. Se já fez check-in: exibe aviso de check-in já realizado

### Walk-in (CPF Não Encontrado)
1. Ao buscar um CPF não cadastrado, aparece mensagem de "Inscrição não encontrada" com botão **"Registrar Walk-in"**
2. Ao clicar, exibe formulário com campos: **Nome completo** (obrigatório), **Email** (obrigatório), **Telefone** (opcional)
3. O CPF digitado é reaproveitado automaticamente
4. Ao confirmar:
   - Se já existe `event_registration` com aquele CPF (ex.: inscrição cancelada): reativa o registro com `status = 'attended'` e `checked_in_at = NOW()`
   - Se não existe: cria novo registro com `metadata: { walk_in: true }` e `paid = false`
5. Registra interação no CRM como `walk_in` (best-effort — falha não bloqueia o check-in)
6. Exibe tela de sucesso "Walk-in Registrado!"

### Botão de Dados Socioeconômicos (Admin)
Na lista de inscritos (`EventsManagement.tsx`), cada participante tem o ícone **"Dados socioeconômicos"** (`BarChart3`). Ao clicar, abre `SocioeconomicDataDialog` para coletar ou visualizar dados socioeconômicos do inscrito. Ver doc: [`coleta-dados-socioeconomicos.md`](./coleta-dados-socioeconomicos.md).

## Gamificação
- Membros ativos do CONECTA+ recebem **10 pontos** ao fazer check-in (trigger `trg_event_checkin_conecta_points`)
- O trigger é disparado quando `checked_in_at` muda de NULL para um valor

## Políticas RLS

| Operação | Quem pode | Condição |
|----------|-----------|----------|
| SELECT por evento + CPF | Público (anônimo) | `event_id = X AND cpf = Y` (via `.eq()`) |
| INSERT (walk-in) | Público (anônimo) | Sem restrição extra além do schema |
| UPDATE (check-in) | Admins + público walk-in | Admins: irrestrito; Público: `user_id IS NULL` |

> A política `"Anyone can update walkin registrations"` cobre o caso de reativação de inscrição existente com `user_id IS NULL`. Inscrições de usuários logados (`user_id IS NOT NULL`) só podem ser atualizadas por admins.

## Arquivos
- `src/pages/EventoCheckin.tsx` — Página pública de check-in + walk-in
- `src/components/admin/crm/EventsManagement.tsx` — Botão QR e botão de dados socioeconômicos
- `src/components/admin/crm/SocioeconomicDataDialog.tsx` — Dialog de coleta socioeconômica
- `supabase/migrations/20260509150000_checkin_walkin_rls_fix.sql` — Policy UPDATE para walk-in
- Migration SQL com trigger de pontuação (`trg_event_checkin_conecta_points`)

## Dependências
- `qrcode.react` — Geração de QR Code SVG
