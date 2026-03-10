# Check-in Presencial via QR Code

## Visão Geral
Sistema de check-in presencial para eventos, utilizando QR Code que direciona participantes para uma página de confirmação de presença via CPF.

## Fluxo

### Admin (Geração do QR Code)
1. No painel Admin > Eventos, ao visualizar detalhes de um evento **presencial** ou **híbrido**, aparece o botão **"QR Check-in"**
2. Ao clicar, um Dialog exibe o QR Code com a URL: `https://mulheresemconvergencia.com.br/evento-checkin/{event_id}`
3. O QR Code pode ser impresso ou projetado no local do evento

### Participante (Check-in)
1. Escaneia o QR Code com o celular
2. Abre a página `/evento-checkin/:eventId`
3. Digita seu CPF (formatado automaticamente como 000.000.000-00)
4. Sistema busca inscrição na tabela `event_registrations` pelo CPF + event_id
5. Se encontrado: exibe nome e botão para confirmar presença
6. Ao confirmar: atualiza `checked_in_at` e `status = 'attended'`
7. Se já fez check-in: exibe aviso de check-in já realizado
8. Se CPF não encontrado: mensagem de erro

## Gamificação
- Membros ativos do CONECTA+ recebem **10 pontos** ao fazer check-in (trigger `trg_event_checkin_conecta_points`)
- O trigger é disparado quando `checked_in_at` muda de NULL para um valor

## Arquivos
- `src/pages/EventoCheckin.tsx` - Página pública de check-in
- `src/components/admin/crm/EventsManagement.tsx` - Botão QR no admin (usa `qrcode.react`)
- Migration SQL com trigger de pontuação

## Dependências
- `qrcode.react` - Geração de QR Code SVG
