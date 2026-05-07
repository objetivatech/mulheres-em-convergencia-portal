## Plano: correções e evolução do módulo de Eventos

Tratei cada item reportado pelas clientes mais melhorias complementares necessárias para que nada quebre nas integrações existentes (Asaas, CRM, Conecta+, Mailrelay, certificados, check-in QR).

---

### 1. Bug crítico — "evento não existe" após pagamento

**Causa identificada**: a edge function `create-event-payment` envia o cliente para `/eventos/confirmacao?registration=...` no `successUrl` do checkout Asaas, mas essa rota **não existe** no `App.tsx` (só existem `/confirmacao-pagamento` para assinaturas e `/confirmar-presenca` para check-in). O Asaas processa o pagamento normalmente, mas o cliente cai no `NotFound` — daí a sensação de que o evento sumiu.

**Correção**:
- Criar a rota e página `src/pages/EventoConfirmacaoPage.tsx` (`/eventos/confirmacao`) que:
  - lê `?registration=` da URL;
  - busca a `event_registration` + evento associado;
  - faz polling do status de pagamento (`paid`, `status`) por até ~60s;
  - mostra estados: processando, confirmado (com dados do evento), aguardando compensação (boleto/PIX) e erro;
  - dispara `send-event-email` para confirmação quando `paid=true` e ainda não enviada (idempotente via metadata).
- Manter o `successUrl` atual e adicionar fallback: se `registration` não existir, redirecionar para `/eventos` com toast explicativo (sem mais "evento não existe").
- Garantir que o webhook `asaas-webhook` (já existente, identifica pelo prefixo `event_registration_`) marca `paid=true` mesmo se o cliente não voltar ao site.

---

### 2. Imagem de capa no cadastro do evento

A coluna `events.image_url` **já existe** no banco, mas o formulário de admin não permite upload. Atualmente só fica acessível via metadata.

**Correção**:
- Adicionar campo "Imagem de capa" no `EventsManagement.tsx` usando `ImageCropUploader` com preset 16:9 (já padrão de blog/landing), salvo no R2 via `r2-storage` na pasta `event-covers/`.
- Renderizar a capa em `EventsPage.tsx` (cards) e `EventDetailPage.tsx` (hero), com fallback para imagem padrão.

---

### 3. Múltiplos palestrantes com bio

Hoje existe apenas `instructor_name` (text) e `instructor_id` (uuid).

**Correção (não destrutivo)**:
- Nova tabela `event_speakers`:
  - `id`, `event_id` (fk), `name`, `role` (palestrante/facilitador/convidado/instrutor), `bio` (text), `photo_url`, `linkedin_url`, `display_order`.
  - RLS: leitura pública para eventos publicados; escrita para admins / criadores do evento.
- Manter `instructor_name` como compatibilidade retroativa (preenchido com o primeiro speaker).
- UI no admin: aba "Palestrantes" no diálogo do evento, com lista drag-and-drop, foto (ImageCropUploader, 1:1), bio (Textarea curta), papel (Select).
- Front público (`EventDetailPage`): seção "Quem vai conduzir" listando todos os palestrantes com foto, papel e bio.

---

### 4. Venda por lotes

**Nova tabela `event_ticket_batches`**:
- `id`, `event_id`, `name` (ex: "1º lote"), `price` (numeric), `quantity` (int, opcional), `sold_count` (int, default 0), `starts_at`, `ends_at`, `display_order`, `active`.
- Trigger para incrementar `sold_count` quando `event_registrations.batch_id` for definido e `paid=true`.
- Lógica de seleção de lote ativo: por janela de datas e/ou esgotamento (passa para o próximo automaticamente).

**Mudanças correlatas**:
- `event_registrations`: nova coluna `batch_id` (uuid, fk, nullable — mantém compat).
- `create-event-payment`: receber `batch_id`, validar se está ativo, usar `batch.price` em vez de `event.price`. Decrementar disponibilidade ao falhar.
- UI admin: aba "Lotes" no evento (CRUD completo).
- UI pública (`EventDetailPage`): mostrar lote vigente, badge "X vagas restantes neste lote", e CTA com o preço correto.
- Pipeline financeiro/CRM: o `crm_deals.value` passa a refletir o valor do lote. Sem quebrar relatórios existentes (campo já é numeric).

---

### 5. Inscrição manual de participantes via pipeline

Solicitação: permitir que o admin adicione participantes (que pagaram ou não) e que o pipeline tenha um campo "evento de destino".

**Implementação**:
- **No CRM Pipeline (admin/crm/pipeline)**: ao criar/editar um deal no pipeline de eventos, novo campo `event_id` (Select com eventos publicados/futuros) e `mark_as_paid` (Switch).
- Ao mover o deal para o estágio "inscrito" (ou ao salvar com `event_id`), trigger/edge function cria automaticamente uma `event_registrations` vinculada ao lead (CPF como chave) com `status='confirmed'` e `paid` conforme o switch — sem cobrar Asaas.
- **Diretamente no evento**: novo botão "Adicionar participante" na aba Inscritos com diálogo (nome, email, CPF, telefone, paid sim/não, lote opcional) que reutiliza `crmIntegration.findOrCreateLead` + `event_registrations.insert`.
- Garantir que `current_participants` é atualizado pelo trigger existente, e que o lead recebe a interação `event_registration` no timeline.
- Email de confirmação opcional (checkbox no diálogo) via `send-event-email`.

---

### 6. Card de evento mostrando tags HTML

`EventsPage.tsx` linha 166 renderiza `{event.description}` cru — como agora a descrição vem do TinyMCE com HTML, aparece `<p>...</p>` no card.

**Correção**:
- Criar util `src/lib/stripHtml.ts` (regex segura `replace(/<[^>]*>/g,'')` + `decodeHtmlEntities`) e aplicar no card: `stripHtml(event.description).slice(0, 160)`.
- Mesma correção em qualquer outro local que liste eventos (Conecta+, homepage carrossel se existir).
- `EventDetailPage` permanece com `DOMPurify.sanitize` (já correto).

---

### Melhorias complementares sugeridas

1. **Validação de duplicidade de pagamento**: hoje o `create-event-payment` cria registration com `status=pending` antes de chamar o Asaas — se o cliente clicar 2x, gera 2 cobranças. Adicionar lookup por `event_id + email + status='pending'` nas últimas 24h e reaproveitar a `invoice_url` existente.
2. **Página de "minhas inscrições"** simples no `Meu Painel` listando eventos passados/futuros, status de pagamento e link para o ingresso/QR.
3. **Cupons já existentes (`useEventCoupons`)** passam a aceitar restrição por lote (campo opcional `batch_id`).
4. **Notificação ao admin**: quando o webhook Asaas confirma um pagamento de evento, disparar email para o owner do evento (opt-in).

---

### Conexões verificadas (não quebrar)

- **`asaas-webhook`**: continua identificando por `event_registration_` — mantemos o prefixo no `externalReference`.
- **`useCRMIntegration` / `crmIntegration`**: as funções `processEventRegistration`, `findOrCreateLead`, `createInteraction` continuam funcionando; apenas estendidas com `batch_id` opcional.
- **Pipeline `eventos`**: `crm_deals.value` segue numeric; novo campo `event_id` é JSON em `metadata` para evitar migração disruptiva, OU coluna nova nullable. Vou usar coluna nova para queries diretas.
- **Conecta+ check-in QR**: usa `event_registrations.cpf`; sem mudanças.
- **Certificados**: trigger por `status='attended'` permanece; sem mudanças.
- **Mailrelay**: `send-event-email` continua sendo o único ponto de envio.
- **SEO / sitemap dinâmico**: incluir `image_url` no schema.org Event.
- **Sincronia Conecta+**: `conecta_sync` permanece intocado; novos campos (image, speakers, batches) são lidos pelo Conecta automaticamente via `useEvents`.

---

### Arquivos que serão tocados

**Banco (1 migration)**
- Tabelas novas: `event_speakers`, `event_ticket_batches`.
- `event_registrations`: adicionar `batch_id`.
- `crm_deals`: adicionar `event_id` nullable + `auto_register_event` boolean.
- Trigger: `event_speakers` → atualiza `events.instructor_name` com o primeiro.
- Trigger: ao confirmar deal de evento com `event_id`, criar `event_registration`.
- RLS para todas as tabelas novas.

**Frontend**
- `src/components/admin/crm/EventsManagement.tsx` — capa, abas Palestrantes e Lotes, botão Adicionar participante.
- `src/components/admin/crm/EventSpeakersPanel.tsx` (novo).
- `src/components/admin/crm/EventBatchesPanel.tsx` (novo).
- `src/components/admin/crm/AddParticipantDialog.tsx` (novo).
- `src/components/admin/crm/PipelineDealForm.tsx` (ou equivalente) — campos `event_id` e `mark_as_paid`.
- `src/pages/EventsPage.tsx` — capa e `stripHtml`.
- `src/pages/EventDetailPage.tsx` — hero com capa, seção palestrantes, seletor de lote.
- `src/pages/EventoConfirmacaoPage.tsx` (novo) + rota em `App.tsx`.
- `src/hooks/useEvents.ts` — hooks novos: `useEventSpeakers`, `useEventBatches`, `useAddParticipantManual`.
- `src/lib/stripHtml.ts` (novo).

**Edge Functions**
- `create-event-payment`: aceitar `batch_id`, dedupe de pendentes, usar preço do lote.
- `send-event-email`: nada a alterar.

**Documentação**
- `docs/_active/06-funcionalidades/event-html-descriptions.md` — adicionar nota sobre `stripHtml` em listagens.
- `docs/_active/07-crm/eventos-publicos.md` — atualizar com lotes, palestrantes, capa, inscrição manual.
- Novo `docs/_active/07-crm/eventos-lotes-e-palestrantes.md` com a arquitetura completa.

---

### Ordem de execução proposta

1. Hotfix da rota `/eventos/confirmacao` + dedupe de pagamento (resolve a dor mais urgente).
2. Fix do HTML no card (1 linha).
3. Migration: speakers + batches + colunas em registrations/deals.
4. UI admin (capa, palestrantes, lotes, adicionar participante).
5. UI pública (capa, palestrantes, seletor de lote).
6. Integração pipeline → registration automática.
7. Documentação.

Posso prosseguir?
